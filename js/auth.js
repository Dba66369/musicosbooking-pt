// js/auth.js - Sistema de Autenticação Firebase Completo
import { auth, db } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { SECURITY_CONFIG, ADMIN_EMAIL } from './config/firebase.config.js';

class AuthSystem {
  constructor() {
    this.currentUser = null;
    this.loginAttempts = new Map();
  }

  // VALIDAÇÕES
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }
  }

  validatePassword(password) {
    if (password.length < SECURITY_CONFIG.passwordMinLength) {
      throw new Error(`Password deve ter pelo menos ${SECURITY_CONFIG.passwordMinLength} caracteres`);
    }
  }

  async checkEmailExists(email) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  // RATE LIMITING
  isLockedOut(email) {
    const attempt = this.loginAttempts.get(email);
    if (!attempt) return false;
    if (attempt.count >= SECURITY_CONFIG.maxLoginAttempts) {
      const timePassed = Date.now() - attempt.timestamp;
      return timePassed < SECURITY_CONFIG.lockoutDuration;
    }
    return false;
  }

  getLockoutTime(email) {
    const attempt = this.loginAttempts.get(email);
    if (!attempt) return 0;
    const timePassed = Date.now() - attempt.timestamp;
    const remaining = SECURITY_CONFIG.lockoutDuration - timePassed;
    return Math.ceil(remaining / 60000);
  }

  recordLoginAttempt(email, success = false) {
    if (success) {
      this.loginAttempts.delete(email);
      return;
    }
    const attempt = this.loginAttempts.get(email) || { count: 0, timestamp: Date.now() };
    attempt.count++;
    this.loginAttempts.set(email, attempt);
  }

  // AUTENTICAÇÃO
  async register(email, password, userType, additionalData = {}) {
    try {
      this.validateEmail(email);
      this.validatePassword(password);

      if (!['musician', 'company'].includes(userType)) {
        throw new Error('Tipo de utilizador inválido');
      }

      const emailExists = await this.checkEmailExists(email);
      if (emailExists) {
        throw new Error('Este email já está registado. Use outro ou faça login.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Criar documento do utilizador
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email.toLowerCase(),
        emailVerified: false,
        userType: userType,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        status: 'active',
        profile: {
          name: additionalData.name || '',
          phone: additionalData.phone || '',
          city: additionalData.city || ''
        }
      });

      // Criar documento específico por tipo
      if (userType === 'musician') {
        await setDoc(doc(db, 'musicians', user.uid), {
          userId: user.uid,
          bio: '',
          specialty: additionalData.specialty || '',
          experience: 0,
          pricePerEvent: 0,
          photo: '',
          social: { instagram: '', facebook: '', youtube: '', soundcloud: '', website: '' },
          stats: { totalBookings: 0, totalEarnings: 0, avgRating: 0, totalReviews: 0 },
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(doc(db, 'companies', user.uid), {
          userId: user.uid,
          companyName: additionalData.companyName || '',
          nif: additionalData.nif || '',
          address: additionalData.address || '',
          createdAt: serverTimestamp()
        });
      }

      // Enviar email de verificação
      await sendEmailVerification(user);

      // Log de registo
      await this.logActivity('user_registered', user.uid, { email, userType });

      // Notificar admin (via Cloud Function depois)
      console.log('User registered:', user.uid);

      return {
        success: true,
        user: user,
        message: 'Registo efetuado com sucesso! Verifique o seu email para ativar a conta.'
      };
    } catch (error) {
      console.error('Erro no registo:', error);
      throw this.handleAuthError(error);
    }
  }

  async login(email, password) {
    try {
      // Verificar rate limiting
      if (this.isLockedOut(email)) {
        throw new Error(`Muitas tentativas falhadas. Tente novamente em ${this.getLockoutTime(email)} minutos.`);
      }

      this.validateEmail(email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar email verificado
      if (SECURITY_CONFIG.requireEmailVerification && !user.emailVerified) {
        await signOut(auth);
        throw new Error('Por favor, verifique o seu email antes de fazer login. Verifique a caixa de spam.');
      }

      // Atualizar lastLogin
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      });

      // Log de login
      await this.logActivity('user_login', user.uid, { email });

      // Limpar tentativas de login
      this.recordLoginAttempt(email, true);

      // Buscar dados do utilizador
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      return {
        success: true,
        user: user,
        userType: userData.userType,
        message: 'Login efetuado com sucesso!'
      };
    } catch (error) {
      this.recordLoginAttempt(email, false);
      console.error('Erro no login:', error);
      throw this.handleAuthError(error);
    }
  }

  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      return { success: true, message: 'Logout efetuado com sucesso!' };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async sendPasswordReset(email) {
    try {
      this.validateEmail(email);
      await sendPasswordResetEmail(auth, email);
      await this.logActivity('password_reset_requested', null, { email });
      return { success: true, message: 'Email de recuperação de password enviado com sucesso!' };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  async deleteAccount(uid, deleteReason = '') {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      const userData = userDoc.data();

      // Marcar conta como deletada (soft delete)
      await updateDoc(doc(db, 'users', uid), {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        deleteReason: deleteReason
      });

      // Log de deleção
      await this.logActivity('user_deleted', uid, {
        email: userData.email,
        userType: userData.userType,
        reason: deleteReason
      });

      console.log('Account marked as deleted:', uid);

      return { success: true, message: 'Conta deletada com sucesso!' };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // LOGGING E ADMIN
  async logActivity(type, userId, metadata = {}) {
    try {
      await setDoc(doc(collection(db, 'admin_logs')), {
        type: type,
        userId: userId,
        timestamp: serverTimestamp(),
        metadata: {
          ...metadata,
          ip: await this.getClientIP(),
          userAgent: navigator.userAgent
        }
      });
    } catch (error) {
      console.error('Erro ao registar atividade:', error);
    }
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // TRATAMENTO DE ERROS
  handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'Este email já está registado.',
      'auth/weak-password': 'A password é muito fraca. Use pelo menos 8 caracteres.',
      'auth/invalid-email': 'Email inválido.',
      'auth/user-not-found': 'Utilizador não encontrado.',
      'auth/wrong-password': 'Password incorreta.',
      'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.'
    };

    const message = errorMessages[error.code] || error.message || 'Erro desconhecido';
    return new Error(message);
  }

  // MONITORAR ESTADO DE AUTENTICAÇÃO
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        callback({ authenticated: true, user, userData });
      } else {
        callback({ authenticated: false, user: null, userData: null });
      }
    });
  }
}

// Exportar instância global
export const authSystem = new AuthSystem();
export { auth, db };
