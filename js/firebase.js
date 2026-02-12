// js/firebase.js - Inicialização SEGURA do Firebase
import { getFirebaseConfig } from './config/firebase.config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

// ═══════════════════════════════════════════════════════════════
// 🔒 VALIDAÇÃO DE DOMÍNIO (Prevenir uso não autorizado)
// ═══════════════════════════════════════════════════════════════
const ALLOWED_DOMAINS = [
  'dba66369.github.io',
  'localhost',
  '127.0.0.1'
];

function validateDomain() {
  const currentDomain = window.location.hostname;
  const isAllowed = ALLOWED_DOMAINS.some(domain => 
    currentDomain === domain || currentDomain.endsWith(domain)
  );
  
  if (!isAllowed) {
    console.error('🚫 Domínio não autorizado:', currentDomain);
    throw new Error('Acesso negado: domínio não autorizado');
  }
}

// ═══════════════════════════════════════════════════════════════
// 🛡️ SANITIZAÇÃO DE INPUTS (Prevenir XSS)
// ═══════════════════════════════════════════════════════════════
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// ═══════════════════════════════════════════════════════════════
// ⏱️ RATE LIMITING SIMPLES (Frontend)
// ═══════════════════════════════════════════════════════════════
const rateLimiter = {
  attempts: {},
  
  check(action, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const key = `${action}_${Math.floor(now / windowMs)}`;
    
    if (!this.attempts[key]) {
      this.attempts[key] = 0;
    }
    
    this.attempts[key]++;
    
    if (this.attempts[key] > maxAttempts) {
      throw new Error('Muitas tentativas. Aguarde um minuto.');
    }
    
    // Limpar tentativas antigas
    Object.keys(this.attempts).forEach(k => {
      if (k !== key) delete this.attempts[k];
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// 🚀 INICIALIZAÇÃO DO FIREBASE
// ═══════════════════════════════════════════════════════════════
let app, auth, db, storage;

try {
  // Validar domínio ANTES de inicializar
  validateDomain();
  
  // Obter configuração segura
  const firebaseConfig = getFirebaseConfig();
  
  // Inicializar Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log('✅ Firebase inicializado com sucesso');
  
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error.message);
  
  // Mostrar mensagem amigável ao utilizador
  if (document.body) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border: 2px solid #dc3545;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 9999;
      text-align: center;
      max-width: 400px;
    `;
    errorDiv.innerHTML = `
      <h3 style="color: #dc3545; margin-top: 0;">⚠️ Erro de Configuração</h3>
      <p>Não foi possível carregar a aplicação. Por favor, contacte o suporte.</p>
    `;
    document.body.appendChild(errorDiv);
  }
  
  throw error;
}

// ═══════════════════════════════════════════════════════════════
// 📤 EXPORTAR SERVIÇOS
// ═══════════════════════════════════════════════════════════════
export { app, auth, db, storage, sanitizeInput, rateLimiter };

// ═══════════════════════════════════════════════════════════════
// 🔐 PROTEÇÃO CONTRA CONSOLE INJECTION
// ═══════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  // Prevenir que credenciais vazem através do console
  Object.defineProperty(window, 'firebaseConfig', {
    get() {
      console.warn('🚫 Acesso a credenciais Firebase bloqueado');
      return undefined;
    },
    configurable: false
  });
}
