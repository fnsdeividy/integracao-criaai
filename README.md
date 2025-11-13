# Integração Demo - Integração com CriaAI

Projeto de demonstração que simula o comportamento do site da Integração ao integrar com a CriaAI.

## Conceito Principal

A ideia deste projeto é **chamar uma API que automaticamente muda os cookies do endpoint e redireciona para esse endpoint**. Isso permite uma integração seamless onde:

1. O usuário permanece no site do parceiro (Integração)
2. Uma API call configura os cookies necessários no domínio da CriaAI
3. O usuário é redirecionado automaticamente para trabalhar no documento
4. Após finalizar, volta para o callback do parceiro

## Funcionalidades

- 🔐 Login automático na API da CriaAI
- 📄 Criação de documento externo via `createDocumentExternal`
- 🍪 Configuração automática de cookies cross-domain
- 🔄 Redirecionamento transparente para CriaAI
- 📞 Recebimento de callback após finalização do documento
- 🧪 Scripts de teste para validação de cookies

## Como Rodar

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Testes

### Testes Automatizados

Execute os testes de configuração:

```bash
npm test
```

### Testes de Integração

Para testar o fluxo completo manualmente:

1. Abra o arquivo `test/integration.test.js` no navegador
2. Execute a função `runIntegrationTests()` no console
3. Ou execute diretamente no Node.js:

```bash
node test/integration.test.js
```

### Testes de Cookies

Para testar especificamente a configuração de cookies:

1. Abra `test_create_document.html` no navegador
2. Ou use o script `test_create_document.js` no console do DevTools

## Arquitetura

### Fluxo de Integração

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Integração │ -> │   CriaAI    │ -> │  Cookies    │
│   Frontend  │    │     API     │    │  Setados    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   1. Login           2. Create Doc       3. Redirect
   2. Create Doc      3. Return Data      4. Work on Doc
   3. Redirect        4. Set Cookies
   4. Work on Doc
```

### Componentes Principais

- **`lib/config.ts`**: Validação e centralização de configuração
- **`app/page.tsx`**: Interface principal e fluxo de integração
- **`app/callback/page.tsx`**: Página de retorno após finalizar documento
- **`test/`**: Arquivos de teste e validação

## Configuração

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://z45mlqpuui.execute-api.sa-east-1.amazonaws.com
NEXT_PUBLIC_AUTH_API_URL=https://kqa418uhgj.execute-api.sa-east-1.amazonaws.com
NEXT_PUBLIC_STAGE=nonprod
NEXT_PUBLIC_API_KEY=sua-api-key
NEXT_PUBLIC_CRIAAI_FRONTEND_URL=https://dev-test.criaai.com

# Credenciais do parceiro para login automático
PARTNER_EMAIL=partner@example.com
PARTNER_PASSWORD=password123
```

### Explicação das URLs

- `NEXT_PUBLIC_API_BASE_URL`: API Gateway principal da CriaAI
- `NEXT_PUBLIC_AUTH_API_URL`: Endpoint específico de autenticação
- `NEXT_PUBLIC_CRIAAI_FRONTEND_URL`: URL do frontend da CriaAI onde o usuário trabalhará

## Fluxo Detalhado

### 1. Página Inicial
Usuário acessa a página inicial do site da Integração e clica em "Criar Documento na CriaAI"

### 2. Login Automático
```javascript
POST /auth/login
// Sistema faz login com credenciais do parceiro
// Recebe tokens de autenticação
```

### 3. Criação do Documento
```javascript
POST /documents/create-document
// Cria documento externo com linkCallback
// Recebe documentId e tokens específicos
```

### 4. Configuração de Cookies Cross-Domain
```javascript
// Redireciona para: https://dev-test.criaai.com/api/setExternalCookies?documentId=...&token=...
// Esta rota da CriaAI configura automaticamente os cookies necessários:
// - authToken
// - authRefreshToken
// - documentId
```

### 5. Trabalho no Documento
Usuário é redirecionado automaticamente para trabalhar no documento na plataforma CriaAI

### 6. Callback de Retorno
Após finalizar o documento, o usuário é redirecionado para `/callback` com parâmetros de sucesso/erro

