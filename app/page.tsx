'use client'

import { useState } from 'react'

/**
 * Página principal do site da Integração (simulação)
 * 
 * Este componente:
 * 1. Faz login na API da CriaAI
 * 2. Chama createDocumentExternal
 * 3. Redireciona para a CriaAI com cookies setados
 */
export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'idle' | 'login' | 'create' | 'redirect'>('idle')

  // Configurações da API
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://z45mlqpuui.execute-api.sa-east-1.amazonaws.com'
  const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://kqa418uhgj.execute-api.sa-east-1.amazonaws.com'
  const STAGE = process.env.NEXT_PUBLIC_STAGE || 'nonprod'
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''
  const CRIAAI_FRONTEND_URL = process.env.NEXT_PUBLIC_CRIAAI_FRONTEND_URL || 'http://localhost:3000'

  // Credenciais do parceiro
  const PARTNER_EMAIL = process.env.NEXT_PUBLIC_PARTNER_EMAIL || 'partner@example.com'
  const PARTNER_PASSWORD = process.env.NEXT_PUBLIC_PARTNER_PASSWORD || 'password123'

  const handleCreateDocument = async () => {
    setLoading(true)
    setError(null)
    setStep('login')

    try {
      // Passo 1: Login do parceiro na API da CriaAI
      const loginResponse = await fetch(`${AUTH_API_URL}/${STAGE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          email: PARTNER_EMAIL,
          password: PARTNER_PASSWORD,
          signinMethod: 'email'
        })
      })

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao fazer login')
      }

      const loginData = await loginResponse.json()
      // A resposta pode vir em diferentes formatos, vamos tentar ambos
      const authorization = loginData.data?.authorization || loginData.authorization || loginData.data?.token || loginData.token
      const refreshToken = loginData.data?.refreshToken || loginData.refreshToken

      if (!authorization) {
        console.error('Resposta do login:', loginData)
        throw new Error('Token de autenticação não recebido na resposta')
      }

      setStep('create')

      // Passo 2: Criar documento externo
      // POST direto para o backend com credentials para permitir cookies
      const createResponse = await fetch(`${AUTH_API_URL}/${STAGE}/documents/create-document`, {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        credentials: 'include', // Importante: permite cookies cross-domain
        body: JSON.stringify({
          linkCallback: `${typeof window !== 'undefined' ? window.location.origin : ''}/callback?token=demo123`
        })
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ao criar documento: ${createResponse.status}`)
      }

      // Verificar se o backend retornou cookies nos headers
      const setCookieHeaders = createResponse.headers.get('set-cookie')
      console.log('🔍 [Integração] Verificando cookies do backend...')
      console.log('🔍 [Integração] Set-Cookie header:', setCookieHeaders)

      if (setCookieHeaders) {
        console.log('✅ Cookies recebidos do backend (Set-Cookie header):', setCookieHeaders)
        // Se o backend setou os cookies, eles já devem estar no navegador
        // Verificar se os cookies foram setados
        const cookiesSet = document.cookie
        console.log('🍪 Cookies atuais no navegador:', cookiesSet)
        console.log('🍪 documentId cookie:', document.cookie.split(';').find(c => c.trim().startsWith('documentId=')))
      }

      const createData = await createResponse.json()
      console.log('Resposta do create-document:', createData)

      // A resposta pode vir em diferentes formatos
      const documentId = createData.data?.documentId || createData.data?.documentID || createData.documentId || createData.documentID
      const docToken = createData.data?.authorization || createData.authorization || authorization
      const docRefreshToken = createData.data?.refreshToken || createData.refreshToken || refreshToken

      if (!documentId) {
        console.error('Resposta completa:', createData)
        throw new Error('documentId não recebido na resposta')
      }

      setStep('redirect')

      // IMPORTANTE: O backend provavelmente não está setando cookies diretamente
      // porque é cross-domain. Sempre usar a rota intermediária para garantir
      console.log('🔄 [Integração] Redirecionando para rota intermediária de cookies...')
      console.log('📋 [Integração] Dados do documento:', { documentId, hasToken: !!docToken, hasRefreshToken: !!docRefreshToken })

      const redirectUrl = new URL(`${CRIAAI_FRONTEND_URL}`)
      redirectUrl.searchParams.set('documentId', documentId)
      redirectUrl.searchParams.set('token', docToken)
      if (docRefreshToken) {
        // redirectUrl.searchParams.set('refreshToken', docRefreshToken)
      }

      console.log('🔗 [Integração] URL de redirect:', redirectUrl.toString())
      console.log('⏳ [Integração] Redirecionando em 100ms para garantir que tudo está pronto...')

      // Pequeno delay para garantir que tudo está processado
      setTimeout(() => {
        window.location.href = redirectUrl.toString()
      }, 10000)

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
      setLoading(false)
      setStep('idle')
      console.error('Erro no fluxo:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Integração
          </h1>
          <p className="text-gray-600">
            Integração com CriaAI
          </p>
        </div>

        <div className="space-y-4">
          {/* Status Steps */}
          <div className="space-y-3">
            <div className={`flex items-center gap-3 ${step === 'idle' ? 'text-gray-400' : 'text-green-600'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'idle' ? 'bg-gray-300' : 'bg-green-500'}`}>
                {step !== 'idle' && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm font-medium">Pronto para iniciar</span>
            </div>
            <div className={`flex items-center gap-3 ${step === 'login' ? 'text-blue-600' : step !== 'idle' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'login' ? 'bg-blue-500 animate-pulse' : step !== 'idle' ? 'bg-green-500' : 'bg-gray-300'}`}>
                {step === 'login' && <span className="text-white text-xs animate-spin">⟳</span>}
                {step !== 'idle' && step !== 'login' && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm font-medium">Fazendo login na API...</span>
            </div>
            <div className={`flex items-center gap-3 ${step === 'create' ? 'text-blue-600' : step === 'redirect' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'create' ? 'bg-blue-500 animate-pulse' : step === 'redirect' ? 'bg-green-500' : 'bg-gray-300'}`}>
                {step === 'create' && <span className="text-white text-xs animate-spin">⟳</span>}
                {step === 'redirect' && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm font-medium">Criando documento...</span>
            </div>
            <div className={`flex items-center gap-3 ${step === 'redirect' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step === 'redirect' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}>
                {step === 'redirect' && <span className="text-white text-xs animate-spin">⟳</span>}
              </div>
              <span className="text-sm font-medium">Redirecionando para CriaAI...</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-red-800 text-sm font-medium">Erro</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
            <p className="text-blue-800 text-xs">
              <strong className="font-semibold">Configuração:</strong>
              <br />
              Configure as variáveis de ambiente no arquivo <code className="bg-blue-100 px-1 rounded">.env.local</code>
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={handleCreateDocument}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⟳</span>
                Processando...
              </span>
            ) : (
              'Criar Documento na CriaAI'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

