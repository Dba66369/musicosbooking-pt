// Configuração da API Backend
const API_CONFIG = {
    // ALTERE ESTA URL PARA SEU SERVIDOR BACKEND
    BASE_URL: 'http://localhost:3000/api',
    // Se o backend estiver em produção, use:
    // BASE_URL: 'https://api.musicosbooking.pt/api'
};

// Classe para gerenciar chamadas à API
class API {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.token = localStorage.getItem('token');
    }

    // Helper para fazer requisições
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Adiciona token se estiver disponível
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    // Métodos de autenticação
    async register(userData) {
        const data = await this.request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return data;
    }

    async login(email, password) {
        const data = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token) {
            this.token = data.token;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    }

    async logout() {
        try {
            await this.request('/logout', {
                method: 'POST'
            });
        } finally {
            this.token = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html';
        }
    }

    // Métodos de 2FA
    async setup2FA() {
        return await this.request('/2fa/setup', {
            method: 'POST'
        });
    }

    async verify2FA(tempToken, code) {
        const data = await this.request('/2fa/verify', {
            method: 'POST',
            body: JSON.stringify({ tempToken, code })
        });

        if (data.token) {
            this.token = data.token;
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data;
    }

    // Dashboard
    async getDashboard() {
        return await this.request('/dashboard', {
            method: 'GET'
        });
    }

    // Pagamentos
    async createCheckout(amount, description) {
        return await this.request('/payment/create-checkout', {
            method: 'POST',
            body: JSON.stringify({ amount, description })
        });
    }

    // Helper para verificar se está autenticado
    isAuthenticated() {
        return !!this.token;
    }

    // Helper para obter usuário atual
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
}

// Exporta instância global da API
const api = new API();

// Helper para proteger páginas (adicionar em páginas que requerem login)
function requireAuth() {
    if (!api.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Helper para mostrar mensagens de erro
function showError(message) {
    alert(message); // Você pode melhorar isso com um toast/notification bonito
}

// Helper para mostrar mensagens de sucesso
function showSuccess(message) {
    alert(message); // Você pode melhorar isso com um toast/notification bonito
}
