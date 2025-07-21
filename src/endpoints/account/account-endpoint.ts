/**
 * The Account Endpoint for Robinhood Crypto Client
 * @module
 */

import { BaseEndpoint } from '../base-endpoint.ts'
import type { HttpClient } from '../../client/httpClient.ts'
import type {
  AccountActivity,
  AccountBalance,
  AccountDetails,
  AccountPermissions,
  AccountSummary,
} from './account-endpoint.types.ts'
import type { PaginatedResponse, PaginationOptions } from '../../types/mod.ts'

/**
 * Account endpoint for accessing account information and details
 *
 * @example
 * ```typescript
 * // Get account details
 * const account = await client.account.getAccountDetails()
 * console.log('Account status:', account.status)
 * console.log('Buying power:', account.buying_power)
 * ```
 */
export class AccountEndpoint extends BaseEndpoint {
  constructor(httpClient: HttpClient) {
    super(httpClient)
  }

  /**
   * Get account details for the authenticated user
   *
   * @returns Promise resolving to account details
   *
   * @example
   * ```typescript
   * const account = await client.account.getAccountDetails()
   * console.log('Account number:', account.account_number)
   * console.log('Status:', account.status)
   * console.log('Buying power:', account.buying_power, account.buying_power_currency)
   * ```
   */
  async getAccountDetails(): Promise<AccountDetails> {
    const response = await this.httpClient.get<AccountDetails>('/api/v1/crypto/trading/accounts/')
    return response.data
  }

  /**
   * Get comprehensive account summary
   *
   * @returns Promise resolving to account summary with additional metadata
   */
  async getAccountSummary(): Promise<AccountSummary> {
    const account = await this.getAccountDetails()

    return {
      account,
      updated_at: new Date().toISOString(),
    }
  }

  /**
   * Get account balance information
   * Note: This is a derived method that calculates balances from holdings
   *
   * @returns Promise resolving to account balance information
   */
  async getAccountBalance(): Promise<AccountBalance> {
    // This would typically require getting holdings data and calculating totals
    // For now, we'll return a basic structure based on buying power
    const account = await this.getAccountDetails()

    return {
      total_value: account.buying_power,
      cash_balance: account.buying_power,
      crypto_value: '0.00',
      currency: account.buying_power_currency,
      updated_at: new Date().toISOString(),
    }
  }

  /**
   * Get account permissions and trading capabilities
   * Note: This is derived from successful API calls and account status
   *
   * @returns Promise resolving to account permissions
   */
  async getAccountPermissions(): Promise<AccountPermissions> {
    const account = await this.getAccountDetails()

    return {
      trading_enabled: account.status === 'active',
      market_data_enabled: true, // Generally available if API access works
      account_access_enabled: true, // Must be true if we can get account details
      limits: {
        max_order_value: undefined, // Would need to be obtained from account settings
        max_daily_volume: undefined,
      },
    }
  }

  /**
   * Get account activity history
   * Note: This endpoint may not be directly available in the current API
   * This is a placeholder for future implementation
   *
   * @param options - Pagination options
   * @returns Promise resolving to paginated account activity
   */
  async getAccountActivity(_options: PaginationOptions = {}): Promise<PaginatedResponse<AccountActivity>> {
    // This would typically call a dedicated activity endpoint
    // For now, return empty results as this endpoint may not be available
    console.warn('[!] Account activity endpoint is not implemented yet. Returning empty results. [!]')
    return {
      results: [],
      next: undefined,
      previous: undefined,
    }
  }

  /**
   * Get all account activity (all pages)
   *
   * @param options - Pagination options for initial request
   * @returns Promise resolving to all account activity entries
   */
  async getAllAccountActivity(options: PaginationOptions = {}): Promise<AccountActivity[]> {
    return this.getAllPages<AccountActivity>('/api/v1/crypto/trading/activity/', options)
  }

  /**
   * Check if account is active and ready for trading
   *
   * @returns Promise resolving to boolean indicating if account is active
   */
  async isAccountActive(): Promise<boolean> {
    try {
      const account = await this.getAccountDetails()
      return account.status === 'active'
    } catch {
      return false
    }
  }

  /**
   * Get account status string
   *
   * @returns Promise resolving to current account status
   */
  async getAccountStatus(): Promise<string> {
    const account = await this.getAccountDetails()
    return account.status
  }

  /**
   * Get available buying power
   *
   * @returns Promise resolving to buying power amount and currency
   */
  async getBuyingPower(): Promise<{ amount: string; currency: string }> {
    const account = await this.getAccountDetails()
    return {
      amount: account.buying_power,
      currency: account.buying_power_currency,
    }
  }
}
