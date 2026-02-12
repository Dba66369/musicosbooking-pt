// registo-empresa.js - Phase 1: Company Registration with Firebase Auth
// Features: Email verification, duplicate prevention, password reset

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const registoEmpresaForm = document.getElementById('registo-empresa-form');
const nomeInput = document.getElementById('nome-empresa');
const emailInput = document.getElementById('email-empresa');
const telefoneInput = document.getElementById('telefone-empresa');
const nifInput = document.getElementById('nif-empresa');
const moradaInput = document.getElementById('morada-empresa');
const pessoaContatoInput = document.getElementById('pessoa-contacto');
const senhaInput = document.getElementById('senha-empresa');
const confirmarSenhaInput = document.getElementById('confirmar-senha-empresa');
const erroMsg = document.getElementById('erro-registo-empresa');
const sucessoMsg = document.getElementById('sucesso-registo-empresa');
const loadingSpinner = document.getElementById('loading-spinner-empresa');
const resetPasswordBtn = document.getElementById('reset-password-btn');
const resetPasswordForm = document.getElementById('reset-password-form');
const resetPasswordEmail = document.getElementById('reset-password-email');

// Validation Functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(senha) {
  return senha.length >= 6;
}

function validateNIF(nif) {
  // Basic NIF validation (Portuguese NIF has 9 digits)
  return /^\d{9}$/.test(nif);
}

async function checkDuplicateEmail(email) {
  try {
    const q = query(collection(db, 'empresas'), where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking duplicate email:', error);
    return false;
  }
}

async function checkDuplicateNIF(nif) {
  try {
    const q = query(collection(db, 'empresas'), where('nif', '==', nif));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking duplicate NIF:', error);
    return false;
  }
}

// Display Messages
function showError(message) {
  erroMsg.textContent = message;
  erroMsg.style.display = 'block';
  sucessoMsg.style.display = 'none';
  setTimeout(() => erroMsg.style.display = 'none', 5000);
}

function showSuccess(message) {
  sucessoMsg.textContent = message;
  sucessoMsg.style.display = 'block';
  erroMsg.style.display = 'none';
  setTimeout(() => sucessoMsg.style.display = 'none', 5000);
}

function showLoading(show) {
  if (loadingSpinner) {
    loadingSpinner.style.display = show ? 'block' : 'none';
  }
}

// Registration Handler
if (registoEmpresaForm) {
  registoEmpresaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const telefone = telefoneInput.value.trim();
    const nif = nifInput.value.trim();
    const morada = moradaInput.value.trim();
    const pessoaContacto = pessoaContatoInput.value.trim();
    const senha = senhaInput.value;
    const confirmarSenha = confirmarSenhaInput.value;
    
    // Validation
    if (!nome || !email || !telefone || !nif || !morada || !pessoaContacto || !senha || !confirmarSenha) {
      showError('Todos os campos são obrigatórios.');
      return;
    }
    
    if (!validateEmail(email)) {
      showError('Email inválido.');
      return;
    }
    
    if (!validateNIF(nif)) {
      showError('NIF deve conter 9 dígitos.');
      return;
    }
    
    if (!validatePassword(senha)) {
      showError('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (senha !== confirmarSenha) {
      showError('As senhas não correspondem.');
      return;
    }
    
    showLoading(true);
    
    try {
      // Check for duplicate email
      const emailExists = await checkDuplicateEmail(email);
      if (emailExists) {
        showError('Este email já está registado. Tente fazer login ou use outro email.');
        showLoading(false);
        return;
      }
      
      // Check for duplicate NIF
      const nifExists = await checkDuplicateNIF(nif);
      if (nifExists) {
        showError('Este NIF já está registado no sistema.');
        showLoading(false);
        return;
      }
      
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Create Firestore document with company data
      const empresaRef = await addDoc(collection(db, 'empresas'), {
        uid: user.uid,
        nome: nome,
        email: email.toLowerCase(),
        telefone: telefone,
        nif: nif,
        morada: morada,
        pessoaContacto: pessoaContacto,
        emailVerificado: false,
        dataCriacao: new Date(),
        tipo: 'empresa'
      });
      
      // Sign out user until email is verified
      await signOut(auth);
      
      showLoading(false);
      showSuccess('Registro realizado! Verifique seu email para confirmar sua conta antes de fazer login.');
      registoEmpresaForm.reset();
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 3000);
      
    } catch (error) {
      showLoading(false);
      console.error('Registration error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        showError('Este email já está registado.');
      } else if (error.code === 'auth/invalid-email') {
        showError('Email inválido.');
      } else if (error.code === 'auth/weak-password') {
        showError('Senha fraca. Use pelo menos 6 caracteres.');
      } else {
        showError('Erro ao registar: ' + error.message);
      }
    }
  });
}

// Password Reset Handler
if (resetPasswordBtn) {
  resetPasswordBtn.addEventListener('click', () => {
    resetPasswordForm.style.display = resetPasswordForm.style.display === 'none' ? 'block' : 'none';
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const resetEmail = resetPasswordEmail.value.trim().toLowerCase();
    
    if (!resetEmail || !validateEmail(resetEmail)) {
      showError('Email inválido.');
      return;
    }
    
    showLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showLoading(false);
      showSuccess('Email de reset de senha enviado. Verifique seu email.');
      resetPasswordForm.reset();
      resetPasswordForm.style.display = 'none';
    } catch (error) {
      showLoading(false);
      console.error('Password reset error:', error);
      showError('Erro ao enviar email de reset: ' + error.message);
    }
  });
}

export { auth, db };
