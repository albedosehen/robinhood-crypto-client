/**
 * Core type definitions for the Robinhood Crypto Client
 * @module
 */

/**
 * Configuration for the CryptoClient
 */
export interface CryptoClientConfig {
  /** API key from Robinhood credentials portal */
  apiKey: string
  /** Base64-encoded private key for Ed25519 signing */
  secretKey: string
  /** Base URL for API requests (defaults to production) */
  baseUrl?: string
  /** Rate limiting configuration */
  rateLimit?: RateLimitConfig
  /** Request timeout in milliseconds */
  timeout?: number
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Maximum requests per minute */
  maxRequests?: number
  /** Burst capacity for immediate requests */
  burstCapacity?: number
  /** Window size in milliseconds */
  windowMs?: number
}

/**
 * Generic pagination response from API
 */
export interface PaginatedResponse<T> {
  /** Array of results for current page */
  results: T[]
  /** URL for next page (if available) */
  next?: string
  /** URL for previous page (if available) */
  previous?: string
}

/**
 * Pagination options for requests
 */
export interface PaginationOptions {
  /** Cursor for pagination */
  cursor?: string
  /** Maximum number of results per page */
  limit?: number
}

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/**
 * Request headers for API calls
 */
export interface RequestHeaders {
  'x-api-key': string
  'x-signature': string
  'x-timestamp': string
  'Content-Type'?: string
  'Accept'?: string
}

/**
 * Base request options
 */
export interface RequestOptions {
  method: HttpMethod
  path: string
  body?: unknown
  headers?: Record<string, string>
  timeout?: number
}

/**
 * Authentication credentials
 */
export interface AuthCredentials {
  apiKey: string
  secretKey: string
}

/**
 * Status of endpoint connectivity
 */
export interface EndpointStatus {
  endpoints: {
    account: boolean
    marketData: boolean
    trading: boolean
  }
  timestamp: string
  latency?: {
    account?: number
    marketData?: number
    trading?: number
  }
}

/**
 * Currency pair symbol format (e.g., 'BTC-USD')
 */
export type Symbol = string

/**
 * Asset code format (e.g., 'BTC', 'ETH')
 */
export type AssetCode = string

/**
 * Order side enumeration
 */
export type OrderSide = 'buy' | 'sell'

/**
 * Order type enumeration
 */
export type OrderType = 'limit' | 'market' | 'stop_limit' | 'stop_loss'

/**
 * Order state enumeration
 */
export type OrderState = 'open' | 'canceled' | 'partially_filled' | 'filled' | 'failed'

/**
 * Time in force enumeration
 */
export type TimeInForce = 'gtc' | 'ioc' | 'fok'

/**
 * Account status enumeration
 */
export type AccountStatus = 'active' | 'inactive' | 'suspended'

/**
 * Price/quantity as string to preserve precision
 */
export type DecimalString = string

/**
 * UUID string format
 */
export type UUID = string

/**
 * ISO 8601 timestamp string
 */
export type Timestamp = string
