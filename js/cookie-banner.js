// js/cookie-banner.js - GDPR Cookie Banner
// SEMANA 2.10 - Banner de consentimento de cookies GDPR

(function() {
    'use strict';
    
    const COOKIE_NAME = 'cookieConsent';
    const COOKIE_EXPIRY_DAYS = 365;
    
    // Verifica se já existe consentimento
    function getCookieConsent() {
        const consent = localStorage.getItem(COOKIE_NAME);
        return consent ? JSON.parse(consent) : null;
    }
    
    // Guarda consentimento
    function setCookieConsent(accepted) {
        const consent = {
            accepted: accepted,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem(COOKIE_NAME, JSON.stringify(consent));
    }
    
    // Cria banner de cookies
    function createCookieBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-text">
                    <p>🍪 <strong>Este site utiliza cookies essenciais</strong></p>
                    <p>Utilizamos cookies necessários para o funcionamento da plataforma. Não utilizamos cookies de publicidade ou rastreamento. <a href="cookies.html" target="_blank">Saiba mais</a></p>
                </div>
                <div class="cookie-buttons">
                    <button id="cookie-accept" class="btn-primary">Aceitar</button>
                    <button id="cookie-decline" class="btn-secondary">Recusar</button>
                </div>
            </div>
        `;
        
        // Estilos inline para garantir visibilidade
        const style = document.createElement('style');
        style.textContent = `
            #cookie-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(107, 70, 193, 0.98);
                color: white;
                padding: 20px;
                box-shadow: 0 -4px 10px rgba(0,0,0,0.3);
                z-index: 9999;
                animation: slideUp 0.5s ease-out;
            }
            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            .cookie-banner-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 20px;
            }
            .cookie-text p {
                margin: 5px 0;
                font-size: 0.95em;
            }
            .cookie-text a {
                color: #ffd700;
                text-decoration: underline;
            }
            .cookie-buttons {
                display: flex;
                gap: 10px;
                flex-shrink: 0;
            }
            .cookie-buttons button {
                padding: 10px 25px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: transform 0.2s;
            }
            .cookie-buttons button:hover {
                transform: scale(1.05);
            }
            .btn-primary {
                background: white;
                color: #6b46c1;
            }
            .btn-secondary {
                background: transparent;
                color: white;
                border: 2px solid white !important;
            }
            @media (max-width: 768px) {
                .cookie-banner-content {
                    flex-direction: column;
                    text-align: center;
                }
                .cookie-buttons {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(banner);
        
        // Event listeners
        document.getElementById('cookie-accept').addEventListener('click', function() {
            setCookieConsent(true);
            removeBanner();
        });
        
        document.getElementById('cookie-decline').addEventListener('click', function() {
            setCookieConsent(false);
            removeBanner();
            // Opcional: redirecionar para página externa
            // window.location.href = 'https://www.google.com';
        });
    }
    
    // Remove banner
    function removeBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.5s ease-out';
            setTimeout(() => banner.remove(), 500);
        }
    }
    
    // Inicializa ao carregar página
    document.addEventListener('DOMContentLoaded', function() {
        const consent = getCookieConsent();
        
        // Mostra banner se ainda não houver consentimento
        if (!consent) {
            setTimeout(createCookieBanner, 1000); // Delay de 1s para melhor UX
        }
    });
})();
