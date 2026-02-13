// js/auth.js - Sistema de Autenticação Firebase Completo
// DIA 1 - Implementação conforme especificado pelo Claude

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

import { ADMIN_EMAIL, SECURITY_CONFIG } from './config/firebase.config.js';

// ============================================
// SISTEMA DE AUTENTICAÇÃO COMPLETO
// ============================================

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.loginAttempts = new Map();
    }

    // ============================================
    // REGISTO DE UTILIZADOR
    // ============================================
    async register(email, password, userType, additionalData = {}) {
        try {
            // 1. Validar dados
            this.validateEmail(email);
            this.validatePassword(password);

            if (!['musician', 'company'].includes(userType)) {
                throw new Error('Tipo de utilizador inválido');
            }

            // 2. Verificar se email já existe
            const emailExists = await this.checkEmailExists(email);
            if (emailExists) {
                throw new Error('Este email já está registado. Use outro ou faça login.');
            }

            // 3. Criar utilizador no Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 4. Criar documento do utilizador no Firestore
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

            // 5. Criar documento específico (musician ou company)
            if (userType === 'musician') {
                await setDoc(doc(db, 'musicians', user.uid), {
                    userId: user.uid,
                    bio: '',
                    specialty: additionalData.specialty || '',
                    experience: 0,
                    pricePerEvent: 0,
                    photo: '',
                    social: {
                        instagram: '',
                        facebook: '',
                        youtube: '',
                        soundcloud: '',
                        website: ''
                    },
                    stats: {
                        totalBookings: 0,
                        totalEarnings: 0,
                        avgRating: 0,
                        totalReviews: 0
                    },
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

            // 6. Enviar email de verificação
            await sendEmailVerification(user);

            // 7. Registar log de registo
            await this.logActivity('user_registered', user.uid, {
                email: email,
                userType: userType
            });

            // 8. Notificar admin (via Cloud Function)
            await this.notifyAdminNewUser(user.uid, email, userType);

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

    // ============================================
    // LOGIN
    // ============================================
    async login(email, password) {
        try {
            // 1. Verificar rate limiting
            if (this.isLockedOut(email)) {
                throw new Error(`Muitas tentativas falhadas. Tente novamente em ${this.getLockoutTime(email)} minutos.`);
            }

            // 2. Validar dados
            this.validateEmail(email);

            // 3. Fazer login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 4. Verificar se email foi verificado
            if (SECURITY_CONFIG.requireEmailVerification && !user.emailVerified) {
                await signOut(auth);
                throw new Error('Por favor, verifique o seu email antes de fazer login. Verifique a caixa de spam.');
            }

            // 5. Buscar dados do utilizador
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                throw new Error('Dados do utilizador não encontrados.');
            }

            const userData = userDoc.data();

            // 6. Atualizar último login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogin: serverTimestamp()
            });

            // 7. Limpar tentativas de login
            this.loginAttempts.delete(email);

            return {
                success: true,
                user: user,
                userData: userData,
                userType: userData.userType
            };

        } catch (error) {
            // Incrementar tentativas falhadas
            this.recordFailedLogin(email);
            throw this.handleAuthError(error);
        }
    }

    // ============================================
    // LOGOUT
    // ============================================
    async logout() {
        try {
            await signOut(auth);
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            throw new Error('Erro ao fazer logout');
        }
    }

    // ============================================
    // RECUPERAR PASSWORD
    // ============================================
    async recoverPassword(email) {
        try {
            this.validateEmail(email);
            await sendPasswordResetEmail(auth, email);
            return {
                success: true,
                message: 'Email de recuperação enviado com sucesso'
            };
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // ============================================
    // VALIDAÇÕES
    // ============================================
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            throw new Error('Email inválido');
        }
    }

    validatePassword(password) {
        if (!password || password.length < SECURITY_CONFIG.passwordMinLength) {
            throw new Error(`Password deve ter pelo menos ${SECURITY_CONFIG.passwordMinLength} caracteres`);
        }
    }

    // ============================================
    // VERIFICAR EMAIL DUPLICADO
    // ============================================
    async checkEmailExists(email) {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email.toLowerCase()));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Erro ao verificar email:', error);
            return false;
        }
    }

    // ============================================
    // RATE LIMITING
    // ============================================
    recordFailedLogin(email) {
        const attempts = this.loginAttempts.get(email) || { count: 0, timestamp: Date.now() };
        attempts.count++;
        attempts.timestamp = Date.now();
        this.loginAttempts.set(email, attempts);
    }

    isLockedOut(email) {
        const attempts = this.loginAttempts.get(email);
        if (!attempts) return false;

        const timeSinceLastAttempt = Date.now() - attempts.timestamp;
        const lockoutExpired = timeSinceLastAttempt > SECURITY_CONFIG.lockoutDuration;

        if (lockoutExpired) {
            this.loginAttempts.delete(email);
            return false;
        }

        return attempts.count >= SECURITY_CONFIG.maxLoginAttempts;
    }

    getLockoutTime(email) {
        const attempts = this.loginAttempts.get(email);
        if (!attempts) return 0;

        const timeSinceLastAttempt = Date.now() - attempts.timestamp;
        const remainingTime = SECURITY_CONFIG.lockoutDuration - timeSinceLastAttempt;
        return Math.ceil(remainingTime / 60000); // Minutos
    }

    // ============================================
    // LOGGING
    // ============================================
    async logActivity(type, userId, metadata = {}) {
        try {
            await setDoc(doc(collection(db, 'admin_logs')), {
                type: type,
                userId: userId,
                timestamp: serverTimestamp(),
                metadata: metadata
            });
        } catch (error) {
            console.error('Erro ao registar log:', error);
        }
    }

    // ============================================
    // NOTIFICAÇÕES ADMIN
    // ============================================
    async notifyAdminNewUser(userId, email, userType) {
        try {
            // Esta função será implementada com Cloud Functions
            // Por agora, apenas registamos no Firestore
            await setDoc(doc(collection(db, 'admin_notifications')), {
                type: 'new_user',
                userId: userId,
                email: email,
                userType: userType,
                read: false,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Erro ao notificar admin:', error);
        }
    }

    // ============================================
    // GESTÃO DE ERROS
    // ============================================
    handleAuthError(error) {
        console.error('Auth Error:', error);

        const errorMessages = {
            'auth/email-already-in-use': 'Este email já está registado',
            'auth/invalid-email': 'Email inválido',
            'auth/weak-password': 'Password demasiado fraca',
            'auth/user-not-found': 'Email ou password incorretos',
            'auth/wrong-password': 'Email ou password incorretos',
            'auth/user-disabled': 'Esta conta foi desativada',
            'auth/too-many-requests': 'Demasiadas tentativas. Tente novamente mais tarde',
            'auth/network-request-failed': 'Erro de conexão. Verifique a sua internet'
        };

        const message = errorMessages[error.code] || error.message || 'Erro desconhecido';
        return new Error(message);
    }

    // ============================================
    // OBSERVER DE ESTADO
    // ============================================
    onAuthStateChange(callback) {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        emailVerified: user.emailVerified,
                        ...userDoc.data()
                    };
                    callback(this.currentUser);
                } else {
                    callback(null);
                }
            } else {
                this.currentUser = null;
                callback(null);
            }
        });
    }

    // ============================================
    // GETTERS
    // ============================================
    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null && this.currentUser.emailVerified;
    }

    isMusician() {
        return this.currentUser && this.currentUser.userType === 'musician';
    }

    isCompany() {
        return this.currentUser && this.currentUser.userType === 'company';
    }
}

// Exportar instância global
window.authSystem = new AuthSystem();
console.log('✅ Auth System carregado e pronto');
