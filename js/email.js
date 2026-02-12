// js/email.js - Sistema de Email - MúsicosBooking.pt
// SEMANA 2.2 - Templates e envio de emails

class EmailSystem {
    constructor() {
        this.templates = {};
        this.initialized = false;
        this.emailServiceURL = 'https://api.emailjs.com/api/v1.0/email/send'; // EmailJS gratuito
    }

    async initialize() {
        this.loadTemplates();
        this.initialized = true;
        console.log('✅ Sistema de email inicializado');
    }

    /**
     * Carrega templates de email
     */
    loadTemplates() {
        this.templates = {
            // Template de confirmação de registo
            registration: {
                subject: 'Bem-vindo ao MúsicosBooking.pt!',
                html: (data) => `
                    <h2>Olá ${data.nome}!</h2>
                    <p>Bem-vindo à plataforma MúsicosBooking.pt</p>
                    <p>O seu registo foi realizado com sucesso como <strong>${data.tipo}</strong>.</p>
                    <p>Por favor, verifique o seu email clicando no link abaixo:</p>
                    <a href="${data.verificationLink}">Verificar Email</a>
                    <br><br>
                    <p>Obrigado por se juntar a nós!</p>
                    <p>Equipa MúsicosBooking.pt</p>
                `
            },

            // Template de confirmação de reserva
            booking_confirmation: {
                subject: 'Reserva Confirmada - MúsicosBooking.pt',
                html: (data) => `
                    <h2>Reserva Confirmada!</h2>
                    <p>Olá ${data.nome},</p>
                    <p>A sua reserva foi confirmada com sucesso:</p>
                    <ul>
                        <li><strong>Referência:</strong> ${data.referencia}</li>
                        <li><strong>Evento:</strong> ${data.tipoEvento}</li>
                        <li><strong>Data:</strong> ${data.dataEvento}</li>
                        <li><strong>Valor:</strong> ${data.valor}</li>
                    </ul>
                    <p>Aguardamos a confirmação do seu pagamento.</p>
                    <p>Equipa MúsicosBooking.pt</p>
                `
            },

            // Template de pagamento recebido
            payment_received: {
                subject: 'Pagamento Confirmado',
                html: (data) => `
                    <h2>Pagamento Confirmado!</h2>
                    <p>Olá ${data.nome},</p>
                    <p>Confirmamos o recebimento do seu pagamento:</p>
                    <ul>
                        <li><strong>Referência:</strong> ${data.referencia}</li>
                        <li><strong>Valor:</strong> ${data.valor}</li>
                        <li><strong>Método:</strong> ${data.metodo}</li>
                    </ul>
                    <p>A sua reserva está agora confirmada!</p>
                    <p>Equipa MúsicosBooking.pt</p>
                `
            },

            // Template de recuperação de password
            password_reset: {
                subject: 'Recuperação de Password',
                html: (data) => `
                    <h2>Recuperação de Password</h2>
                    <p>Olá ${data.nome},</p>
                    <p>Recebemos um pedido para recuperar a sua password.</p>
                    <p>Clique no link abaixo para criar uma nova password:</p>
                    <a href="${data.resetLink}">Recuperar Password</a>
                    <br><br>
                    <p>Este link expira em 1 hora.</p>
                    <p>Se não solicitou esta recuperação, ignore este email.</p>
                    <p>Equipa MúsicosBooking.pt</p>
                `
            },

            // Template de nova mensagem/contacto
            contact_message: {
                subject: 'Nova Mensagem de Contacto',
                html: (data) => `
                    <h2>Nova Mensagem Recebida</h2>
                    <p><strong>Nome:</strong> ${data.nome}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Telefone:</strong> ${data.telefone}</p>
                    <p><strong>Mensagem:</strong></p>
                    <p>${data.mensagem}</p>
                `
            }
        };
    }

    /**
     * Envia email usando template
     */
    async sendEmail(templateName, recipientEmail, data) {
        try {
            if (!this.templates[templateName]) {
                throw new Error(`Template ${templateName} não encontrado`);
            }

            const template = this.templates[templateName];
            const emailData = {
                to: recipientEmail,
                subject: template.subject,
                html: template.html(data)
            };

            // Log para debug (em produção, enviaria via EmailJS ou backend)
            console.log('📧 Email preparado:', {
                template: templateName,
                to: recipientEmail,
                subject: template.subject
            });

            // Simula envio (em produção conectaria com EmailJS/SendGrid)
            return {
                success: true,
                message: 'Email enviado com sucesso',
                template: templateName
            };
        } catch (error) {
            console.error('❌ Erro ao enviar email:', error);
            throw error;
        }
    }

    /**
     * Envia email de confirmação de registo
     */
    async sendRegistrationEmail(user) {
        return await this.sendEmail('registration', user.email, {
            nome: user.nome,
            tipo: user.tipo,
            verificationLink: `${window.location.origin}/verify-email?token=${user.verificationToken}`
        });
    }

    /**
     * Envia email de confirmação de reserva
     */
    async sendBookingConfirmation(booking) {
        return await this.sendEmail('booking_confirmation', booking.email, {
            nome: booking.nome,
            referencia: booking.referencia,
            tipoEvento: booking.tipoEvento,
            dataEvento: booking.dataEvento,
            valor: this.formatCurrency(booking.valor)
        });
    }

    /**
     * Envia email de pagamento confirmado
     */
    async sendPaymentConfirmation(payment) {
        return await this.sendEmail('payment_received', payment.email, {
            nome: payment.nome,
            referencia: payment.referencia,
            valor: this.formatCurrency(payment.valor),
            metodo: payment.metodo
        });
    }

    /**
     * Envia email de recuperação de password
     */
    async sendPasswordReset(user, resetToken) {
        return await this.sendEmail('password_reset', user.email, {
            nome: user.nome,
            resetLink: `${window.location.origin}/reset-password?token=${resetToken}`
        });
    }

SEMANA 2.2: Create email.js - Email templates system (registration, booking, payment confirmation)     * Formata valor em euros
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    /**
     * Valida endereço de email
     */
    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
}

// Exporta instância global
window.emailSystem = new EmailSystem();
console.log('📧 Email System carregado');
