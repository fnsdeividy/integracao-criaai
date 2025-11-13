/**
 * Testes de Integração - Simulação do fluxo completo
 *
 * Este arquivo contém testes que simulam o fluxo completo da integração
 * Integração ↔ CriaAI. Execute no console do navegador ou em um ambiente Node.js.
 */

// Mock da API para testes
class MockAPI {
  constructor() {
    this.requests = []
  }

  // Simula resposta de login
  async mockLogin(email, password) {
    console.log('🔐 [TEST] Simulando login:', { email, password })

    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500))

    if (email === 'partner@example.com' && password === 'password123') {
      return {
        data: {
          authorization: 'mock-jwt-token-12345',
          refreshToken: 'mock-refresh-token-67890'
        }
      }
    } else {
      throw new Error('Credenciais inválidas')
    }
  }

  // Simula resposta de criação de documento
  async mockCreateDocument(token, callbackUrl) {
    console.log('📄 [TEST] Simulando criação de documento:', { token: token.substring(0, 20) + '...', callbackUrl })

    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 800))

    if (!token || !callbackUrl) {
      throw new Error('Token ou callbackUrl não fornecidos')
    }

    return {
      data: {
        documentId: 'mock-document-12345',
        authorization: token,
        refreshToken: 'mock-refresh-token-updated'
      }
    }
  }

  // Simula redirecionamento
  mockRedirect(frontendUrl, params) {
    console.log('🔄 [TEST] Simulando redirecionamento:', { frontendUrl, params })

    const url = new URL(`${frontendUrl}/api/setExternalCookies`)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    console.log('📍 [TEST] URL simulada:', url.toString())

    // Em um teste real, isso seria: window.location.href = url.toString()
    return url.toString()
  }
}

// Classe principal para testes de integração
class IntegrationTest {
  constructor() {
    this.api = new MockAPI()
    this.results = []
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    this.results.push({ type, message: logMessage })
  }

  async runFullFlow() {
    this.log('🚀 Iniciando teste de fluxo completo', 'info')

    try {
      // Teste 1: Configuração
      await this.testConfiguration()

      // Teste 2: Login
      const tokens = await this.testLogin()

      // Teste 3: Criação de documento
      const documentData = await this.testDocumentCreation(tokens)

      // Teste 4: Redirecionamento
      await this.testRedirection(documentData)

      this.log('✅ Todos os testes passaram!', 'success')

    } catch (error) {
      this.log(`❌ Teste falhou: ${error.message}`, 'error')
      console.error('Erro detalhado:', error)
    }

    return this.results
  }

  async testConfiguration() {
    this.log('⚙️ Testando configuração...', 'info')

    // Simula validação de configuração
    const requiredVars = [
      'NEXT_PUBLIC_API_BASE_URL',
      'NEXT_PUBLIC_AUTH_API_URL',
      'NEXT_PUBLIC_CRIAAI_FRONTEND_URL',
      'NEXT_PUBLIC_API_KEY',
      'PARTNER_EMAIL',
      'PARTNER_PASSWORD'
    ]

    let configValid = true
    const missingVars = []

    requiredVars.forEach(varName => {
      if (!process.env[varName] && typeof window === 'undefined') {
        // Em Node.js, verificar se variáveis estão definidas
        missingVars.push(varName)
        configValid = false
      }
    })

    if (configValid) {
      this.log('✅ Configuração válida', 'success')
    } else {
      this.log(`⚠️ Variáveis de ambiente não encontradas: ${missingVars.join(', ')}`, 'warning')
      this.log('ℹ️ Usando valores mock para teste', 'info')
    }
  }

  async testLogin() {
    this.log('🔐 Testando login...', 'info')

    try {
      const response = await this.api.mockLogin('partner@example.com', 'password123')
      this.log('✅ Login realizado com sucesso', 'success')

      const token = response.data.authorization
      const refreshToken = response.data.refreshToken

      if (!token) {
        throw new Error('Token não recebido na resposta')
      }

      return { token, refreshToken }
    } catch (error) {
      this.log(`❌ Falha no login: ${error.message}`, 'error')
      throw error
    }
  }

  async testDocumentCreation(tokens) {
    this.log('📄 Testando criação de documento...', 'info')

    try {
      const callbackUrl = 'https://Integração-demo.vercel.app/callback'
      const response = await this.api.mockCreateDocument(tokens.token, callbackUrl)
      this.log('✅ Documento criado com sucesso', 'success')

      const documentId = response.data.documentId
      const docToken = response.data.authorization
      const docRefreshToken = response.data.refreshToken

      if (!documentId) {
        throw new Error('DocumentId não recebido na resposta')
      }

      return {
        documentId,
        token: docToken,
        refreshToken: docRefreshToken,
        callbackUrl
      }
    } catch (error) {
      this.log(`❌ Falha na criação do documento: ${error.message}`, 'error')
      throw error
    }
  }

  async testRedirection(documentData) {
    this.log('🔄 Testando redirecionamento...', 'info')

    try {
      const frontendUrl = 'https://dev-test.criaai.com'
      const redirectUrl = this.api.mockRedirect(frontendUrl, {
        documentId: documentData.documentId,
        token: documentData.token,
        refreshToken: documentData.refreshToken || ''
      })

      this.log('✅ URL de redirecionamento gerada com sucesso', 'success')
      this.log(`📍 URL: ${redirectUrl}`, 'info')

      // Verificar se a URL contém os parâmetros necessários
      const url = new URL(redirectUrl)
      const params = url.searchParams

      if (!params.get('documentId')) {
        throw new Error('documentId não está na URL de redirecionamento')
      }

      if (!params.get('token')) {
        throw new Error('token não está na URL de redirecionamento')
      }

      this.log('✅ Todos os parâmetros necessários estão presentes na URL', 'success')

    } catch (error) {
      this.log(`❌ Falha no redirecionamento: ${error.message}`, 'error')
      throw error
    }
  }
}

// Função para executar os testes (pode ser chamada no console do navegador)
async function runIntegrationTests() {
  const test = new IntegrationTest()
  const results = await test.runFullFlow()

  console.log('\n📊 Resumo dos Testes:')
  console.table(results)

  return results
}

// Export para uso em Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IntegrationTest, runIntegrationTests }
}

// Se executado diretamente no navegador, executar os testes
if (typeof window !== 'undefined') {
  console.log('🎯 Executando testes de integração...')
  runIntegrationTests().then(() => {
    console.log('🏁 Testes finalizados!')
  })
}

