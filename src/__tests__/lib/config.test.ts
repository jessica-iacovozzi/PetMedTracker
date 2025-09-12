import { config } from '@/lib/config'

describe('Environment Variable Management', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Environment Detection', () => {
    it('should detect production environment from VERCEL_ENV', () => {
      process.env.VERCEL_ENV = 'production'
      
      const { configUtils } = require('@/lib/config')
      expect(configUtils.getEnvironment()).toBe('production')
    })

    it('should detect staging environment from VERCEL_ENV', () => {
      process.env.VERCEL_ENV = 'preview'
      
      const { configUtils } = require('@/lib/config')
      expect(configUtils.getEnvironment()).toBe('staging')
    })

    it('should detect production environment from NODE_ENV', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.VERCEL_ENV
      
      const { configUtils } = require('@/lib/config')
      expect(configUtils.getEnvironment()).toBe('production')
    })

    it('should default to development environment', () => {
      delete process.env.NODE_ENV
      delete process.env.VERCEL_ENV
      
      const { configUtils } = require('@/lib/config')
      expect(configUtils.getEnvironment()).toBe('development')
    })
  })

  describe('Environment Variable Resolution', () => {
    it('should use production-prefixed variables in production', () => {
      process.env.VERCEL_ENV = 'production'
      process.env.PROD_SUPABASE_URL = 'https://prod.supabase.co'
      process.env.SUPABASE_URL = 'https://dev.supabase.co'
      
      const { configUtils } = require('@/lib/config')
      const result = configUtils.getEnvVar('SUPABASE_URL', 'production')
      expect(result).toBe('https://prod.supabase.co')
    })

    it('should use staging-prefixed variables in staging', () => {
      process.env.VERCEL_ENV = 'preview'
      process.env.STAGING_SUPABASE_URL = 'https://staging.supabase.co'
      process.env.SUPABASE_URL = 'https://dev.supabase.co'
      
      const { configUtils } = require('@/lib/config')
      const result = configUtils.getEnvVar('SUPABASE_URL', 'staging')
      expect(result).toBe('https://staging.supabase.co')
    })

    it('should fallback to generic variable if environment-specific not found', () => {
      process.env.VERCEL_ENV = 'production'
      process.env.SUPABASE_URL = 'https://fallback.supabase.co'
      
      const { configUtils } = require('@/lib/config')
      const result = configUtils.getEnvVar('SUPABASE_URL', 'production')
      expect(result).toBe('https://fallback.supabase.co')
    })

    it('should use fallback value if provided', () => {
      const { configUtils } = require('@/lib/config')
      const result = configUtils.getEnvVar('MISSING_VAR', 'development', 'fallback-value')
      expect(result).toBe('fallback-value')
    })

    it('should throw error if required variable is missing', () => {
      const { configUtils } = require('@/lib/config')
      expect(() => {
        configUtils.getEnvVar('MISSING_VAR', 'development')
      }).toThrow('Missing required environment variable: MISSING_VAR')
    })
  })

  describe('Configuration Validation', () => {
    it('should validate required configuration fields', () => {
      const validConfig = {
        environment: 'development' as const,
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-anon-key',
          serviceKey: 'test-service-key',
          projectId: 'test-project',
        },
        stripe: {
          secretKey: 'sk_test_123',
          webhookSecret: 'whsec_123',
        },
        app: {
          url: 'http://localhost:3000',
          name: 'Test App',
        },
      }

      const { configUtils } = require('@/lib/config')
      expect(() => configUtils.validateConfig(validConfig)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidConfig = {
        environment: 'development' as const,
        supabase: {
          url: '',
          anonKey: 'test-anon-key',
          serviceKey: 'test-service-key',
          projectId: 'test-project',
        },
        stripe: {
          secretKey: '',
          webhookSecret: 'whsec_123',
        },
        app: {
          url: 'http://localhost:3000',
          name: 'Test App',
        },
      }

      const { configUtils } = require('@/lib/config')
      expect(() => configUtils.validateConfig(invalidConfig)).toThrow(
        'Missing required configuration fields: supabase.url, stripe.secretKey'
      )
    })
  })

  describe('Environment Type Guards', () => {
    it('should correctly identify production environment', () => {
      process.env.VERCEL_ENV = 'production'
      
      const { isProduction, isStaging, isDevelopment } = require('@/lib/config')
      expect(isProduction()).toBe(true)
      expect(isStaging()).toBe(false)
      expect(isDevelopment()).toBe(false)
    })

    it('should correctly identify staging environment', () => {
      process.env.VERCEL_ENV = 'preview'
      
      const { isProduction, isStaging, isDevelopment } = require('@/lib/config')
      expect(isProduction()).toBe(false)
      expect(isStaging()).toBe(true)
      expect(isDevelopment()).toBe(false)
    })

    it('should correctly identify development environment', () => {
      delete process.env.VERCEL_ENV
      delete process.env.NODE_ENV
      
      const { isProduction, isStaging, isDevelopment } = require('@/lib/config')
      expect(isProduction()).toBe(false)
      expect(isStaging()).toBe(false)
      expect(isDevelopment()).toBe(true)
    })
  })
})