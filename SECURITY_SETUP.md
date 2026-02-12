# 🔒 SECURITY_SETUP.md - MúsicosBooking.pt

## ⚠️ GUIA DE CONFIGURAÇÃO DE SEGURANÇA

Este documento contém instruções CRÍTICAS para proteger o seu projeto.

---

## 🚨 TAREFA 1.1 - PROTEGER CREDENCIAIS FIREBASE

### 🔴 STATUS: AÇÃO IMEDIATA NECESSÁRIA!

As credenciais Firebase estão atualmente EXPOSTAS no repositório público.
**Isto é uma VULNERABILIDADE CRÍTICA DE SEGURANÇA!**

### 🔧 PASSOS OBRIGATÓRIOS:

#### 1. ROTACIONAR CREDENCIAIS FIREBASE

```bash
# ⚠️ IMPORTANTE: Execute estes passos IMEDIATAMENTE!
```

1. Aceda a [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto: `musicosbooking-c344c`
3. Vá a **Project Settings** (⚙️ no menu lateral)
4. Scroll até "Your apps" 
5. **REMOVA** a app web atual (clique no ícone de lixo)
6. Clique em "Add app" > Selecione "Web" (🌐)
7. Registe uma nova app web:
   - Nome: `MúsicosBooking.pt - NOVO`
   - ☑️ Firebase Hosting (opcional)
8. **COPIE** as novas credenciais que aparecerão

#### 2. CONFIGURAR VARIÁVEIS DE AMBIENTE LOCALMENTE

```bash
# Na pasta raiz do projeto:
cp .env.example .env
```

Edite o ficheiro `.env` e substitua pelos valores REAIS:

```env
FIREBASE_API_KEY=sua_nova_api_key_aqui
FIREBASE_AUTH_DOMAIN=musicosbooking-c344c.firebaseapp.com
FIREBASE_PROJECT_ID=musicosbooking-c344c
FIREBASE_STORAGE_BUCKET=musicosbooking-c344c.appspot.com
FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
FIREBASE_APP_ID=seu_app_id
```

#### 3. CONFIGURAR GITHUB PAGES COM CREDENCIAIS

**PROBLEMA:** GitHub Pages é estático e não suporta variáveis de ambiente.

**SOLUÇÃO:**
Para GitHub Pages, as credenciais Firebase Web SDK **podem** ser públicas, MAS:

✅ **O QUE PROTEGE:**
- Firebase Security Rules (Firestore/Storage)
- Firebase App Check (verificação de domínio)
- Domínios autorizados no Firebase Console

❌ **O QUE NÃO PROTEGE:**
- API Keys expostos no frontend (normal para Firebase Web)

**CONFIGURAÇÃO CORRETA:**

1. **Firebase Console > Authentication > Settings > Authorized domains**
   ```
   ✅ dba66369.github.io
   ✅ localhost (para desenvolvimento)
   ❌ Remova outros domínios
   ```

2. **Firestore Security Rules** (`firestore.rules`):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Apenas utilizadores autenticados
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. **Storage Security Rules** (`storage.rules`):
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null 
                      && request.resource.size < 5 * 1024 * 1024; // 5MB max
       }
     }
   }
   ```

4. **Implementar Firebase App Check** (recomendado):
   - Firebase Console > App Check
   - Registe o domínio `dba66369.github.io`
   - Adicione reCAPTCHA v3

---

## 🛡️ PROTEÇÕES IMPLEMENTADAS

### ✅ JÁ CONFIGURADO:

1. **`.gitignore`** - Protege ficheiros sensíveis:
   ```
   .env
   .env.local
   .env.production
   .firebase/
   node_modules/
   ```

2. **`.env.example`** - Template de configuração (SEM credenciais reais)

3. **Domínio validation** - Código em `firebase.js` valida domínios autorizados

---

## 🔑 PRÓXIMOS PASSOS

### TAREFA 1.2 - Firebase Auth Real
- [ ] Remover sistema mock de `/login.html`
- [ ] Implementar Firebase Authentication
- [ ] Criar sistema de sessão com tokens
- [ ] Proteção de rotas

### TAREFA 1.3 - Backend Firebase Functions
- [ ] Criar `/backend/functions/`
- [ ] Implementar validação server-side
- [ ] Cloud Functions para registo/login

### TAREFA 1.4 - Sistema de Checkout
- [ ] Substituir IBAN fake por **LT98 3250 0007 9827 7556**
- [ ] Implementar upload de comprovativo (Firebase Storage)
- [ ] Email automático com instruções

### TAREFA 1.5 - Segurança Básica
- [ ] Sanitização de inputs (DOMPurify)
- [ ] Rate limiting (Firebase Security Rules)
- [ ] Proteção XSS/CSRF

---

## 📞 SUPORTE

**Em caso de dúvidas:**
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Security Rules: https://firebase.google.com/docs/rules
- Firebase App Check: https://firebase.google.com/docs/app-check

---

## 📅 HISTÓRICO DE ROTAÇÃO

| Data       | Ação                          | Responsável |
|------------|----------------------------------|-------------|
| 2025-01-08 | Criação .env.example          | Sistema     |
| PENDENTE   | Rotação credenciais Firebase | **VOCÊ!**   |

---

⚠️ **NUNCA COMMITE O FICHEIRO `.env` NO GIT!**
⚠️ **ROTACIONE CREDENCIAIS A CADA 90 DIAS!**
⚠️ **MONITORIZE LOGS DO FIREBASE PARA ACESSOS SUSPEITOS!**
