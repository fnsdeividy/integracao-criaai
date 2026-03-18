# Guia de Desenvolvimento - Funcionalidade Continue Document

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura da Solução](#arquitetura-da-solução)
3. [Componentes Desenvolvidos](#componentes-desenvolvidos)
4. [Fluxos de Uso](#fluxos-de-uso)
5. [Detalhamento Técnico](#detalhamento-técnico)
6. [Como Testar](#como-testar)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### O que foi desenvolvido?

Implementamos uma funcionalidade completa de **gerenciamento de documentos** que permite:

- ✅ Criar novos documentos na CriaAI
- ✅ Salvar automaticamente os documentos criados
- ✅ Listar todos os documentos do usuário
- ✅ Continuar editando documentos em andamento
- ✅ Visualizar documentos concluídos
- ✅ Gerenciar status dos documentos (Em Andamento, Concluído, Erro)

### Por que foi necessário?

Antes desta implementação, quando um usuário criava um documento e saía da página, ele **perdia o acesso** ao documento. Não havia forma de:
- Ver quais documentos foram criados
- Voltar a editar um documento que não foi finalizado
- Acessar documentos concluídos

### Como funciona?

A solução usa **localStorage do navegador** para armazenar metadados dos documentos localmente, permitindo que o usuário acesse seus documentos mesmo após fechar o navegador.

---

## 🏗️ Arquitetura da Solução

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     APLICAÇÃO NEXT.JS                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  app/        │  │  app/        │  │  app/        │      │
│  │  page.tsx    │  │  documents/  │  │  callback/   │      │
│  │              │  │  page.tsx    │  │  page.tsx    │      │
│  │  (Criar)     │  │  (Listar)    │  │  (Retorno)   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│  ┌────────────────────────┴──────────────────────────┐      │
│  │              lib/ (Lógica de Negócio)             │      │
│  ├───────────────────────────────────────────────────┤      │
│  │  • documentStorage.ts  (Persistência Local)       │      │
│  │  • continueDocument.ts (API Continue Document)    │      │
│  │  • config.ts          (Configurações)             │      │
│  └───────────────────────────────────────────────────┘      │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   localStorage          │
              │   (Navegador)           │
              │                         │
              │  {                      │
              │    documentId,          │
              │    status,              │
              │    createdAt,           │
              │    continueUrl,         │
              │    ...                  │
              │  }                      │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   API CriaAI            │
              │                         │
              │  • /auth/login          │
              │  • /createDocument      │
              │  • /continue-document   │
              └─────────────────────────┘
```

---

## 📦 Componentes Desenvolvidos

### 1. `lib/documentStorage.ts` - Gerenciador de Persistência Local

**O que faz:**
Gerencia o armazenamento de documentos no localStorage do navegador.

**Responsabilidades:**
- Salvar novos documentos
- Recuperar documentos salvos
- Atualizar status dos documentos
- Limpar documentos antigos automaticamente
- Remover documentos específicos

**Estrutura de Dados:**

```typescript
interface DocumentMetadata {
  documentId: string        // ID único do documento na CriaAI
  status: DocumentStatus    // IN_PROGRESS | COMPLETED | ERROR
  createdAt: string        // Data de criação (ISO 8601)
  lastModified: string     // Última modificação (ISO 8601)
  continueUrl?: string     // URL para continuar editando (opcional)
  documentUrl?: string     // URL do documento finalizado (opcional)
  callbackUrl: string      // URL de retorno após finalização
  title?: string           // Título do documento (opcional)
}
```

**Principais Funções:**

```typescript
// Salvar ou atualizar documento
documentStorage.save({
  documentId: 'abc123',
  status: DocumentStatus.IN_PROGRESS,
  callbackUrl: 'https://meusite.com/callback'
})

// Buscar todos os documentos
const docs = documentStorage.getAll()

// Buscar documento específico
const doc = documentStorage.getById('abc123')

// Atualizar status
documentStorage.updateStatus('abc123', DocumentStatus.COMPLETED, 'https://...')

// Remover documento
documentStorage.remove('abc123')

// Limpar todos
documentStorage.clear()
```

**Regras de Limpeza Automática:**
- Documentos com mais de **30 dias** são removidos
- Máximo de **50 documentos** armazenados
- Limpeza ocorre automaticamente ao salvar novos documentos

---

### 2. `lib/continueDocument.ts` - Lógica de Continuação

**O que faz:**
Gerencia o processo de continuar um documento existente, incluindo reautenticação e chamada à API.

**Fluxo de Execução:**

```
1. Recebe documentId
2. Busca documento no localStorage
3. Faz login na API (obtém token)
4. Chama API continue-document
5. Recebe continueUrl
6. Retorna URL para redirecionamento
```

**Principais Funções:**

```typescript
// Função principal exportada
async function continueDocument(
  documentId: string,
  config: Config
): Promise<string>

// Funções internas
async function login(config: Config): Promise<string>
async function callContinueDocumentApi(
  documentId: string,
  token: string,
  config: Config
): Promise<string>
```

**Chamada à API Continue Document:**

```typescript
POST https://api-whitelabel-dev.criaai.com/documents/continue-document

Headers:
  Content-Type: application/json
  x-api-key: {apiKey}
  Authorization: Bearer {token}
  Origin: {frontendUrl}

Body:
  {
    "documentId": "abc123..."
  }

Response:
  {
    "data": {
      "continueUrl": "https://dev-test.criaai.com/documentInput?..."
    }
  }
```

**Fallback:**
Se a API não retornar `continueUrl`, constrói URL manualmente:
```
https://dev-test.criaai.com/documentInput?documentId={id}&token={token}
```

---

### 3. `app/documents/page.tsx` - Página de Listagem

**O que faz:**
Interface visual para listar e gerenciar todos os documentos do usuário.

**Funcionalidades:**
- Lista todos os documentos salvos
- Mostra status visual com badges coloridos
- Permite continuar/visualizar documentos
- Permite excluir documentos da lista
- Mostra informações detalhadas (ID, datas, URL)
- Navegação para criar novo documento

**Estados Visuais:**

```typescript
IN_PROGRESS → Badge Azul "Em Andamento" → Botão "Continuar"
COMPLETED   → Badge Verde "Concluído"    → Botão "Visualizar"
ERROR       → Badge Vermelho "Erro"      → Botão "Tentar Novamente"
```

**Componentes da Interface:**

```tsx
<DocumentsPage>
  ├─ Header
  │  ├─ Título "Meus Documentos"
  │  └─ Botão "+ Criar Novo"
  │
  ├─ Lista de Documentos (ou Empty State)
  │  └─ Para cada documento:
  │     ├─ Ícone + Badge de Status
  │     ├─ Informações (ID, datas, URL)
  │     └─ Botões de Ação
  │        ├─ Continuar/Visualizar
  │        └─ Excluir
  │
  └─ Footer
     └─ Total de documentos + Link voltar
```

**Lógica de Continuação:**

```typescript
async function handleContinue(doc: DocumentMetadata) {
  setLoading(doc.documentId)
  
  try {
    const config = getConfig()
    const url = await continueDocument(doc.documentId, config)
    window.location.href = url  // Redireciona para CriaAI
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(null)
  }
}
```

---

### 4. `app/page.tsx` - Página Principal (Atualizada)

**O que foi adicionado:**

1. **Import do documentStorage:**
```typescript
import { documentStorage, DocumentStatus } from '@/lib/documentStorage'
```

2. **Salvamento após criar documento:**
```typescript
// Após receber resposta do createDocument
const documentId = createData.data?.documentId
const continueUrl = createData.data?.continueUrl

documentStorage.save({
  documentId,
  status: DocumentStatus.IN_PROGRESS,
  continueUrl,
  callbackUrl: `${window.location.origin}/callback`
})

console.log('📝 Documento salvo no localStorage:', documentId)
```

3. **Botão de navegação:**
```tsx
<button onClick={() => window.location.href = '/documents'}>
  📋 Meus Documentos
</button>
```

---

### 5. `app/callback/page.tsx` - Página de Callback (Atualizada)

**O que foi adicionado:**

1. **Import do documentStorage:**
```typescript
import { documentStorage, DocumentStatus } from '@/lib/documentStorage'
```

2. **Atualização automática de status:**
```typescript
useEffect(() => {
  const success = params.success === 'True'
  const documentId = params.documentId || params.document_id
  const documentUrl = params.document_url
  
  if (documentId) {
    if (success) {
      console.log('✅ Documento finalizado com sucesso:', documentId)
      documentStorage.updateStatus(
        documentId, 
        DocumentStatus.COMPLETED, 
        documentUrl
      )
    } else {
      console.log('❌ Erro ao processar documento:', documentId)
      documentStorage.updateStatus(documentId, DocumentStatus.ERROR)
    }
  }
}, [searchParams])
```

3. **Botões de navegação:**
```tsx
<button onClick={() => window.location.href = '/documents'}>
  📋 Ver Meus Documentos
</button>

<button onClick={() => window.location.href = '/'}>
  + Criar Novo Documento
</button>
```

---

### 6. `lib/config.ts` - Configurações (Atualizada)

**O que foi corrigido:**

Variáveis de ambiente atualizadas para usar prefixo `NEXT_PUBLIC_`:

```typescript
// Antes:
const partnerEmail = process.env.PARTNER_EMAIL
const partnerPassword = process.env.PARTNER_PASSWORD

// Depois:
const partnerEmail = process.env.NEXT_PUBLIC_PARTNER_EMAIL
const partnerPassword = process.env.NEXT_PUBLIC_PARTNER_PASSWORD
```

**Por quê?**
No Next.js, variáveis que precisam estar disponíveis no **cliente** (navegador) devem ter o prefixo `NEXT_PUBLIC_`. Sem esse prefixo, as variáveis só ficam disponíveis no servidor.

---

## 🔄 Fluxos de Uso

### Fluxo 1: Criar Novo Documento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário acessa página inicial (/)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Clica em "Criar Documento na CriaAI"                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Sistema faz login automático na API                      │
│    POST /auth/login                                          │
│    → Recebe token                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Sistema cria documento                                    │
│    POST /createDocumentExternal                              │
│    → Recebe documentId, continueUrl                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Sistema salva no localStorage                            │
│    documentStorage.save({                                    │
│      documentId,                                             │
│      status: IN_PROGRESS,                                    │
│      continueUrl,                                            │
│      callbackUrl                                             │
│    })                                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Redireciona para CriaAI                                   │
│    window.location.href = continueUrl                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Usuário trabalha no documento na CriaAI                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Ao finalizar, CriaAI redireciona para /callback          │
│    ?success=True&documentId=...&document_url=...             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Sistema atualiza status no localStorage                  │
│    documentStorage.updateStatus(                             │
│      documentId,                                             │
│      COMPLETED,                                              │
│      documentUrl                                             │
│    )                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

### Fluxo 2: Continuar Documento Existente

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário acessa /documents                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Sistema carrega documentos do localStorage               │
│    const docs = documentStorage.getAll()                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Exibe lista de documentos com status                     │
│    • Em Andamento → Botão "Continuar"                       │
│    • Concluído → Botão "Visualizar"                         │
│    • Erro → Botão "Tentar Novamente"                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Usuário clica em "Continuar" em um documento             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Sistema busca documento no localStorage                  │
│    const doc = documentStorage.getById(documentId)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Sistema faz login (reautentica)                          │
│    const token = await login(config)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Sistema chama API continue-document                      │
│    POST /documents/continue-document                         │
│    Body: { documentId }                                      │
│    → Recebe continueUrl                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Redireciona para CriaAI                                   │
│    window.location.href = continueUrl                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Usuário continua editando o documento                    │
└─────────────────────────────────────────────────────────────┘
```

---

### Fluxo 3: Visualizar Documento Concluído

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário acessa /documents                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Vê documento com status COMPLETED                        │
│    Badge verde "Concluído"                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Clica em "Visualizar"                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Sistema executa mesmo fluxo de continuar                 │
│    (reautentica + chama API)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Redireciona para CriaAI em modo visualização             │
│    (CriaAI detecta que documento está finalizado)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Detalhamento Técnico

### Estados do Documento

```typescript
enum DocumentStatus {
  IN_PROGRESS = 'IN_PROGRESS',  // Documento criado, não finalizado
  COMPLETED = 'COMPLETED',      // Documento finalizado com sucesso
  ERROR = 'ERROR'               // Erro no processamento
}
```

**Transições de Estado:**

```
Criar Documento → IN_PROGRESS
                      │
                      ├─ Finalizar com sucesso → COMPLETED
                      │
                      └─ Erro no callback → ERROR
```

---

### Persistência Local (localStorage)

**Chave de Armazenamento:**
```typescript
const STORAGE_KEY = 'criaai_documents'
```

**Estrutura no localStorage:**
```json
{
  "criaai_documents": [
    {
      "documentId": "abc123...",
      "status": "IN_PROGRESS",
      "createdAt": "2026-02-03T14:30:00.000Z",
      "lastModified": "2026-02-03T14:30:00.000Z",
      "continueUrl": "https://dev-test.criaai.com/...",
      "callbackUrl": "https://meusite.com/callback"
    },
    {
      "documentId": "xyz789...",
      "status": "COMPLETED",
      "createdAt": "2026-02-02T10:15:00.000Z",
      "lastModified": "2026-02-02T11:20:00.000Z",
      "documentUrl": "https://criaai.com/documents/xyz789.pdf",
      "callbackUrl": "https://meusite.com/callback"
    }
  ]
}
```

**Limitações do localStorage:**
- Máximo ~5-10MB por domínio (varia por navegador)
- Dados armazenados como string (JSON.stringify/parse)
- Sincronização apenas no mesmo navegador
- Limpar cache/cookies remove os dados

---

### Integração com API CriaAI

**Endpoints Utilizados:**

1. **Login (Autenticação)**
```http
POST https://kqa418uhgj.execute-api.sa-east-1.amazonaws.com/nonprod/auth/login

Headers:
  Content-Type: application/json
  x-api-key: {apiKey}

Body:
  {
    "email": "partner@example.com",
    "password": "password123",
    "signinMethod": "email"
  }

Response:
  {
    "data": {
      "authorization": "eyJhbGc..."
    }
  }
```

2. **Criar Documento**
```http
POST https://api-whitelabel-dev.criaai.com/documents/createDocumentExternal

Headers:
  Content-Type: application/json
  x-api-key: {apiKey}
  Authorization: Bearer {token}

Body:
  {
    "callbackUrl": "https://meusite.com/callback"
  }

Response:
  {
    "data": {
      "documentId": "abc123...",
      "continueUrl": "https://dev-test.criaai.com/...",
      "authorization": "eyJhbGc...",
      "refreshToken": "AMf-vBx..."
    }
  }
```

3. **Continuar Documento**
```http
POST https://api-whitelabel-dev.criaai.com/documents/continue-document

Headers:
  Content-Type: application/json
  x-api-key: {apiKey}
  Authorization: Bearer {token}
  Origin: https://dev-test.criaai.com

Body:
  {
    "documentId": "abc123..."
  }

Response:
  {
    "data": {
      "continueUrl": "https://dev-test.criaai.com/..."
    }
  }
```

---

### Variáveis de Ambiente

**Arquivo `.env.local`:**

```env
# API URLs
NEXT_PUBLIC_API_BASE_URL=https://api-whitelabel-dev.criaai.com
NEXT_PUBLIC_AUTH_API_URL=https://kqa418uhgj.execute-api.sa-east-1.amazonaws.com
NEXT_PUBLIC_CRIAAI_FRONTEND_URL=https://dev-test.criaai.com

# Configurações
NEXT_PUBLIC_STAGE=nonprod
NEXT_PUBLIC_API_KEY=sua-api-key-aqui

# Credenciais do Parceiro
NEXT_PUBLIC_PARTNER_EMAIL=partner@example.com
NEXT_PUBLIC_PARTNER_PASSWORD=password123
```

**⚠️ Importante:**
- Todas as variáveis precisam do prefixo `NEXT_PUBLIC_` para funcionar no cliente
- Nunca commitar o arquivo `.env.local` no Git
- Usar `.env.local.example` para documentar variáveis necessárias

---

## 🧪 Como Testar

### Teste 1: Criar e Salvar Documento

1. Acesse `http://localhost:3000`
2. Clique em "Criar Documento na CriaAI"
3. Aguarde o redirecionamento
4. Abra DevTools → Application → Local Storage
5. Verifique se existe chave `criaai_documents` com o documento

**Resultado Esperado:**
```json
[{
  "documentId": "...",
  "status": "IN_PROGRESS",
  "createdAt": "...",
  "lastModified": "...",
  "continueUrl": "...",
  "callbackUrl": "..."
}]
```

---

### Teste 2: Listar Documentos

1. Após criar documento, volte para `http://localhost:3000`
2. Clique em "📋 Meus Documentos"
3. Verifique se o documento aparece na lista
4. Verifique badge "Em Andamento" (azul)
5. Verifique botão "Continuar"

**Resultado Esperado:**
- Lista com 1 documento
- Badge azul "Em Andamento"
- Informações corretas (ID, data)

---

### Teste 3: Continuar Documento

1. Na página `/documents`, clique em "Continuar"
2. Observe console do navegador (F12)
3. Verifique logs:
   - 🔐 Fazendo login...
   - 📞 Chamando API continue-document...
   - 🔄 Chamando continue-document API: ...
   - ✅ Resposta continue-document: ...
   - 🔗 URL de continuação: ...
4. Aguarde redirecionamento para CriaAI

**Resultado Esperado:**
- Redirecionamento bem-sucedido
- Documento carregado na CriaAI
- Dados preservados (se havia preenchido algo antes)

---

### Teste 4: Finalizar e Atualizar Status

1. Na CriaAI, finalize o documento
2. Aguarde callback para `/callback`
3. Observe console:
   - ✅ Documento finalizado com sucesso: ...
4. Clique em "📋 Ver Meus Documentos"
5. Verifique badge "Concluído" (verde)
6. Verifique botão "Visualizar"

**Resultado Esperado:**
- Status atualizado para COMPLETED
- Badge verde
- Link para download (se disponível)

---

### Teste 5: Excluir Documento

1. Na página `/documents`, clique em "Excluir"
2. Confirme a ação
3. Verifique que documento sumiu da lista
4. Abra DevTools → Local Storage
5. Verifique que documento foi removido do array

**Resultado Esperado:**
- Documento removido da interface
- Documento removido do localStorage
- Contador atualizado

---

### Teste 6: Limpeza Automática

**Simular documento antigo:**

1. Abra DevTools → Console
2. Execute:
```javascript
const docs = JSON.parse(localStorage.getItem('criaai_documents') || '[]')
docs.push({
  documentId: 'old-doc-123',
  status: 'IN_PROGRESS',
  createdAt: '2025-01-01T00:00:00.000Z',  // 30+ dias atrás
  lastModified: '2025-01-01T00:00:00.000Z',
  callbackUrl: 'http://localhost:3000/callback'
})
localStorage.setItem('criaai_documents', JSON.stringify(docs))
```
3. Crie um novo documento
4. Verifique console: "Cleaned 1 old documents"
5. Verifique que documento antigo foi removido

**Resultado Esperado:**
- Documento com 30+ dias removido automaticamente
- Log de limpeza no console

---

## 🐛 Troubleshooting

### Erro: "Configuração inválida"

**Causa:**
Variáveis de ambiente não configuradas ou com nomes errados.

**Solução:**
1. Verifique arquivo `.env.local` na raiz do projeto
2. Confirme que todas as variáveis têm prefixo `NEXT_PUBLIC_`
3. Reinicie o servidor: `npm run dev`

---

### Erro: "Documento não encontrado no armazenamento local"

**Causa:**
localStorage foi limpo ou documento foi excluído.

**Solução:**
1. Crie um novo documento
2. Ou verifique se está usando o mesmo navegador

---

### Erro: "Token de autenticação não recebido"

**Causa:**
Credenciais inválidas ou API fora do ar.

**Solução:**
1. Verifique `NEXT_PUBLIC_PARTNER_EMAIL` e `NEXT_PUBLIC_PARTNER_PASSWORD`
2. Teste login manual no Postman
3. Verifique se API está acessível

---

### Erro: "continueUrl não recebida"

**Causa:**
API não retornou `continueUrl` na resposta.

**Solução:**
Sistema usa fallback automático:
```
https://dev-test.criaai.com/documentInput?documentId={id}&token={token}
```

Verifique logs no console para confirmar uso do fallback.

---

### Documentos não aparecem na lista

**Causa:**
localStorage vazio ou corrompido.

**Solução:**
1. Abra DevTools → Application → Local Storage
2. Verifique chave `criaai_documents`
3. Se vazia, crie novos documentos
4. Se corrompida, execute:
```javascript
localStorage.removeItem('criaai_documents')
```

---

### Erro de CORS na API

**Causa:**
Header `Origin` incorreto ou API não permite o domínio.

**Solução:**
1. Verifique `NEXT_PUBLIC_CRIAAI_FRONTEND_URL`
2. Confirme que corresponde ao domínio permitido pela API
3. Em desenvolvimento, use `http://localhost:3000`

---

## 📚 Conceitos Importantes para Desenvolvedores Júnior

### 1. localStorage

**O que é:**
Armazenamento local do navegador que persiste dados mesmo após fechar a aba.

**Como usar:**
```javascript
// Salvar
localStorage.setItem('chave', 'valor')

// Recuperar
const valor = localStorage.getItem('chave')

// Remover
localStorage.removeItem('chave')

// Limpar tudo
localStorage.clear()
```

**Limitações:**
- Apenas strings (use JSON.stringify/parse para objetos)
- ~5-10MB de espaço
- Não sincroniza entre dispositivos
- Vulnerável a XSS (não armazene dados sensíveis)

---

### 2. Async/Await

**O que é:**
Forma moderna de lidar com operações assíncronas (APIs, promessas).

**Exemplo:**
```typescript
// ❌ Forma antiga (callbacks)
fetch(url).then(response => {
  response.json().then(data => {
    console.log(data)
  })
})

// ✅ Forma moderna (async/await)
async function getData() {
  const response = await fetch(url)
  const data = await response.json()
  console.log(data)
}
```

---

### 3. TypeScript Interfaces

**O que é:**
Definição de estrutura de dados com tipos.

**Exemplo:**
```typescript
interface User {
  id: string
  name: string
  email: string
  age?: number  // Opcional
}

const user: User = {
  id: '123',
  name: 'João',
  email: 'joao@example.com'
  // age é opcional, pode omitir
}
```

---

### 4. React Hooks

**useState:**
Gerencia estado do componente.

```typescript
const [loading, setLoading] = useState(false)

// Atualizar estado
setLoading(true)
```

**useEffect:**
Executa código quando componente monta ou estado muda.

```typescript
useEffect(() => {
  // Código executado ao montar
  loadDocuments()
}, [])  // Array vazio = executa apenas 1 vez

useEffect(() => {
  // Código executado quando 'searchParams' muda
  updateStatus()
}, [searchParams])
```

---

### 5. Next.js App Router

**Estrutura de Pastas:**
```
app/
├── page.tsx           → Rota: /
├── documents/
│   └── page.tsx       → Rota: /documents
└── callback/
    └── page.tsx       → Rota: /callback
```

**Client Components:**
```typescript
'use client'  // Necessário para usar hooks e browser APIs

export default function MyPage() {
  // Pode usar useState, useEffect, localStorage, etc.
}
```

---

### 6. Variáveis de Ambiente no Next.js

**Regras:**
- `NEXT_PUBLIC_*` → Disponível no cliente (navegador)
- Sem prefixo → Apenas no servidor

**Exemplo:**
```env
# ✅ Funciona no navegador
NEXT_PUBLIC_API_URL=https://api.example.com

# ❌ Não funciona no navegador (undefined)
API_SECRET=abc123
```

---

## 🎓 Resumo para Desenvolvedores Júnior

### O que você aprendeu:

1. **Persistência Local:**
   - Como salvar dados no navegador
   - Gerenciar ciclo de vida dos dados
   - Limpeza automática

2. **Integração com APIs:**
   - Autenticação (login)
   - Chamadas POST com headers
   - Tratamento de erros

3. **Gerenciamento de Estado:**
   - Estados de documentos
   - Transições de estado
   - Atualização automática

4. **Interface do Usuário:**
   - Listagem de dados
   - Feedback visual (badges, loading)
   - Navegação entre páginas

5. **Boas Práticas:**
   - Separação de responsabilidades (lib/ vs app/)
   - Logs para debugging
   - Tratamento de erros
   - Fallbacks para casos de erro

---

## 📖 Próximos Passos

Para evoluir esta implementação:

1. **Backend Real:**
   - Substituir localStorage por banco de dados
   - API própria para gerenciar documentos
   - Sincronização entre dispositivos

2. **Melhorias de UX:**
   - Busca e filtros na lista
   - Ordenação customizada
   - Paginação para muitos documentos

3. **Segurança:**
   - Não expor credenciais no frontend
   - Implementar refresh token
   - Validação de permissões

4. **Testes:**
   - Testes unitários (Jest)
   - Testes de integração
   - Testes E2E (Playwright)

5. **Monitoramento:**
   - Logs estruturados
   - Métricas de uso
   - Alertas de erro

---

## 🤝 Contribuindo

Se você é um desenvolvedor júnior trabalhando neste projeto:

1. **Leia toda esta documentação**
2. **Execute todos os testes**
3. **Experimente quebrar coisas** (em ambiente local)
4. **Faça perguntas** quando não entender algo
5. **Documente** suas descobertas

**Lembre-se:** Código bom é código que outros conseguem entender! 🚀
