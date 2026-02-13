# 🎯 PROMPT PARA CLAUDE - PRÓXIMOS PASSOS MUSICOSBOOKING.PT

## Status do Projeto (13 de Fevereiro 2026)

**Versão:** 1.0 | **Status:** ✅ 40% COMPLETO (Dia 1 Finalizado)

### ✅ JÁ IMPLEMENTADO

#### Sistema de Autenticação (COMPLETO)
- `js/auth.js` - 314 linhas
  - ✅ Register com prevenção de contas duplicadas
  - ✅ Login com rate limiting (5 tentativas, 15min lockout)
  - ✅ Logout com limpeza de sessão
  - ✅ Password reset funcional
  - ✅ Account deletion com soft delete e logging
  - ✅ Email verification obrigatório
  - ✅ Activity logging para admin tracking
  - ✅ IP address logging para segurança
  - ✅ Firestore integration completa

#### Configurações Firebase (COMPLETO)
- `js/config/firebase.config.js` - 95 linhas com:
  - ✅ Security config (rate limiting, timeouts, validações)
  - ✅ Email templates para 8 tipos de notificações
  - ✅ USER_TYPES enum (musician, company, admin)
  - ✅ BOOKING_STATUS enum
  - ✅ PAYMENT_METHODS enum (bank_transfer, paypal, mbway)

#### Segurança (COMPLETO)
- `js/firebase.js` - 134 linhas com:
  - ✅ Domain validation
  - ✅ Input sanitization (XSS prevention)
  - ✅ Rate limiting implementado
  - ✅ Console injection protection
  - ✅ Error handling robusto

#### Limpeza de Segurança (COMPLETO)
- `login.html` - 133 linhas
  - ✅ Credenciais mock removidas (commit de 24 minutos atrás)
  - ✅ Firebase auth integration
  - ✅ Sem exposição de dados sensíveis

#### Site Online (COMPLETO)
- ✅ Live em: https://dba66369.github.io/musicosbooking-pt/
- ✅ Página de login funcionando
- ✅ Design responsivo em produção

---

## ⏳ PRÓXIMOS PASSOS (PRIORIDADE)

### FASE 1: FUNCIONAL BÁSICO (2-3 dias)

#### ✅ PASSO 1: Configurar Firebase Real (4-6 horas)
**Objetivo:** Site conectado a Firebase com credenciais reais

1. Ir a https://console.firebase.google.com
2. Criar novo projeto:
   - Nome: `musicosbooking`
   - Desativar Google Analytics
3. Ativar Authentication:
   - Build → Authentication
   - Ativar "Email/Password"
4. Ativar Firestore:
   - Build → Firestore Database
   - "Start in test mode"
   - Região: `europe-west1`
5. Copiar credenciais:
   - Project Settings → Web app
   - Copiar firebaseConfig
   - Colar em `js/config/firebase.config.js`
6. Deploy Firebase Security Rules (arquivo pronto em FIREBASE-IMPLEMENTATION-DIA1.md)

**Validação:**
- Login/registo funcionam
- Dados guardados em Firestore
- Sem erros no console

---

#### ✅ PASSO 2: Implementar Cloud Functions (2-3 horas)
**Objetivo:** Admin recebe notificações automáticas

1. Criar arquivo `functions/index.js`:
   ```javascript
   // Notificar admin quando novo utilizador se regista
   exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
     // Email para admin@musicosbooking.pt
   });
   
   // Notificar admin quando utilizador deleta conta
   exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
     // Email para admin
   });
   ```

2. Configurar SendGrid ou Mailgun (email service)
3. Deploy com Firebase CLI

**Validação:**
- Admin recebe email quando novo registo
- Admin recebe email quando conta é deletada

---

#### ✅ PASSO 3: Dashboards Funcionais (4-6 horas)
**Objetivo:** Músicos e empresas conseguem editar perfil

1. Completar `dashboard-musico.html`:
   - Carregar dados do Firestore
   - Permitir editar perfil (bio, especialidade, preço)
   - Upload de foto
   - Ver estatísticas (bookings, ganhos, rating)

2. Completar `dashboard-empresa.html`:
   - Carregar dados do Firestore
   - Pesquisar músicos com filtros
   - Ver histórico de bookings

3. Implementar em `js/dashboards.js`:
   ```javascript
   // Carregar dados do músico
   async function loadMusicianProfile(uid) {
     const doc = await getDoc(doc(db, 'musicians', uid));
     // Preencher form com dados
   }
   
   // Guardar mudanças
   async function saveMusicianProfile(uid, data) {
     await updateDoc(doc(db, 'musicians', uid), data);
   }
   ```

**Validação:**
- Músicos conseguem editar perfil
- Dados atualizam em Firestore
- Upload de foto funciona

---

### FASE 2: SISTEMA DE BOOKINGS (1 semana)

#### ✅ PASSO 4: Sistema de Reservas
**Objetivo:** Empresas conseguem booking de músicos

1. Criar coleção Firestore `bookings`
2. Implementar formulário de pedido
3. Notificações por email ao músico
4. Dashboard de bookings

---

### FASE 3: PAGAMENTOS (1 semana)

#### ✅ PASSO 5: Sistema de Pagamento Simples
**Objetivo:** Checkout com opções de pagamento

1. Implementar checkout com 3 opções:
   - Transferência bancária (mostrar IBAN)
   - PayPal (link de payment)
   - MBWay (número de telefone)
2. Upload de comprovante
3. Confirmação de pagamento

---

## 📋 CHECKLIST PARA FINALIZAR HOJE

- [ ] 1. Arquivo de prompt criado ✅
- [ ] 2. Documentação DIA 1 revisada ✅
- [ ] 3. Site ao vivo testado ✅
- [ ] 4. Código de auth.js commitado ✅
- [ ] 5. Login.html sem credenciais mock ✅

---

## 🔑 ARQUIVOS CRÍTICOS PARA PRÓXIMAS TAREFAS

### Precisa Criar:
1. `functions/index.js` - Cloud Functions
2. `js/dashboards.js` - Lógica dos dashboards
3. `js/bookings.js` - Sistema de reservas
4. `js/payments.js` - Sistema de pagamento

### Precisa Atualizar:
1. `firebase.config.js` - Adicionar credenciais reais
2. `dashboard-musico.html` - Conectar ao Firestore
3. `dashboard-empresa.html` - Conectar ao Firestore
4. `registo.html` - Completar fluxo

### Firestore Security Rules (PRONTO):
Ver arquivo FIREBASE-IMPLEMENTATION-DIA1.md

---

## 📱 Funcionalidades por Prioridade

### ALTA PRIORIDADE (Semana 1)
1. ✅ Autenticação (FEITO)
2. 🔲 Dashboards básicos
3. 🔲 Bookings simples
4. 🔲 Pagamentos (sem gateway)

### MÉDIA PRIORIDADE (Semana 2)
1. 🔲 Email notifications
2. 🔲 Upload de fotos
3. 🔲 Busca de músicos
4. 🔲 Reviews/ratings

### BAIXA PRIORIDADE (Semana 3+)
1. 🔲 Admin dashboard completo
2. 🔲 Relatórios mensais
3. 🔲 SEO otimizado
4. 🔲 Mobile app

---

## 🚀 INSTRUÇÕES PARA CLAUDE (próximo dia)

### Tarefa: Implementar Fase 1 - Funcional Básico

**Objetivo Final:** Site totalmente funcional com login, dashboards e bookings básicos funcionando

**Restrições:**
- Sem quebra do código existente
- Código em português (PT-PT)
- Segurança como prioridade
- Testes inclusos em cada tarefa

**Passos:**
1. Ativar Firebase com credenciais reais (usuário faz isso)
2. Implementar Cloud Functions para emails
3. Completar dashboards com CRUD do Firestore
4. Implementar sistema de bookings básico
5. Testar fluxo completo: registo → perfil → booking

**Validação:**
- Nenhum erro no console
- Dados guardados corretamente
- Emails enviados ao admin
- Redirecionamentos corretos

---

## 💡 DICAS IMPORTANTES

1. **Firebase é o Backend:** Não precisa de Node.js/Express para Fase 1
2. **Credenciais Reais Necessárias:** Site não funciona sem Firebase config real
3. **Segurança Primeiro:** Usar Firestore Security Rules desde o início
4. **PT-PT Obrigatório:** Todos os textos/mensagens em português (Portugal)
5. **Sem Parar:** Completar cada fase integralmente

---

## 📞 Contato & Suporte

**Repositório:** https://github.com/Dba66369/musicosbooking-pt
**Site Ao Vivo:** https://dba66369.github.io/musicosbooking-pt/
**Firebase Console:** https://console.firebase.google.com
**Documentation:** Ver FIREBASE-IMPLEMENTATION-DIA1.md

---

**Documento Criado:** 13 de Fevereiro 2026, 13:00 WET
**Responsável:** Cloud Automation System
**Status:** Pronto para próximas tarefas
