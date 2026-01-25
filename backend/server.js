// MúsicosBooking - Backend Server
// Express server with email integration

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../')));

// Email configuration using environment variables
const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Verify email configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server ready to send messages');
    }
});

// API endpoint to send budget requests
app.post('/api/enviar-orcamento', async (req, res) => {
    try {
        const { nome, email, telefone, tipoEvento, dataEvento, localizacao, estiloMusical, orcamento, mensagem } = req.body;

        // Validate required fields
        if (!nome || !email || !telefone || !tipoEvento || !dataEvento || !localizacao || !mensagem) {
            return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        // Email to site owner
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVE,
            subject: `Novo Pedido de Orçamento - ${tipoEvento}`,
            html: `
                <h2>Novo Pedido de Orçamento - MúsicosBooking</h2>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefone:</strong> ${telefone}</p>
                <p><strong>Tipo de Evento:</strong> ${tipoEvento}</p>
                <p><strong>Data do Evento:</strong> ${dataEvento}</p>
                <p><strong>Localização:</strong> ${localizacao}</p>
                <p><strong>Estilo Musical:</strong> ${estiloMusical || 'Não especificado'}</p>
                <p><strong>Orçamento:</strong> ${orcamento || 'Não especificado'}</p>
                <p><strong>Mensagem:</strong><br>${mensagem}</p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Send confirmation email to client
        const confirmationMail = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Pedido de Orçamento Recebido - MúsicosBooking',
            html: `
                <h2>Obrigado pelo seu pedido!</h2>
                <p>Olá ${nome},</p>
                <p>Recebemos o seu pedido de orçamento para ${tipoEvento} em ${dataEvento}.</p>
                <p>Entraremos em contato em breve com mais informações.</p>
                <br>
                <p>Atenciosamente,<br>Equipa MúsicosBooking</p>
            `
        };

        await transporter.sendMail(confirmationMail);

        res.status(200).json({ message: 'Orçamento enviado com sucesso' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Erro ao enviar orçamento. Tente novamente.' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 Email configured for: ${process.env.EMAIL_USER}`);
});
