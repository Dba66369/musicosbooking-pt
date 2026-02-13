# 🔧 Guia de Limpeza do login.html

## ⚠️ PROBLEMA CRÍTICO DE SEGURANÇA

**Arquivo:** `/login.html`  
**Linhas:** 155-252  
**Status:** CREDENCIAIS MOCK EXPOSTAS PUBLICAMENTE

### Credenciais Expostas:
```javascript
'brunovivo26@gmail.com' / 'dba66369'
'admin@musicosbooking.pt' / 'Admin123'
'teste@musico.pt' / '123456'
'teste@empresa.pt' / '123456'
```

## 🎯 SOLUÇÃO

### Passo 1: Localizar o Bloco Mock

Abra `/login.html` e encontre as linhas 155-252 que contêm:

1. **Linha 155:** `// Banco de dados local simulado`
2. **Linha 156-176:** Objeto `const usuarios` com credenciais
3. **Linha 177-185:** Função `showMessage()`
4. **Linha 186-193:** Verificação localStorage
5. **Linha 194-252:** Handler de login mock

### Passo 2: Remover TODO o Bloco

**IMPORTANTE:** Delete COMPLETAMENTE as linhas 155-252.

O que deve PERMANECER:
- **Linhas 1-154:** HTML completo (até `</div></div>`)
- **Linha 155 (nova):** `<!-- Firebase Auth System -->`
- **Linhas 156-159 (novas):** Firebase SDK imports
- **Linha 160+ (nova):** Handler Firebase correto

### Passo 3: Verificar Estrutura Final

Após remoção, o final do HTML deve ficar assim:

```html
    </div>
</div>

<!-- Firebase Auth System -->
<script src="/js/config/firebase.config.js"></script>
<script src="/js/firebase.js"></script>  
<script src="/js/auth.js"></script>

<script>
// Atualizar formulário de login para usar Firebase Auth
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'A entrar...';
        
        const result = await window.authSystem.login(email, password);
        
        // Redirecionar baseado em tipo
        const userType = result.userData.tipo;
        if (userType === 'musico') {
            window.location.href = '/dashboard-musico.html';
        } else if (userType === 'empresa') {
            window.location.href = '/dashboard-empresa.html';
        }
    } catch (error) {
        alert(error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
    }
});
</script>
</body>
</html>
```

## ✅ CHECKLIST

- [ ] Abrir `/login.html` no editor
- [ ] Localizar linha 155: `// Banco de dados local simulado`
- [ ] Selecionar até linha 252 (fim do primeiro `</script>`)
- [ ] Deletar TODO o bloco selecionado
- [ ] Verificar que Firebase imports estão presentes
- [ ] Verificar que handler Firebase está correto
- [ ] Commit: `Security: Remove mock credentials from login.html`
- [ ] Testar site ao vivo
- [ ] Confirmar que credenciais mock não aparecem mais

## 🚀 PRÓXIMO PASSO

Depois da limpeza, configure Firebase:
1. Criar projeto em https://console.firebase.google.com
2. Copiar credenciais para `/js/config/firebase.config.js`
3. Ativar Authentication > Email/Password
4. Criar Firestore Database
5. Testar login real

## 📝 NOTAS

- O sistema `auth.js` JÁ ESTÁ COMPLETO
- Firebase SDK imports JÁ ESTÃO no código
- Apenas precisa REMOVER o mock e ADICIONAR credenciais reais
- Tempo estimado: 5-10 minutos
