# 🧪 Teste de Cookies - Create Document

Arquivos criados para testar se os cookies estão sendo setados corretamente pela API.

## 📁 Arquivos

1. **`test_create_document.js`** - Script para copiar/colar no console do navegador
2. **`test_create_document.html`** - Página HTML para teste visual

## 🚀 Como Usar

### Opção 1: Console do Navegador (Recomendado)

1. Abra `https://dev-test.criaai.com/documentInput` no navegador
2. Abra o DevTools (F12)
3. Vá na aba **Console**
4. Copie e cole o conteúdo do arquivo `test_create_document.js`
5. Pressione Enter
6. Verifique os logs no console
7. Verifique os cookies em **DevTools > Application > Cookies**

### Opção 2: Página HTML

1. Abra o arquivo `test_create_document.html` no navegador
   - **Importante:** O arquivo deve ser servido via HTTPS ou estar no mesmo domínio
   - Você pode usar um servidor local ou servir via `https://dev-test.criaai.com`
2. Clique em **🚀 Executar Teste**
3. Veja os resultados no log
4. Use **🍪 Verificar Cookies** para ver os cookies a qualquer momento

## ✅ O que o teste verifica:

- ✅ Se a requisição é feita com `credentials: 'include'`
- ✅ Se os headers `Set-Cookie` são retornados pela API
- ✅ Se os cookies são setados no navegador após a requisição
- ✅ Se os cookies `authToken`, `authRefreshToken` e `documentId` estão presentes
- ✅ Se o `Domain` do cookie está correto (`.criaai.com`)

## 🔍 O que verificar no DevTools:

1. **Network Tab:**
   - Verifique a requisição para `/documents/create-document`
   - Veja os headers de resposta, especialmente `Set-Cookie`

2. **Application Tab > Cookies:**
   - Verifique se os cookies estão listados
   - Verifique o `Domain` (deve ser `.criaai.com`)
   - Verifique os atributos: `HttpOnly`, `Secure`, `SameSite=None`

## ⚠️ Problemas Comuns:

### Cookies não aparecem no `document.cookie`
- **Causa:** Cookies com `HttpOnly` não são acessíveis via JavaScript
- **Solução:** Verifique em DevTools > Application > Cookies (não no console)

### Cookies não são setados
- **Causa 1:** Requisição sem `credentials: 'include'`
- **Solução:** Certifique-se de que `credentials: 'include'` está presente

- **Causa 2:** Domain incorreto no cookie
- **Solução:** Verifique nos logs do CloudWatch se o Domain está como `.criaai.com` (sem `https://`)

- **Causa 3:** CORS não configurado corretamente
- **Solução:** Verifique se `access-control-allow-credentials: true` está na resposta

### Cookies aparecem mas não funcionam em subdomínios
- **Causa:** Domain sem ponto inicial (ex: `criaai.com` em vez de `.criaai.com`)
- **Solução:** O Domain deve ser `.criaai.com` (com ponto inicial) para funcionar em subdomínios

## 📝 Token JWT

O token JWT incluído nos arquivos de teste:
- **User ID:** `wUJJt1nmrfM3JWcfJFI5TiZPCew1`
- **Email:** `fnsdeividy@gmail.com`
- **Expira em:** Verifique a data de expiração no token

⚠️ **Nota:** Se o token expirar, você precisará gerar um novo token e atualizar os arquivos de teste.

