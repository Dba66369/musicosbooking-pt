/**
 * SISTEMA DE AUTENTICAÇÃO - MUSICOSBOOKING.PT
 * Firebase Authentication + Firestore
 */

class AuthSystem {
  constructor() {
    this.auth = window.firebaseAuth;
    this.db = window.firebaseDb;
    this.currentUser = null;

    // Listener de estado de autenticação
    this.auth.onAuthStateChanged((user) => {
      this.handleAuthStateChange(user);
    });
  }

  /**
   * REGISTO DE NOVO UTILIZADOR
   */
  async registar(dados) {
    try {
      // Validações
      if (!window.isValidEmail(dados.email)) {
        throw new Error('Email inválido');
      }

      if (!window.isValidPassword(dados.password)) {
        throw new Error('Password deve ter mínimo 8 caracteres, 1 maiúscula e 1 número');
      }

      if (dados.password !== dados.confirmPassword) {
        throw new Error('As passwords não coincidem');
      }

      if (!['musico', 'empresa'].includes(dados.tipo)) {
        throw new Error('Tipo de utilizador inválido');
      }

      // Rate limiting
      window.checkRateLimit('register', 3, 60 * 60 * 1000); // 3 tentativas por hora

      // Criar utilizador no Firebase Auth
      const userCredential = await this.auth.createUserWithEmailAndPassword(
        dados.email,
        dados.password
      );

      const user = userCredential.user;

      // Enviar email de verificação
      await user.sendEmailVerification({
        url: `${window.location.origin}/login.html?verified=true`,
        handleCodeInApp: false
      });

      // Criar documento no Firestore
      await this.db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: window.sanitizeInput(dados.email),
        tipo: dados.tipo,
        nome: window.sanitizeInput(dados.nome),
        telefone: window.sanitizeInput(dados.telefone || ''),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        emailVerified: false,
        ativo: true
      });

      // Se for músico, criar perfil de músico
      if (dados.tipo === 'musico') {
        await this.db.collection('musicos').doc(user.uid).set({
          uid: user.uid,
          nome: window.sanitizeInput(dados.nome),
          email: dados.email,
          telefone: window.sanitizeInput(dados.telefone || ''),
          genero: '',
          descricao: '',
          preco: 0,
          localizacao: '',
          disponivel: true,
          verificado: false,
          rating: 0,
          totalAvaliacoes: 0,
          fotoPerfil: '',
          fotos: [],
          videos: [],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Limpar rate limit após sucesso
      window.clearRateLimit('register');

      return {
        success: true,
        message: 'Registo efetuado! Verifique o seu email para ativar a conta.',
        user: user
      };

    } catch (error) {
      console.error('Erro no registo:', error);

      let errorMessage = 'Erro ao criar conta. Tente novamente.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está registado. Faça login ou recupere a password.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password demasiado fraca. Use pelo menos 8 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * LOGIN
   */
  async login(email, password, rememberMe = false) {
    try {
      if (!window.isValidEmail(email)) {
        throw new Error('Email inválido');
      }

      if (!password || password.length < 6) {
        throw new Error('Password inválida');
      }

      // Rate limiting
      window.checkRateLimit('login', 5, 15 * 60 * 1000); // 5 tentativas em 15 min

      // Definir persistência
      const persistence = rememberMe
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION;

      await this.auth.setPersistence(persistence);

      // Fazer login
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Buscar dados do utilizador
      const userDoc = await this.db.collection('users').doc(user.uid).get();

      if (!userDoc.exists) {
        throw new Error('Dados de utilizador não encontrados');
      }

      const userData = userDoc.data();

      // Verificar se conta está ativa
      if (userData.ativo === false) {
        await this.auth.signOut();
        throw new Error('Conta desativada. Contacte o suporte.');
      }

      // Atualizar último login
      await this.db.collection('users').doc(user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Limpar rate limit após sucesso
      window.clearRateLimit('login');

      return {
        success: true,
        user: user,
        userData: userData
      };

    } catch (error) {
      console.error('Erro no login:', error);

      let errorMessage = 'Erro ao fazer login. Tente novamente.';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Utilizador não encontrado. Verifique o email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password incorreta.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas falhadas. Tente mais tarde ou recupere a password.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * LOGOUT
   */
  async logout() {
    try {
      await this.auth.signOut();

      // Limpar dados locais
      localStorage.removeItem('userType');
      localStorage.removeItem('userName');
      sessionStorage.clear();

      // Redirecionar para home
      window.location.href = '/index.html';

      return { success: true };

    } catch (error) {
      console.error('Erro no logout:', error);
      throw new Error('Erro ao terminar sessão');
    }
  }

  /**
   * RECUPERAR PASSWORD
   */
  async recuperarPassword(email) {
    try {
      if (!window.isValidEmail(email)) {
        throw new Error('Email inválido');
      }

      // Rate limiting
      window.checkRateLimit('password_reset', 3, 60 * 60 * 1000); // 3 por hora

      await this.auth.sendPasswordResetEmail(email, {
        url: `${window.location.origin}/login.html`,
        handleCodeInApp: false
      });

      window.clearRateLimit('password_reset');

      return {
        success: true,
        message: 'Email de recuperação enviado! Verifique a sua caixa de entrada.'
      };

    } catch (error) {
      console.error('Erro ao recuperar password:', error);

      // Por segurança, não revelar se email existe
      return {
        success: true,
        message: 'Se o email existir, receberá instruções de recuperação.'
      };
    }
  }

  /**
   * VERIFICAR ESTADO DE AUTENTICAÇÃO
   */
  async handleAuthStateChange(user) {
    this.currentUser = user;

    if (user) {
      try {
        const userDoc = await this.db.collection('users').doc(user.uid).get();

        if (userDoc.exists) {
          const userData = userDoc.data();

          // Atualizar status de verificação de email
          if (user.emailVerified && !userData.emailVerified) {
            await this.db.collection('users').doc(user.uid).update({
              emailVerified: true,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          }

          // Guardar tipo de utilizador
          localStorage.setItem('userType', userData.tipo);
          localStorage.setItem('userName', userData.nome);
          localStorage.setItem('userEmail', user.email);
          localStorage.setItem('emailVerified', user.emailVerified);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do utilizador:', error);
      }
    } else {
      localStorage.removeItem('userType');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('emailVerified');
    }
  }
}

// Inicializar sistema de autenticação
const authSystem = new AuthSystem();
window.authSystem = authSystem;
