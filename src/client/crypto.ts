/**
 * Main Robinhood Crypto Client
 * @module
 */

import type { CryptoClientConfig, EndpointStatus } from '../types/mod.ts'
import { HttpClient } from './httpClient.ts'
import { createConfig, validateConfig } from '../utils/mod.ts'
import { ConfigurationError } from '../errors/mod.ts'
import { AccountEndpoint } from '../endpoints/account/account-endpoint.ts'
import { MarketDataEndpoint } from '../endpoints/market-data/market-data-endpoint.ts'
import { TradingEndpoint } from '../endpoints/trading/trading-endpoint.ts'

/**
 * Main client for interacting with the Robinhood Crypto API
 *
 * @example
 * ```typescript
 * import { CryptoClient } from '@albedosehen/robinhood-crypto-client'
 *
 * const client = new CryptoClient({
 *   apiKey: 'your-api-key',
 *   secretKey: 'your-secret-key'
 * })
 *
 * // Test connectivity
 * const status = await client.testClientConnections()
 * console.log('Endpoints available:', status.endpoints)
 *
 * // Get account details
 * const account = await client.account.getAccountDetails()
 * console.log('Account:', account)
 * ```
 */
export class CryptoClient {
  private readonly config: CryptoClientConfig
  private readonly httpClient: HttpClient

  public readonly account: AccountEndpoint
  public readonly marketData: MarketDataEndpoint
  public readonly trading: TradingEndpoint

  /**
   * Create a new CryptoClient instance
   *
   * @param userConfig - Configuration options. API credentials can also be provided via environment variables
   * @throws {ConfigurationError} When configuration is invalid
   */
  constructor(userConfig: Partial<CryptoClientConfig> = {}) {
    try {
      // Merge user config with defaults and environment variables
      this.config = createConfig(userConfig)

      // Validate the final configuration
      validateConfig(this.config)

      // Create HTTP client
      this.httpClient = new HttpClient(this.config)

      // Initialize endpoint clients
      this.account = new AccountEndpoint(this.httpClient)
      this.marketData = new MarketDataEndpoint(this.httpClient)
      this.trading = new TradingEndpoint(this.httpClient)

      if (this.config.debug) {
        console.log('[CryptoClient] Initialized with config:', this.getSanitizedConfig())
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error
      }

      const message = error instanceof Error ? error.message : String(error)
      throw new ConfigurationError(`Failed to initialize CryptoClient: ${message}`)
    }
  }

  /**
   * Test connectivity to all API endpoints
   *
   * @returns Promise resolving to endpoint status information
   */
  async testClientConnections(): Promise<EndpointStatus> {
    const startTime = Date.now()
    const status: EndpointStatus = {
      endpoints: {
        account: false,
        marketData: false,
        trading: false,
      },
      timestamp: new Date(Date.now() - startTime).toISOString(),
      latency: {},
    }

    // Test account endpoint
    try {
      const accountStart = Date.now()
      await this.account.getAccountDetails()
      status.endpoints.account = true
      status.latency!.account = Date.now() - accountStart
    } catch (error) {
      if (this.config.debug) {
        console.log('[CryptoClient] Account endpoint test failed:', error)
      }
    }

    // Test market data endpoint
    try {
      const marketStart = Date.now()
      await this.marketData.getBestBidAsk(['BTC-USD'])
      status.endpoints.marketData = true
      status.latency!.marketData = Date.now() - marketStart
    } catch (error) {
      if (this.config.debug) {
        console.log('[CryptoClient] Market data endpoint test failed:', error)
      }
    }

    // Test trading endpoint
    try {
      const tradingStart = Date.now()
      await this.trading.getTradingPairs(['BTC-USD'])
      status.endpoints.trading = true
      status.latency!.trading = Date.now() - tradingStart
    } catch (error) {
      if (this.config.debug) {
        console.log('[CryptoClient] Trading endpoint test failed:', error)
      }
    }

    if (this.config.debug) {
      console.log('[CryptoClient] Connection test completed:', status)
    }

    return status
  }

  /**
   * Get current rate limiter status
   *
   * @returns Rate limiting information
   */
  getRateLimiterStatus() {
    return this.httpClient.getRateLimiterStatus()
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  resetRateLimiter(): void {
    this.httpClient.resetRateLimiter()
  }

  /**
   * Get client configuration (sanitized for logging)
   *
   * @returns Sanitized configuration object
   */
  getConfiguration(): Record<string, unknown> {
    return this.getSanitizedConfig()
  }

  /**
   * Check if debug mode is enabled
   *
   * @returns True if debug logging is enabled
   */
  isDebugEnabled(): boolean {
    return Boolean(this.config.debug)
  }

  /**
   * Get the base URL being used for API requests
   *
   * @returns The base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl!
  }

  /**
   * Get sanitized configuration for logging
   */
  private getSanitizedConfig(): Record<string, unknown> {
    const sanitized = { ...this.config }

    // Remove sensitive information
    if (sanitized.apiKey) {
      sanitized.apiKey = this.maskSensitiveValue(sanitized.apiKey)
    }

    if (sanitized.secretKey) {
      sanitized.secretKey = '***REDACTED***'
    }

    return sanitized
  }

  /**
   * Mask sensitive values for logging
   */
  private maskSensitiveValue(value: string): string {
    if (value.length <= 4) {
      return '*'.repeat(value.length)
    }

    return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2)
  }
}

/**
 * Default export for convenience
 */
export default CryptoClient
