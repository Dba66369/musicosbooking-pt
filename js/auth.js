// js/auth.js - Sistema de Autenticação Firebase Completo (Refatorado para PT-PT)
import { auth, db } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { SECURITY_CONFIG } from './config/firebase.config.js';

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.loginAttempts = new Map();
    }

    async register(email, password, userType, additionalData = {}) {
        try {
            this.validateEmail(email);
            if (password.length < 8) throw new Error('A password deve ter pelo menos 8 caracteres.');
            
            const emailExists = await this.checkEmailExists(email);
            if (emailExists) throw new Error('Este email já está registado.');

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Criar utilizador na coleção 'utilizadores'
            await setDoc(doc(db, 'utilizadores', user.uid), {
                uid: user.uid,
                email: email.toLowerCase(),
                tipo: userType,
                nome: additionalData.name || '',
                telefone: additionalData.phone || '',
                dataCriacao: serverTimestamp(),
                ativo: true,
                perfil: {
                    bio: '',
                    avatar: '',
                    cidade: additionalData.city || ''
                }
            });

            // Criar sub-documento específico
            if (userType === 'musician') {
                await setDoc(doc(db, 'musicos', user.uid), {
                    userId: user.uid,
                    especialidade: additionalData.specialty || '',
                    bio: '',
                    cacheBase: 0,
                    social: { instagram: '', youtube: '' },
                    stats: { totalBookings: 0, avgRating: 0 },
                    dataCriacao: serverTimestamp()
                });
            } else {
                await setDoc(doc(db, 'empresas', user.uid), {
                    userId: user.uid,
                    nomeEmpresa: additionalData.companyName || '',
                    nif: additionalData.nif || '',
                    dataCriacao: serverTimestamp()
                });
            }

            await sendEmailVerification(user);
            return { success: true, user: user, message: 'Registo concluído com sucesso! Verifique o seu email.' };
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDoc = await getDoc(doc(db, 'utilizadores', user.uid));
            if (!userDoc.exists()) throw new Error('Dados do utilizador não encontrados.');

            const userData = userDoc.data();
            return {
                success: true,
                user: user,
                userData: userData,
                userType: userData.tipo
            };
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    async logout() {
        await signOut(auth);
        this.currentUser = null;
    }

    onAuthStateChange(callback) {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'utilizadores', user.uid));
                if (userDoc.exists()) {
                    this.currentUser = { uid: user.uid, ...userDoc.data() };
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

    getCurrentUser() { return this.currentUser; }

    async checkEmailExists(email) {
        const q = query(collection(db, 'utilizadores'), where('email', '==', email.toLowerCase()));
        const snap = await getDocs(q);
        return !snap.empty;
    }

    validateEmail(email) {
        if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new Error('Email inválido');
    }

    handleAuthError(error) {
        const errors = {
            'auth/email-already-in-use': 'Este email já está em uso.',
            'auth/invalid-email': 'Email inválido.',
            'auth/weak-password': 'Password demasiado fraca.',
            'auth/user-not-found': 'Utilizador não encontrado.',
            'auth/wrong-password': 'Password incorreta.',
            'auth/too-many-requests': 'Demasiadas tentativas. Tente mais tarde.'
        };
        return new Error(errors[error.code] || error.message);
    }
}

window.authSystem = new AuthSystem();
