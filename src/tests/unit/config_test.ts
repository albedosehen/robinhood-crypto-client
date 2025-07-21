/**
 * Unit tests for configuration management
 */

import { assertEquals, assertThrows } from '@std/assert'
import {
  createConfig,
  DEFAULT_CONFIG,
  ENV_VARS,
  getDebugConfig,
  loadConfigFromEnv,
  sanitizeConfig,
  validateConfig,
} from '../../utils/config.ts'
import { ConfigurationError } from '../../errors/mod.ts'
import { createTestConfig, mockEnvVars } from '../utils/test-helpers.ts'

Deno.test('DEFAULT_CONFIG - has correct default values', () => {
  assertEquals(DEFAULT_CONFIG.baseUrl, 'https://trading.robinhood.com')
  assertEquals(DEFAULT_CONFIG.timeout, 10000)
  assertEquals(DEFAULT_CONFIG.debug, false)
  assertEquals(DEFAULT_CONFIG.rateLimit.maxRequests, 100)
  assertEquals(DEFAULT_CONFIG.rateLimit.windowMs, 60000)
  assertEquals(DEFAULT_CONFIG.rateLimit.burstCapacity, 300)
})

Deno.test('ENV_VARS - has correct environment variable names', () => {
  assertEquals(ENV_VARS.API_KEY, 'RH_CRYPTO_API_KEY')
  assertEquals(ENV_VARS.SECRET_KEY, 'RH_CRYPTO_SECRET_KEY')
  assertEquals(ENV_VARS.BASE_URL, 'RH_CRYPTO_BASE_URL')
  assertEquals(ENV_VARS.DEBUG, 'RH_CRYPTO_DEBUG')
})

Deno.test('loadConfigFromEnv - returns empty config when no env vars set', () => {
  const cleanup = mockEnvVars({})

  try {
    const config = loadConfigFromEnv()
    assertEquals(config, {})
  } finally {
    cleanup()
  }
})

Deno.test('loadConfigFromEnv - loads API key from environment', () => {
  const cleanup = mockEnvVars({
    'RH_CRYPTO_API_KEY': 'test-api-key-123',
  })

  try {
    const config = loadConfigFromEnv()
    assertEquals(config.apiKey, 'test-api-key-123')
  } finally {
    cleanup()
  }
})

Deno.test('loadConfigFromEnv - loads secret key from environment', () => {
  const cleanup = mockEnvVars({
    'RH_CRYPTO_SECRET_KEY': 'dGVzdC1zZWNyZXQta2V5LTMyLWJ5dGVzLWZvci1lZDI1NTE5',
  })

  try {
    const config = loadConfigFromEnv()
    assertEquals(config.secretKey, 'dGVzdC1zZWNyZXQta2V5LTMyLWJ5dGVzLWZvci1lZDI1NTE5')
  } finally {
    cleanup()
  }
})

Deno.test('loadConfigFromEnv - loads base URL from environment', () => {
  const cleanup = mockEnvVars({
    'RH_CRYPTO_BASE_URL': 'https://sandbox.robinhood.com',
  })

  try {
    const config = loadConfigFromEnv()
    assertEquals(config.baseUrl, 'https://sandbox.robinhood.com')
  } finally {
    cleanup()
  }
})

Deno.test('loadConfigFromEnv - loads debug flag from environment', () => {
  const cleanup = mockEnvVars({
    'RH_CRYPTO_DEBUG': 'true',
  })

  try {
    const config = loadConfigFromEnv()
    assertEquals(config.debug, true)
  } finally {
    cleanup()
  }
})

Deno.test('loadConfigFromEnv - handles false debug flag', () => {
  const cleanup = mockEnvVars({
    'RH_CRYPTO_DEBUG': 'false',
  })

  try {
    const config = loadConfigFromEnv()
    assertEquals(config.debug, false)
  } finally {
    cleanup()
  }
})

Deno.test('loadConfigFromEnv - loads all environment variables', () => {
  const cleanup = mockEnvVars({
    'RH_CRYPTO_API_KEY': 'env-api-key',
    'RH_CRYPTO_SECRET_KEY': 'env-secret-key',
    'RH_CRYPTO_BASE_URL': 'https://env.example.com',
    'RH_CRYPTO_DEBUG': 'true',
  })

  try {
    const config = loadConfigFromEnv()
    assertEquals(config.apiKey, 'env-api-key')
    assertEquals(config.secretKey, 'env-secret-key')
    assertEquals(config.baseUrl, 'https://env.example.com')
    assertEquals(config.debug, true)
  } finally {
    cleanup()
  }
})

Deno.test('createConfig - merges defaults, env, and user config', () => {
  const cleanup = mockEnvVars({
    'RH_CRYPTO_BASE_URL': 'https://env.example.com',
  })

  try {
    const testConfig = createTestConfig()
    const config = createConfig({
      apiKey: testConfig.apiKey,
      secretKey: testConfig.secretKey,
    })

    assertEquals(config.apiKey, testConfig.apiKey) // User config wins
    assertEquals(config.baseUrl, 'https://env.example.com') // Env config wins
    assertEquals(config.timeout, 10000) // Default config
    assertEquals(config.debug, false) // Default config
  } finally {
    cleanup()
  }
})

Deno.test('createConfig - user config overrides env config', () => {
  const cleanup = mockEnvVars({
    'RH_CRYPTO_API_KEY': 'rh-api-12345678-1234-1234-1234-123456789012',
    'RH_CRYPTO_DEBUG': 'false',
  })

  try {
    const testConfig = createTestConfig()
    const config = createConfig({
      apiKey: testConfig.apiKey,
      secretKey: testConfig.secretKey,
      debug: true,
    })

    assertEquals(config.apiKey, testConfig.apiKey)
    assertEquals(config.debug, true)
  } finally {
    cleanup()
  }
})

Deno.test('createConfig - merges rate limit configuration', () => {
  const testConfig = createTestConfig()
  const config = createConfig({
    apiKey: testConfig.apiKey,
    secretKey: testConfig.secretKey,
    rateLimit: {
      maxRequests: 50, // Override default
    },
  })

  assertEquals(config.rateLimit?.maxRequests, 50)
  assertEquals(config.rateLimit?.windowMs, 60000) // Default
  assertEquals(config.rateLimit?.burstCapacity, 300) // Default
})

Deno.test('validateConfig - accepts valid configuration', () => {
  const config = createTestConfig()

  // Should not throw
  validateConfig(config)
})

Deno.test('validateConfig - throws when API key missing', () => {
  const config = createTestConfig({
    apiKey: '',
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'apiKey is required',
  )
})

Deno.test('validateConfig - throws when secret key missing', () => {
  const config = createTestConfig({
    secretKey: '',
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'secretKey is required',
  )
})

Deno.test('validateConfig - throws for invalid API key format', () => {
  const config = createTestConfig({
    apiKey: 'invalid-api-key',
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'apiKey format is invalid',
  )
})

Deno.test('validateConfig - throws for invalid secret key format', () => {
  const config = createTestConfig({
    secretKey: 'invalid@base64!',
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'secretKey must be valid base64 format',
  )
})

Deno.test('validateConfig - throws for wrong secret key length', () => {
  const shortKey = globalThis.btoa('short') // Too short for Ed25519
  const config = createTestConfig({
    secretKey: shortKey,
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'secretKey must decode to 32 bytes',
  )
})

Deno.test('validateConfig - throws for invalid base URL', () => {
  const config = createTestConfig({
    baseUrl: 'not-a-valid-url',
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'baseUrl must be a valid URL',
  )
})

Deno.test('validateConfig - throws for invalid timeout', () => {
  const config = createTestConfig({
    timeout: -1000,
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'timeout must be a positive number',
  )
})

Deno.test('validateConfig - throws for invalid rate limit maxRequests', () => {
  const config = createTestConfig({
    rateLimit: {
      maxRequests: -10,
      windowMs: 60000,
    },
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'rateLimit.maxRequests must be a positive number',
  )
})

Deno.test('validateConfig - throws for invalid rate limit windowMs', () => {
  const config = createTestConfig({
    rateLimit: {
      maxRequests: 100,
      windowMs: 0,
    },
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'rateLimit.windowMs must be a positive number',
  )
})

Deno.test('validateConfig - throws for invalid rate limit burstCapacity', () => {
  const config = createTestConfig({
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000,
      burstCapacity: -50,
    },
  })

  assertThrows(
    () => validateConfig(config),
    ConfigurationError,
    'rateLimit.burstCapacity must be a positive number',
  )
})

Deno.test('validateConfig - collects multiple validation errors', () => {
  const config = createTestConfig({
    apiKey: '',
    secretKey: '',
    timeout: -1000,
  })

  try {
    validateConfig(config)
    throw new Error('Should have thrown')
  } catch (error) {
    if (error instanceof ConfigurationError) {
      assertEquals(error.message.includes('apiKey is required'), true)
      assertEquals(error.message.includes('secretKey is required'), true)
      assertEquals(error.message.includes('timeout must be a positive number'), true)
    } else {
      throw error
    }
  }
})

Deno.test('sanitizeConfig - masks sensitive API key', () => {
  const config = createTestConfig({
    apiKey: 'test-api-key-12345678',
  })

  const sanitized = sanitizeConfig(config)
  const maskedKey = sanitized.apiKey as string
  // Should mask middle part of API key
  assertEquals(maskedKey.startsWith('te'), true)
  assertEquals(maskedKey.endsWith('78'), true)
  assertEquals(maskedKey.includes('*'), true)
})

Deno.test('sanitizeConfig - redacts secret key completely', () => {
  const config = createTestConfig()

  const sanitized = sanitizeConfig(config)
  assertEquals(sanitized.secretKey, '***REDACTED***')
})

Deno.test('sanitizeConfig - preserves non-sensitive fields', () => {
  const config = createTestConfig({
    baseUrl: 'https://test.example.com',
    timeout: 5000,
    debug: true,
  })

  const sanitized = sanitizeConfig(config)
  assertEquals(sanitized.baseUrl, 'https://test.example.com')
  assertEquals(sanitized.timeout, 5000)
  assertEquals(sanitized.debug, true)
})

Deno.test('sanitizeConfig - handles short API key', () => {
  const config = createTestConfig({
    apiKey: 'abc',
  })

  const sanitized = sanitizeConfig(config)
  assertEquals(sanitized.apiKey, '***')
})

Deno.test('getDebugConfig - returns JSON string of sanitized config', () => {
  const config = createTestConfig({
    debug: true,
  })

  const debugString = getDebugConfig(config)
  const parsed = JSON.parse(debugString)

  assertEquals(parsed.debug, true)
  assertEquals(parsed.secretKey, '***REDACTED***')
  assertEquals(typeof parsed.apiKey, 'string')
  assertEquals(parsed.apiKey.includes('*'), true)
})

Deno.test('configuration integration - full config creation and validation', () => {
  const cleanup = mockEnvVars({
    'RH_CRYPTO_BASE_URL': 'https://sandbox.robinhood.com',
  })

  try {
    const testConfig = createTestConfig()
    const config = createConfig({
      apiKey: testConfig.apiKey,
      secretKey: testConfig.secretKey,
      timeout: 15000,
      debug: true,
      rateLimit: {
        maxRequests: 200,
        burstCapacity: 500,
      },
    })

    // Should not throw
    validateConfig(config)

    // Verify merged configuration
    assertEquals(config.apiKey, testConfig.apiKey)
    assertEquals(config.baseUrl, 'https://sandbox.robinhood.com') // From env
    assertEquals(config.timeout, 15000) // From user
    assertEquals(config.debug, true) // From user
    assertEquals(config.rateLimit?.maxRequests, 200) // From user
    assertEquals(config.rateLimit?.windowMs, 60000) // Default
    assertEquals(config.rateLimit?.burstCapacity, 500) // From user

    // Test sanitization
    const sanitized = sanitizeConfig(config)
    assertEquals(typeof sanitized.apiKey, 'string')
    assertEquals((sanitized.apiKey as string).includes('*'), true)
    assertEquals(sanitized.secretKey, '***REDACTED***')
  } finally {
    cleanup()
  }
})

Deno.test('configuration edge cases - handles undefined rate limit', () => {
  const testConfig = createTestConfig()
  const config = createConfig({
    apiKey: testConfig.apiKey,
    secretKey: testConfig.secretKey,
  })

  // Should have default rate limit
  assertEquals(config.rateLimit?.maxRequests, 100)
  assertEquals(config.rateLimit?.windowMs, 60000)
  assertEquals(config.rateLimit?.burstCapacity, 300)
})

Deno.test('configuration edge cases - handles partial rate limit config', () => {
  const testConfig = createTestConfig()
  const config = createConfig({
    apiKey: testConfig.apiKey,
    secretKey: testConfig.secretKey,
    rateLimit: {
      maxRequests: 150,
      // windowMs and burstCapacity should use defaults
    },
  })

  assertEquals(config.rateLimit?.maxRequests, 150)
  assertEquals(config.rateLimit?.windowMs, 60000) // Default
  assertEquals(config.rateLimit?.burstCapacity, 300) // Default
})
