// js/payment.js - Sistema de Pagamento Integrado - MúsicosBooking.pt
// SEMANA 2.1 - Múltiplas opções de pagamento

class PaymentSystem {
    constructor() {
        this.methods = {
            BANK_TRANSFER: 'bank_transfer',
            PAYPAL: 'paypal',
            MBWAY: 'mbway'
        };
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        console.log('✅ Sistema de pagamento inicializado');
    }

    /**
     * Processa pagamento por transferência bancária
     */
    async processBankTransfer(orderData) {
        try {
            const reference = this.generateReference();
            
            return {
                success: true,
                method: this.methods.BANK_TRANSFER,
                reference: reference,
                bankDetails: {
                    iban: 'LT98 3250 0007 9827 7556',
                    bic: 'REVOLT21',
                    beneficiary: 'Bruno Novaes Souza',
                    bank: 'Revolut Bank UAB'
                },
                instructions: `Use a referência ${reference} na transferência`,
                nextStep: 'upload_proof'
            };
        } catch (error) {
            console.error('❌ Erro na transferência bancária:', error);
            throw error;
        }
    }

    /**
     * Processa pagamento via PayPal
     */
    async processPayPal(orderData) {
        try {
            // PayPal.me link direto (sem API)
            const paypalEmail = 'pagamentos@musicosbooking.pt';
            const amount = orderData.valor;
            const reference = this.generateReference();
            
            return {
                success: true,
                method: this.methods.PAYPAL,
                reference: reference,
                paypalLink: `https://www.paypal.me/${paypalEmail}/${amount}EUR`,
                instructions: 'Clique no link para pagar via PayPal',
                nextStep: 'await_confirmation'
            };
        } catch (error) {
            console.error('❌ Erro no PayPal:', error);
            throw error;
        }
    }

    /**
     * Processa pagamento via MB WAY
     */
    async processMBWay(orderData) {
        try {
            const phone = orderData.mbwayPhone;
            const amount = orderData.valor;
            const reference = this.generateReference();
            
            // Validação de telemóvel português
            if (!this.validatePortuguesePhone(phone)) {
                throw new Error('Número de telemóvel inválido');
            }
            
            return {
                success: true,
                method: this.methods.MBWAY,
                reference: reference,
                phone: phone,
                amount: amount,
                instructions: 'Pedido MB WAY enviado. Confirme no seu telemóvel',
                nextStep: 'await_confirmation',
                expiresIn: 300 // 5 minutos
            };
        } catch (error) {
            console.error('❌ Erro no MB WAY:', error);
            throw error;
        }
    }

    /**
     * Valida número de telemóvel português
     */
    validatePortuguesePhone(phone) {
        // Remove espaços e outros caracteres
        const cleaned = phone.replace(/\s+/g, '');
        
        // Aceita: +351..., 351..., 9xxxxxxxx, 2xxxxxxxx
        const patterns = [
            /^\+351[0-9]{9}$/,
            /^351[0-9]{9}$/,
            /^[92][0-9]{8}$/
        ];
        
        return patterns.some(pattern => pattern.test(cleaned));
    }

    /**
     * Gera referência única de pagamento
     */
    generateReference() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 100000);
        return `MB${year}${month}${day}${String(random).padStart(5, '0')}`;
    }

    /**
     * Verifica status de pagamento
     */
    async checkPaymentStatus(reference) {
        try {
            // Aqui seria integração com backend/webhook
            // Por agora, retorna status pendente
            return {
                reference: reference,
                status: 'pending',
                message: 'Aguardando confirmação de pagamento'
            };
        } catch (error) {
            console.error('❌ Erro ao verificar status:', error);
            throw error;
        }
    }

    /**
     * Calcula taxas de pagamento
     */
    calculateFees(amount, method) {
        const fees = {
            [this.methods.BANK_TRANSFER]: 0, // Sem taxas
            [this.methods.PAYPAL]: amount * 0.034 + 0.35, // 3.4% + €0.35
            [this.methods.MBWAY]: 0 // Sem taxas
        };
        
        return {
            subtotal: amount,
            fee: fees[method] || 0,
            total: amount + (fees[method] || 0)
        };
    }

    /**
     * Formata valor em euros
     */
    formatEUR(amount) {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }
}

// Exporta instância global
window.paymentSystem = new PaymentSystem();
console.log('💳 Payment System carregado');
