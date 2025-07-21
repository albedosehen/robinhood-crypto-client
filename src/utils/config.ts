/**
 * Configuration management for the Robinhood Crypto Client
 * @module
 */

import type { CryptoClientConfig, RateLimitConfig } from '../types/mod.ts'
import { ConfigurationError } from '../errors/mod.ts'
import { validateApiKey } from '../client/crypto-helpers.ts'

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  baseUrl: 'https://trading.robinhood.com',
  timeout: 10000, // 10 seconds
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    burstCapacity: 300,
  } as RateLimitConfig,
  debug: false,
} as const

/**
 * Environment variable names
 */
export const ENV_VARS = {
  API_KEY: 'RH_CRYPTO_API_KEY',
  SECRET_KEY: 'RH_CRYPTO_SECRET_KEY',
  BASE_URL: 'RH_CRYPTO_BASE_URL',
  DEBUG: 'RH_CRYPTO_DEBUG',
} as const

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnv(): Partial<CryptoClientConfig> {
  const config: Partial<CryptoClientConfig> = {}

  const apiKey = Deno.env.get(ENV_VARS.API_KEY)
  if (apiKey) {
    config.apiKey = apiKey
  }

  const secretKey = Deno.env.get(ENV_VARS.SECRET_KEY)
  if (secretKey) {
    config.secretKey = secretKey
  }

  const baseUrl = Deno.env.get(ENV_VARS.BASE_URL)
  if (baseUrl) {
    config.baseUrl = baseUrl
  }

  const debug = Deno.env.get(ENV_VARS.DEBUG)
  if (debug) {
    config.debug = debug.toLowerCase() === 'true'
  }

  return config
}

/**
 * Merge configuration with defaults and environment variables
 */
export function createConfig(userConfig: Partial<CryptoClientConfig> = {}): CryptoClientConfig {
  const envConfig = loadConfigFromEnv()

  const partialConfig = {
    ...DEFAULT_CONFIG,
    ...envConfig,
    ...userConfig,
  }

  // Merge rate limit configuration
  if (userConfig.rateLimit || envConfig.rateLimit) {
    partialConfig.rateLimit = {
      ...DEFAULT_CONFIG.rateLimit,
      ...envConfig.rateLimit,
      ...userConfig.rateLimit,
    }
  }

  // Validate and cast to complete config
  validateConfig(partialConfig as CryptoClientConfig)
  return partialConfig as CryptoClientConfig
}

/**
 * Validate configuration values
 */
export function validateConfig(config: CryptoClientConfig): void {
  const errors: string[] = []

  // Validate required fields
  if (!config.apiKey) {
    errors.push('apiKey is required. Set RH_CRYPTO_API_KEY environment variable or pass in config.')
  }

  if (!config.secretKey) {
    errors.push('secretKey is required. Set RH_CRYPTO_SECRET_KEY environment variable or pass in config.')
  }

  // Validate API key format
  if (config.apiKey && !validateApiKey(config.apiKey)) {
    errors.push('apiKey format is invalid. Expected UUID format with optional "rh-api-" prefix.')
  }

  // Validate secret key format (should be base64)
  if (config.secretKey) {
    try {
      const cleanKey = config.secretKey.replace(/\s/g, '')
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanKey)) {
        errors.push('secretKey must be valid base64 format.')
      }

      // Should decode to 32 bytes for Ed25519
      const decoded = globalThis.atob(cleanKey)
      if (decoded.length !== 32) {
        errors.push('secretKey must decode to 32 bytes for Ed25519.')
      }
    } catch {
      errors.push('secretKey must be valid base64 format.')
    }
  }

  // Validate base URL
  if (config.baseUrl) {
    try {
      new URL(config.baseUrl)
    } catch {
      errors.push('baseUrl must be a valid URL.')
    }
  }

  // Validate timeout
  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout <= 0) {
      errors.push('timeout must be a positive number.')
    }
  }

  // Validate rate limit configuration
  if (config.rateLimit) {
    if (config.rateLimit.maxRequests !== undefined) {
      if (typeof config.rateLimit.maxRequests !== 'number' || config.rateLimit.maxRequests <= 0) {
        errors.push('rateLimit.maxRequests must be a positive number.')
      }
    }

    if (config.rateLimit.windowMs !== undefined) {
      if (typeof config.rateLimit.windowMs !== 'number' || config.rateLimit.windowMs <= 0) {
        errors.push('rateLimit.windowMs must be a positive number.')
      }
    }

    if (config.rateLimit.burstCapacity !== undefined) {
      if (typeof config.rateLimit.burstCapacity !== 'number' || config.rateLimit.burstCapacity <= 0) {
        errors.push('rateLimit.burstCapacity must be a positive number.')
      }
    }
  }

  if (errors.length > 0) {
    throw new ConfigurationError(`Configuration validation failed:\n${errors.join('\n')}`)
  }
}

/**
 * Sanitize configuration for logging (remove sensitive data)
 */
export function sanitizeConfig(config: CryptoClientConfig): Record<string, unknown> {
  const sanitized = { ...config }

  // Mask sensitive fields
  if (sanitized.apiKey) {
    sanitized.apiKey = maskSensitiveValue(sanitized.apiKey)
  }

  if (sanitized.secretKey) {
    sanitized.secretKey = '***REDACTED***'
  }

  return sanitized
}

/**
 * Mask sensitive value keeping first and last 2 characters
 */
function maskSensitiveValue(value: string): string {
  if (value.length <= 4) {
    return '*'.repeat(value.length)
  }

  return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2)
}

/**
 * Get configuration for debugging
 */
export function getDebugConfig(config: CryptoClientConfig): string {
  const sanitized = sanitizeConfig(config)
  return JSON.stringify(sanitized, null, 2)
}
