// js/auth.js - Sistema de Autenticação Firebase - MúsicosBooking.pt
// TAREFA 1.2 - Implementar Firebase Auth Real

/**
 * Sistema de Autenticação completo com Firebase
 * - Login/Logout
 * - Registo de utilizadores
 * - Recuperação de password
 * - Gestão de sessão
 * - Persistência de estado de autenticação
 */

class AuthSystem {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.authStateListeners = [];
        this.initialized = false;
    }

    /**
     * Inicializa o sistema de autenticação
     * @param {Object} firebaseAuth - Instância do Firebase Auth
     * @param {Object} firestore - Instância do Firestore
     */
    async initialize(firebaseAuth, firestore) {
        try {
            this.auth = firebaseAuth;
            this.db = firestore;

            // Observer de mudança de estado de autenticação
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    // Utilizador autenticado
                    await this.handleAuthStateChange(user);
                } else {
                    // Utilizador não autenticado
                    this.currentUser = null;
                    this.notifyListeners(null);
                }
            });

            this.initialized = true;
            console.log('✅ Sistema de autenticação inicializado');
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de autenticação:', error);
            throw error;
        }
    }

    /**
     * Handle quando o estado de autenticação muda
     */
    async handleAuthStateChange(firebaseUser) {
        try {
            // Busca dados adicionais do utilizador no Firestore
            const userDoc = await this.db.collection('users').doc(firebaseUser.uid).get();
            
            if (userDoc.exists) {
                this.currentUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified,
                    ...userDoc.data()
                };
            } else {
                // Se não existir no Firestore, cria registo básico
                this.currentUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified
                };
            }

            this.notifyListeners(this.currentUser);
        } catch (error) {
            console.error('Erro ao carregar dados do utilizador:', error);
        }
    }

    /**
     * Login com email e password
     */
    async login(email, password, rememberMe = false) {
        try {
            // Validação de inputs
            if (!email || !password) {
                throw new Error('Email e password são obrigatórios');
            }

            // Persistência de sessão
            const persistence = rememberMe 
                ? this.auth.Auth.Persistence.LOCAL 
                : this.auth.Auth.Persistence.SESSION;
            
            await this.auth.setPersistence(persistence);

            // Autentica com Firebase
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Busca dados do utilizador
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                throw new Error('Dados do utilizador não encontrados');
            }

            const userData = userDoc.data();

            // Atualiza último login
            await this.db.collection('users').doc(user.uid).update({
                lastLogin: new Date(),
                lastLoginIP: await this.getClientIP()
            });

            console.log('✅ Login realizado com sucesso');
            
            return {
                success: true,
                user: user,
                userData: userData
            };
        } catch (error) {
            console.error('❌ Erro no login:', error);
            
            // Mensagens de erro amigáveis
            let errorMessage = 'Erro ao fazer login';
            
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Email ou password incorretos';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Esta conta foi desativada';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Demasiadas tentativas. Tente novamente mais tarde';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Registo de novo utilizador
     */
    async register(email, password, userData) {
        try {
            // Validação
            if (!email || !password) {
                throw new Error('Email e password são obrigatórios');
            }

            if (password.length < 6) {
                throw new Error('Password deve ter pelo menos 6 caracteres');
            }

            if (!userData.nome || !userData.tipo) {
                throw new Error('Nome e tipo de utilizador são obrigatórios');
            }

            // Cria utilizador no Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Cria documento do utilizador no Firestore
            await this.db.collection('users').doc(user.uid).set({
                email: email,
                nome: userData.nome,
                tipo: userData.tipo, // 'musico' ou 'empresa'
                telefone: userData.telefone || '',
                createdAt: new Date(),
                emailVerified: false,
                active: true,
                lastLogin: new Date()
            });

            // Envia email de verificação
            await user.sendEmailVerification();

            console.log('✅ Utilizador registado com sucesso');
            
            return {
                success: true,
                user: user,
                message: 'Registo realizado! Verifique o seu email.'
            };
        } catch (error) {
            console.error('❌ Erro no registo:', error);
            
            let errorMessage = 'Erro ao registar utilizador';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este email já está registado';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email inválido';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password demasiado fraca';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            console.log('✅ Logout realizado');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            throw new Error('Erro ao fazer logout');
        }
    }

    /**
     * Recuperar password
     */
    async recuperarPassword(email) {
        try {
            if (!email) {
                throw new Error('Email é obrigatório');
            }

            await this.auth.sendPasswordResetEmail(email);
            
            console.log('✅ Email de recuperação enviado');
            return {
                success: true,
                message: 'Email de recuperação enviado com sucesso'
            };
        } catch (error) {
            console.error('❌ Erro ao recuperar password:', error);
            
            let errorMessage = 'Erro ao enviar email de recuperação';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'Email não encontrado';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido';
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Verifica se utilizador está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Obtém utilizador atual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Adiciona listener de mudança de estado
     */
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
        
        // Chama callback imediatamente se já houver utilizador
        if (this.currentUser) {
            callback(this.currentUser);
        }
    }

    /**
     * Notifica todos os listeners
     */
    notifyListeners(user) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Erro no listener de autenticação:', error);
            }
        });
    }

    /**
     * Obtém IP do cliente (se disponível)
     */
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Verifica tipo de utilizador
     */
    isMusico() {
        return this.currentUser && this.currentUser.tipo === 'musico';
    }

    isSempresa() {
        return this.currentUser && this.currentUser.tipo === 'empresa';
    }
}

// Exporta instância global
window.authSystem = new AuthSystem();

console.log('📦 Auth System carregado');
