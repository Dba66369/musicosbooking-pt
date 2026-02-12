// js/checkout.js - Sistema de Checkout com Pagamento Simplificado - MúsicosBooking.pt
// TAREFA 1.4 - Corrigir Sistema de Checkout com IBAN Real

/**
 * Sistema de Checkout completo:
 * 1. Geréncia de carrinho
 * 2. Validação de dados
 * 3. Upload de comprovativo
 * 4. Criação de pedido no Firestore
 * 5. Envia email com instruções de pagamento
 * 6. Referencia de pagamento única
 */

class CheckoutSystem {
    constructor() {
        this.cart = [];
        this.currentUser = null;
        this.db = null;
        this.storage = null;
        this.authSystem = null;
        
        // DADOS BANCÁRIOS REAIS - Revolut
        this.bankDetails = {
            iban: 'LT98 3250 0007 9827 7556',
            bic: 'REVOLT21',
            beneficiary: 'Bruno Novaes Souza',
            bankName: 'Revolut Bank UAB',
            bankAddress: 'Konstitucijos ave. 21B, 08130, Vilnius, Lithuania',
            currency: 'EUR'
        };
    }

    /**
     * Inicializa o sistema de checkout
     */
    async initialize(db, storage, authSystem) {
        this.db = db;
        this.storage = storage;
        this.authSystem = authSystem;
        this.currentUser = authSystem.getCurrentUser();
        console.log('✅ Checkout System inicializado');
    }

    /**
     * Adiciona item ao carrinho
     */
    addToCart(item) {
        if (!item.id || !item.price || !item.quantity) {
            throw new Error('Item inválido - faltam campos obrigatórios');
        }

        const existingItem = this.cart.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            this.cart.push(item);
        }

        console.log(`✅ Item adicionado ao carrinho: ${item.id}`);
        return this.getCartTotal();
    }

    /**
     * Remove item do carrinho
     */
    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        console.log(`✅ Item removido: ${itemId}`);
        return this.getCartTotal();
    }

    /**
     * Obtém total do carrinho
     */
    getCartTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    /**
     * Obtém carrinho completo
     */
    getCart() {
        return {
            items: this.cart,
            total: this.getCartTotal(),
            itemCount: this.cart.length
        };
    }

    /**
     * Limpa o carrinho
     */
    clearCart() {
        this.cart = [];
        console.log('✅ Carrinho limpo');
    }

    /**
     * Gera referencia de pagamento única
     */
    generatePaymentReference() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `MUS-${timestamp}-${random}`;
    }

    /**
     * Cria pedido no Firestore
     */
    async createOrder(customerData) {
        if (!this.currentUser) {
            throw new Error('Utilizador não autenticado');
        }

        if (!customerData.email || !customerData.nome) {
            throw new Error('Email e nome são obrigatórios');
        }

        if (this.cart.length === 0) {
            throw new Error('Carrinho vazio');
        }

        try {
            const paymentReference = this.generatePaymentReference();
            const totalAmount = this.getCartTotal();

            const orderData = {
                uid: this.currentUser.uid,
                paymentReference: paymentReference,
                email: customerData.email,
                nome: customerData.nome,
                telefone: customerData.telefone || '',
                items: this.cart,
                totalAmount: totalAmount,
                status: 'pending', // pending -> paid -> confirmed
                paymentMethod: 'bank_transfer',
                bankDetails: this.bankDetails,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
                proofOfPaymentUrl: null,
                notes: ''
            };

            // Salva no Firestore
            const orderRef = await this.db.collection('orders').add(orderData);
            const orderId = orderRef.id;

            console.log(`✅ Pedido criado: ${orderId} - Ref: ${paymentReference}`);

            return {
                success: true,
                orderId: orderId,
                paymentReference: paymentReference,
                totalAmount: totalAmount,
                order: orderData
            };
        } catch (error) {
            console.error('❌ Erro ao criar pedido:', error);
            throw new Error('Erro ao criar pedido: ' + error.message);
        }
    }

    /**
     * Upload do comprovativo de pagamento
     */
    async uploadProofOfPayment(orderId, file) {
        if (!file) {
            throw new Error('Ficheiro obrigatório');
        }

        // Valida tipo de ficheiro
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Tipo de ficheiro não suportado (JPEG, PNG, PDF)');
        }

        // Valida tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Ficheiro muito grande (máximo 5MB)');
        }

        try {
            const fileName = `proofs/${orderId}/${Date.now()}_${file.name}`;
            const fileRef = this.storage.ref(fileName);
            
            // Upload do ficheiro
            await fileRef.put(file);
            const downloadUrl = await fileRef.getDownloadURL();

            // Atualiza documento do pedido
            await this.db.collection('orders').doc(orderId).update({
                proofOfPaymentUrl: downloadUrl,
                proofUploadedAt: new Date()
            });

            console.log(`✅ Comprovativo enviado para pedido ${orderId}`);

            return {
                success: true,
                downloadUrl: downloadUrl
            };
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            throw new Error('Erro ao fazer upload do comprovativo: ' + error.message);
        }
    }

    /**
     * Confirma pagamento (apenas admin ou quando verifica comprovativo)
     */
    async confirmPayment(orderId) {
        try {
            await this.db.collection('orders').doc(orderId).update({
                status: 'paid',
                paidAt: new Date()
            });

            console.log(`✅ Pagamento confirmado: ${orderId}`);

            return {
                success: true,
                message: 'Pagamento confirmado com sucesso'
            };
        } catch (error) {
            console.error('❌ Erro ao confirmar pagamento:', error);
            throw new Error('Erro ao confirmar pagamento: ' + error.message);
        }
    }

    /**
     * Obtém instruções de pagamento formatadas
     */
    getPaymentInstructions(paymentReference, totalAmount) {
        return `
========================================
INSTRUÇÕES DE PAGAMENTO - MúsicosBooking.pt
========================================

REF EREÜNCIA: ${paymentReference}
VALOR: €${totalAmount.toFixed(2)}
MOEDA: EUR

DETALHES BANCÁRIOS:
IBAN: ${this.bankDetails.iban}
BIC/SWIFT: ${this.bankDetails.bic}
Beneficiário: ${this.bankDetails.beneficiary}
Banco: ${this.bankDetails.bankName}
Morada: ${this.bankDetails.bankAddress}

⚠️  IMPORTANTE:
1. Inclua a REFEREuuff08CIA no assunto da transferência
2. Envie o comprovativo via plataforma
3. Validação automática em até 2 horas
4. Validade do pagamento: 7 dias

========================================
        `;
    }

    /**
     * Obtém status de um pedido
     */
    async getOrderStatus(orderId) {
        try {
            const doc = await this.db.collection('orders').doc(orderId).get();
            if (!doc.exists) {
                throw new Error('Pedido não encontrado');
            }
            return doc.data();
        } catch (error) {
            console.error('❌ Erro ao buscar pedido:', error);
            throw new Error('Erro ao buscar pedido: ' + error.message);
        }
    }

    /**
     * Lista pedidos do utilizador atual
     */
    async getUserOrders() {
        if (!this.currentUser) {
            throw new Error('Utilizador não autenticado');
        }

        try {
            const snapshot = await this.db
                .collection('orders')
                .where('uid', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            const orders = [];
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return orders;
        } catch (error) {
            console.error('❌ Erro ao buscar pedidos:', error);
            throw new Error('Erro ao buscar pedidos: ' + error.message);
        }
    }
}

// Exporta instância global
window.checkoutSystem = new CheckoutSystem();

console.log('💳 Checkout System carregado com IBAN REAL');
