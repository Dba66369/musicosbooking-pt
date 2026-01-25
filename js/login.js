// Login Handler
document.addEventListener('DOMContentLoaded', () => {
    // Redireciona se já estiver logado
    if (api.isAuthenticated()) {
        const user = api.getCurrentUser();
        if (user && user.tipo === 'musico') {
            window.location.href = '/dashboard-musico.html';
        } else if (user && user.tipo === 'empresa') {
            window.location.href = '/dashboard-empresa.html';
        }
        return;
    }

    const loginForm = document.querySelector('form');
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const submitButton = document.querySelector('button[type="submit"]');

    if (!loginForm) {
        console.error('Formulário de login não encontrado');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validação
        if (!email || !password) {
            showError('Por favor, preencha todos os campos');
            return;
        }

        // Desabilita botão durante requisição
        submitButton.disabled = true;
        submitButton.textContent = 'Entrando...';

        try {
            const data = await api.login(email, password);

            // Se requer 2FA
            if (data.requiresTwoFA) {
                // Armazena o token temporário
                sessionStorage.setItem('tempToken', data.tempToken);
                
                // Solicita código 2FA
                const code = prompt('Digite o código 2FA do Google Authenticator:');
                
                if (code) {
                    try {
                        const verified = await api.verify2FA(data.tempToken, code);
                        redirectToDashboard(verified.user);
                    } catch (error) {
                        showError('Código 2FA inválido: ' + error.message);
                    }
                } else {
                    showError('Código 2FA é obrigatório');
                }
            } else {
                // Login sem 2FA - redireciona para dashboard
                redirectToDashboard(data.user);
            }
        } catch (error) {
            showError('Erro ao fazer login: ' + error.message);
            console.error('Erro:', error);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
        }
    });

    // Função para redirecionar para o dashboard correto
    function redirectToDashboard(user) {
        showSuccess('Login realizado com sucesso!');
        
        setTimeout(() => {
            if (user.tipo === 'musico') {
                window.location.href = '/dashboard-musico.html';
            } else if (user.tipo === 'empresa') {
                window.location.href = '/dashboard-empresa.html';
            } else {
                window.location.href = '/index.html';
            }
        }, 500);
    }
});
