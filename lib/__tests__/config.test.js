/**
 * Testes para o módulo de configuração
 */

const { getConfig, validateConfig } = require('../config')

// Mock do process.env
const originalEnv = process.env

describe('Config Module', () => {
  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv }
    // Clear all NEXT_PUBLIC_* env vars
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('PARTNER_')) {
        delete process.env[key]
      }
    })
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
  })

  describe('getConfig', () => {
    test('should return valid config with all required variables set', () => {
      // Set up valid environment
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com'
      process.env.NEXT_PUBLIC_AUTH_API_URL = 'https://auth.example.com'
      process.env.NEXT_PUBLIC_CRIAAI_FRONTEND_URL = 'https://frontend.example.com'
      process.env.NEXT_PUBLIC_STAGE = 'prod'
      process.env.NEXT_PUBLIC_API_KEY = 'test-api-key'
      process.env.PARTNER_EMAIL = 'partner@example.com'
      process.env.PARTNER_PASSWORD = 'password123'

      const config = getConfig()

      expect(config.isValid).toBe(true)
      expect(config.errors).toHaveLength(0)
      expect(config.apiBaseUrl).toBe('https://api.example.com')
      expect(config.authApiUrl).toBe('https://auth.example.com')
      expect(config.criaaiFrontendUrl).toBe('https://frontend.example.com')
      expect(config.stage).toBe('prod')
      expect(config.apiKey).toBe('test-api-key')
      expect(config.partnerEmail).toBe('partner@example.com')
      expect(config.partnerPassword).toBe('password123')
    })

    test('should return invalid config with missing required variables', () => {
      // No environment variables set
      const config = getConfig()

      expect(config.isValid).toBe(false)
      expect(config.errors).toHaveLength(6) // All required vars missing
      expect(config.errors).toContain('NEXT_PUBLIC_API_BASE_URL não está configurada')
      expect(config.errors).toContain('NEXT_PUBLIC_AUTH_API_URL não está configurada')
      expect(config.errors).toContain('NEXT_PUBLIC_CRIAAI_FRONTEND_URL não está configurada')
      expect(config.errors).toContain('NEXT_PUBLIC_STAGE não está configurada')
      expect(config.errors).toContain('NEXT_PUBLIC_API_KEY não está configurada')
      expect(config.errors).toContain('PARTNER_EMAIL não está configurada')
      expect(config.errors).toContain('PARTNER_PASSWORD não está configurada')
    })

    test('should validate URLs correctly', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'not-a-url'
      process.env.NEXT_PUBLIC_AUTH_API_URL = 'https://auth.example.com'
      process.env.NEXT_PUBLIC_CRIAAI_FRONTEND_URL = 'https://frontend.example.com'
      process.env.NEXT_PUBLIC_STAGE = 'prod'
      process.env.NEXT_PUBLIC_API_KEY = 'test-api-key'
      process.env.PARTNER_EMAIL = 'partner@example.com'
      process.env.PARTNER_PASSWORD = 'password123'

      const config = getConfig()

      expect(config.isValid).toBe(false)
      expect(config.errors).toContain('NEXT_PUBLIC_API_BASE_URL não é uma URL válida')
    })

    test('should validate email correctly', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com'
      process.env.NEXT_PUBLIC_AUTH_API_URL = 'https://auth.example.com'
      process.env.NEXT_PUBLIC_CRIAAI_FRONTEND_URL = 'https://frontend.example.com'
      process.env.NEXT_PUBLIC_STAGE = 'prod'
      process.env.NEXT_PUBLIC_API_KEY = 'test-api-key'
      process.env.PARTNER_EMAIL = 'not-an-email'
      process.env.PARTNER_PASSWORD = 'password123'

      const config = getConfig()

      expect(config.isValid).toBe(false)
      expect(config.errors).toContain('PARTNER_EMAIL não é um email válido')
    })
  })

  describe('validateConfig', () => {
    test('should not throw error with valid config', () => {
      // Set up valid environment
      process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com'
      process.env.NEXT_PUBLIC_AUTH_API_URL = 'https://auth.example.com'
      process.env.NEXT_PUBLIC_CRIAAI_FRONTEND_URL = 'https://frontend.example.com'
      process.env.NEXT_PUBLIC_STAGE = 'prod'
      process.env.NEXT_PUBLIC_API_KEY = 'test-api-key'
      process.env.PARTNER_EMAIL = 'partner@example.com'
      process.env.PARTNER_PASSWORD = 'password123'

      expect(() => validateConfig()).not.toThrow()
    })

    test('should throw error with invalid config', () => {
      // No environment variables set
      expect(() => validateConfig()).toThrow('❌ Configuração inválida. Verifique as seguintes variáveis de ambiente:')
    })
  })
})

