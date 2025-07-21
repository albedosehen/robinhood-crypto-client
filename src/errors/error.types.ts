/**
 * Type definitions for error handling in the Robinhood Crypto Client
 * @module
 */

/**
 * API error response structure from Robinhood
 */
export interface ApiErrorResponse {
  type: 'validation_error' | 'client_error' | 'server_error'
  errors: ApiErrorDetail[]
}

/**
 * Individual error detail from API response
 */
export interface ApiErrorDetail {
  detail: string
  attr?: string | null
}

/**
 * Retry configuration options
 */
export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  jitter: boolean
}

/**
 * Error context for enhanced debugging
 */
export interface ErrorContext {
  method: string
  url: string
  headers?: Record<string, string>
  body?: unknown
  timestamp: string
  requestId?: string
}

/**
 * Standard HTTP status codes
 */
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  UNSUPPORTED_MEDIA_TYPE: 415,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Error categories for classification
 */
export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'rate_limit'
  | 'network'
  | 'api'
  | 'configuration'
  | 'signature'
  | 'timeout'
  | 'unknown'
