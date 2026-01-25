# Guia de Recuperação e Configuração de Email
# MúsicosBooking.pt - Sistema de Email para Orçamentos

## 🎯 Objetivo
Este guia ajuda a recuperar, verificar e configurar o email existente do domínio para receber pedidos de orçamento do site.

## 🔍 PASSO 1: Recuperar Email Existente

### Método 1: Consultar Registros DNS

```bash
# Verificar registros MX do domínio
nslookup -type=MX musicosbooking.pt

# Ou usar dig
dig MX musicosbooking.pt
```

### Método 2: Usar Ferramentas Online
1. Acesse: https://mxtoolbox.com/
2. Digite: `musicosbooking.pt`
3. Verifique os registros MX para identificar o provedor de email

**Provedores comuns e como identificar:**
- **Gmail/Google**: MX aponta para `google.com` ou `googlemail.com`
- **Zoho**: MX aponta para `zoho.com` ou `zohomail.com`
- **Microsoft/Outlook**: MX aponta para `outlook.com` ou `hotmail.com`
- **cPanel/Email do Hosting**: MX aponta para o servidor de hospedagem

### Método 3: Painel do Registrador de Domínio
1. Acesse o painel onde comprou o domínio (ex: GoDaddy, Namecheap, etc.)
2. Procure por:
   - "Email Accounts"
   - "Email Forwarding"
   - "DNS Management"
3. Liste todos os emails criados

### Emails Comuns para Testar
```
contato@musicosbooking.pt
info@musicosbooking.pt
pedidos@musicosbooking.pt
orcamentos@musicosbooking.pt
admin@musicosbooking.pt
suporte@musicosbooking.pt
```

## ✅ PASSO 2: Verificar se o Email Está Ativo

### Script Node.js para Verificar Email

Crie o arquivo `backend/verify-email.js`:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

async function verifyEmail() {
    console.log('🔍 Verificando configuração de email...');
    
    const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    try {
        await transporter.verify();
        console.log('✅ Email configurado corretamente!');
        console.log(`📧 Servidor: ${process.env.EMAIL_HOST}`);
        console.log(`👤 Usuário: ${process.env.EMAIL_USER}`);
        
        // Enviar email de teste
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_RECEIVE,
            subject: 'Teste - Sistema MúsicosBooking',
            text: 'Este é um email de teste. O sistema está funcionando!'
        });
        
        console.log('✅ Email de teste enviado com sucesso!');
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

verifyEmail();
```

Execute:
```bash
node backend/verify-email.js
```

## 🔐 PASSO 3: Resetar Senha (se necessário)

### Gmail/Google Workspace
1. Acesse: https://accounts.google.com/signin/recovery
2. Digite o email recuperado
3. Siga as instruções de recuperação

### Zoho Mail
1. Acesse: https://accounts.zoho.com/signin
2. Clique em "Forgot Password?"
3. Digite o email e siga as instruções

### cPanel (Hosting Email)
1. Acesse o cPanel do seu hosting
2. Procure "Email Accounts"
3. Clique em "Manage" ao lado do email
4. Altere a senha

## ⚙️ PASSO 4: Configurar Variáveis de Ambiente

Crie o arquivo `backend/.env`:

```env
# Configurações do Servidor
PORT=3000

# Configurações de Email - SUBSTITUA COM SEUS DADOS
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=pedidos@musicosbooking.pt
EMAIL_PASSWORD=sua_senha_aqui
EMAIL_RECEIVE=pedidos@musicosbooking.pt
```

### Configurações por Provedor

#### Gmail/Google Workspace
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```
**Nota**: Precisa ativar "Senha de App" em https://myaccount.google.com/apppasswords

#### Zoho Mail
```env
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### cPanel/Hosting
```env
EMAIL_HOST=mail.seudominio.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## 🚀 PASSO 5: Instalar e Executar Backend

### Instalação
```bash
cd backend
npm init -y
npm install express cors nodemailer dotenv
```

### Criar package.json (backend/package.json)
```json
{
  "name": "musicosbooking-backend",
  "version": "1.0.0",
  "description": "Backend para MúsicosBooking.pt",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "verify": "node verify-email.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "nodemailer": "^6.9.7",
    "dotenv": "^16.3.1"
  }
}
```

### Executar Servidor
```bash
node server.js
```

Você deverá ver:
```
🚀 Server running on port 3000
📧 Email configured for: pedidos@musicosbooking.pt
✅ Email server ready to send messages
```

## 🧪 PASSO 6: Testar Integração

1. **Abra o formulário**: http://localhost:3000/contato.html
2. **Preencha os dados** do orçamento
3. **Envie o formulário**
4. **Verifique**:
   - Email recebido em `EMAIL_RECEIVE`
   - Email de confirmação enviado ao cliente

## 🔧 Solução de Problemas

### Erro: "Invalid login"
- Verifique `EMAIL_USER` e `EMAIL_PASSWORD`
- Para Gmail: Use "Senha de App" (https://myaccount.google.com/apppasswords)
- Verifique se 2FA está ativado

### Erro: "Connection timeout"
- Verifique `EMAIL_HOST` e `EMAIL_PORT`
- Teste diferentes portas: 587, 465, 25
- Verifique firewall do servidor

### Emails não chegam
- Verifique pasta de SPAM
- Confirme `EMAIL_RECEIVE` está correto
- Verifique logs do servidor

## 📚 Recursos Úteis

- **MX Toolbox**: https://mxtoolbox.com/
- **Gmail App Passwords**: https://myaccount.google.com/apppasswords
- **Nodemailer Docs**: https://nodemailer.com/
- **WHOIS Lookup**: https://who.is/

## 🔒 Segurança

⚠️ **NUNCA** commite o arquivo `.env` no GitHub!

Adicione ao `.gitignore`:
```
backend/.env
node_modules/
*.log
```

## 🎯 Próximos Passos

1. [ ] Recuperar email existente
2. [ ] Configurar `.env` com credenciais
3. [ ] Executar `npm install` no backend
4. [ ] Testar com `node verify-email.js`
5. [ ] Iniciar servidor com `node server.js`
6. [ ] Testar formulário de contato
7. [ ] Deploy em produção

---

**Suporte**: contato@musicosbooking.pt
