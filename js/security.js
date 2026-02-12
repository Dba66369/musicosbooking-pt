// js/security.js - Sistema de Segurança Completo - MúsicosBooking.pt
// TAREFA 1.5 - Segurança Básica - Sanitização, Rate Limiting, Proteções XSS/CSRF

/**
 * Sistema de segurança completo:
 * 1. Sanitização de inputs (DOMPurify)
 * 2. Rate limiting (protección contra brute-force)
 * 3. Proteção CSRF (tokens)
 * 4. Validação de emails
 * 5. Proteção contra XSS
 * 6. Logs de segurança
 */

class SecuritySystem {
    constructor() {
        this.rateLimitStore = new Map();
        this.csrfTokens = new Map();
        this.securityLogs = [];
        this.maxAttempts = 5;
        this.timeWindow = 15 * 60 * 1000; // 15 minutos
    }

    /**
     * Sanitiza input do utilizador (protege contra XSS)
     * Requer: <script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
     */
    sanitizeInput(input) {
        if (!input) return '';
        
        // Se DOMPurify está disponível, usa-o
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
        }
        
        // Fallback: remove HTML tags básicos
        const tempDiv = document.createElement('div');
        tempDiv.textContent = input;
        return tempDiv.innerHTML;
    }

    /**
     * Valida email
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida password (mínimo 6 caracteres)
     */
    validatePassword(password) {
        return password && password.length >= 6;
    }

    /**
     * Valida telefone (9 dígitos para Portugal)
     */
    validatePhone(phone) {
        const phoneRegex = /^\d{9}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }

    /**
     * Rate limiting - Protege contra brute-force
     * Retorna true se dentro do limite, false se excedeu
     */
    checkRateLimit(identifier) {
        const now = Date.now();
        
        if (!this.rateLimitStore.has(identifier)) {
            this.rateLimitStore.set(identifier, []);
        }
        
        const attempts = this.rateLimitStore.get(identifier);
        
        // Remove tentativas antigas (fora da janela de tempo)
        const validAttempts = attempts.filter(time => now - time < this.timeWindow);
        
        if (validAttempts.length >= this.maxAttempts) {
            this.logSecurityEvent('rate_limit_exceeded', identifier);
            return false; // Excedeu limite
        }
        
        validAttempts.push(now);
        this.rateLimitStore.set(identifier, validAttempts);
        return true; // Dentro do limite
    }

    /**
     * Gera CSRF token
     */
    generateCSRFToken() {
        const token = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const expiryTime = timestamp + 3600000; // 1 hora
        
        this.csrfTokens.set(token, {
            createdAt: timestamp,
            expiresAt: expiryTime
        });
        
        return token;
    }

    /**
     * Valida CSRF token
     */
    validateCSRFToken(token) {
        if (!this.csrfTokens.has(token)) {
            this.logSecurityEvent('csrf_token_invalid', token);
            return false;
        }
        
        const tokenData = this.csrfTokens.get(token);
        const now = Date.now();
        
        if (now > tokenData.expiresAt) {
            this.csrfTokens.delete(token);
            this.logSecurityEvent('csrf_token_expired', token);
            return false;
        }
        
        // Token válido - remove-o para uso único
        this.csrfTokens.delete(token);
        return true;
    }

    /**
     * Proteção contra XSS em conteúdo dinamic
     */
    sanitizeHTML(html) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'a'],
                ALLOWED_ATTR: ['href', 'target']
            });
        }
        
        // Fallback: escapa HTML
        const textarea = document.createElement('textarea');
        textarea.textContent = html;
        return textarea.innerHTML;
    }

    /**
     * Log de eventos de segurança
     */
    logSecurityEvent(eventType, details) {
        const event = {
            timestamp: new Date(),
            type: eventType,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.securityLogs.push(event);
        console.warn(`🚨 Evento de segurança: ${eventType}`, details);
        
        // Limita logs em memória (máximo 100)
        if (this.securityLogs.length > 100) {
            this.securityLogs.shift();
        }
    }

    /**
     * Verifica se URL é segura (previne open redirects)
     */
    isSafeURL(url) {
        try {
            const parsed = new URL(url, window.location.origin);
            const current = new URL(window.location.origin);
            
            // Só permite URLs do mesmo dominio
            return parsed.hostname === current.hostname;
        } catch (e) {
            return false;
        }
    }

    /**
     * Redirect seguro
     */
    safeRedirect(url) {
        if (this.isSafeURL(url)) {
            window.location.href = url;
            return true;
        }
        console.error('🚨 Tentativa de redirect não seguro:', url);
        return false;
    }

    /**
     * Valida toda forma antes de submit
     */
    validateForm(formData) {
        const errors = [];
        
        if (formData.email && !this.validateEmail(formData.email)) {
            errors.push('Email inválido');
        }
        
        if (formData.password && !this.validatePassword(formData.password)) {
            errors.push('Password muito fraca (mín 6 caracteres)');
        }
        
        if (formData.phone && !this.validatePhone(formData.phone)) {
            errors.push('Telefone inválido');
        }
        
        // Sanitiza todos os strings
        const sanitized = {};
        for (const [key, value] of Object.entries(formData)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            sanitized: sanitized
        };
    }

    /**
     * Obtém logs de segurança (para admin)
     */
    getSecurityLogs() {
        return this.securityLogs;
    }

    /**
     * Inicializa Content Security Policy (CSP)
     */
    initCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = [
            "default-src 'self'",
            "script-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: https:",
            "font-src 'self' https://fonts.gstatic.com",
            "connect-src 'self' https://*.firebaseio.com https://*.cloudfunctions.net",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ');
        document.head.appendChild(meta);
    }
}

// Inicializa sistema de segurança
window.securitySystem = new SecuritySystem();
window.securitySystem.initCSP();

console.log('🔐 Security System ativado (DOMPurify, Rate Limiting, CSRF, CSP)');
