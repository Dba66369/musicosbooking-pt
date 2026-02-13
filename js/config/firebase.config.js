/**
 * ⚠️ CONFIGURAÇÃO FIREBASE - MUSICOSBOOKING.PT
 *
 * SEGURANÇA:
 * - Estas chaves são PÚBLICAS (Firebase Web SDK)
 * - Proteção real: Firebase Security Rules + domínios autorizados
 * - NUNCA adicionar Service Account Keys aqui
 *
 * ROTAÇÃO DE CREDENCIAIS:
 * 1. Firebase Console > Project Settings > General
 * 2. Remover app web atual
 * 3. Criar novo app web
 * 4. Copiar novas credenciais aqui
 * 5. Atualizar domínios autorizados
 */

const FIREBASE_CONFIG = {
  // ⚠️ SUBSTITUIR COM NOVAS CREDENCIAIS APÓS ROTAÇÃO
  apiKey: "AIzaSyBgJ8xYzFxjGzYzGzYzGzYzGzYzGzYzGz8", // Rotacionar no Firebase Console
  authDomain: "musicosbooking-c344c.firebaseapp.com",
  projectId: "musicosbooking-c344c",
  storageBucket: "musicosbooking-c344c.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef1234567890"
};

/**
 * DOMÍNIOS AUTORIZADOS (configurar no Firebase Console)
 * Authentication > Settings > Authorized domains
 */
const AUTHORIZED_DOMAINS = [
  'dba66369.github.io',
  'localhost' // Apenas para desenvolvimento
];

/**
 * CONFIGURAÇÃO DE SEGURANÇA
 */
const SECURITY_CONFIG = {
  // Tempo de expiração de sessão (24 horas)
  sessionTimeout: 24 * 60 * 60 * 1000,
  
  // Máximo de tentativas de login
  maxLoginAttempts: 5,
  
  // Tempo de bloqueio após tentativas falhadas (15 minutos)
  lockoutDuration: 15 * 60 * 1000,
  
  // Validação de email obrigatória
  requireEmailVerification: true
};

// ═══════════════════════════════════════════════════════════════
// 📤 EXPORTAR CONFIGURAÇÕES (ESM - ES6 Modules)
// ═══════════════════════════════════════════════════════════════

export { FIREBASE_CONFIG, SECURITY_CONFIG, AUTHORIZED_DOMAINS };// Exportar todas as configurações
