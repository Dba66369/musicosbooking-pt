/**
 * PROTEÇÃO DE ROTAS - MUSICOSBOOKING.PT
 * Redireciona utilizadores não autenticados
 */

// Páginas protegidas que requerem autenticação
const PROTECTED_PAGES = [
  '/dashboard-musico.html',
  '/dashboard-empresa.html',
  '/perfil.html',
  '/reservas.html',
  '/pagamentos.html',
  '/configuracoes.html'
];

// Páginas que requerem tipo específico de utilizador
const ROLE_PAGES = {
  musico: ['/dashboard-musico.html'],
  empresa: ['/dashboard-empresa.html']
};

function checkAuth() {
  const currentPath = window.location.pathname;
  
  // Verificar se é uma página protegida
  const isProtectedPage = PROTECTED_PAGES.some(page => 
    currentPath.endsWith(page)
  );
  
  if (!isProtectedPage) {
    return; // Página pública, permitir acesso
  }
  
  // Verificar autenticação
  const auth = window.firebaseAuth;
  
  if (!auth) {
    console.error('Firebase Auth não inicializado');
    redirectToLogin();
    return;
  }
  
  // Listener de estado de autenticação
  auth.onAuthStateChanged((user) => {
    if (!user) {
      // Utilizador não autenticado
      redirectToLogin();
      return;
    }
    
    // Verificar tipo de utilizador
    const userType = localStorage.getItem('userType');
    
    if (!userType) {
      console.warn('Tipo de utilizador não encontrado');
      redirectToLogin();
      return;
    }
    
    // Verificar acesso baseado em role
    if (ROLE_PAGES.musico && currentPath.endsWith('/dashboard-empresa.html') && userType === 'musico') {
      window.location.href = '/dashboard-musico.html';
      return;
    }
    
    if (ROLE_PAGES.empresa && currentPath.endsWith('/dashboard-musico.html') && userType === 'empresa') {
      window.location.href = '/dashboard-empresa.html';
      return;
    }
    
    // Verificar se email está verificado (opcional, pode exigir para certas ações)
    const emailVerified = localStorage.getItem('emailVerified') === 'true';
    
    if (!emailVerified) {
      showEmailVerificationWarning();
    }
    
    console.log('✅ Acesso autorizado:', currentPath);
  });
}

function redirectToLogin() {
  const currentPath = window.location.pathname;
  const redirectUrl = encodeURIComponent(currentPath);
  window.location.href = `/login.html?redirect=${redirectUrl}`;
}

function showEmailVerificationWarning() {
  // Mostrar banner de aviso
  const banner = document.createElement('div');
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ffc107;
    color: #000;
    padding: 15px;
    text-align: center;
    z-index: 9999;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  banner.innerHTML = `
    <strong>⚠️ Email não verificado</strong> - 
    Por favor, verifique o seu email para acesso completo. 
    <a href="#" onclick="window.authSystem.reenviarVerificacao(); return false;" 
       style="color: #000; text-decoration: underline; margin-left: 10px;">Reenviar email</a>
  `;
  document.body.insertBefore(banner, document.body.firstChild);
}

// Executar verificação ao carregar página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAuth);
} else {
  checkAuth();
}
