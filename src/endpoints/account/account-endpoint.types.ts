/**
 * Types for Account Endpoints
 * @module
 */

import type { AccountStatus, DecimalString, Timestamp } from '../../types/mod.ts'

/**
 * Account details response
 */
export interface AccountDetails {
  /** Account number identifier */
  account_number: string
  /** Current account status */
  status: AccountStatus
  /** Available buying power */
  buying_power: DecimalString
  /** Currency of the buying power */
  buying_power_currency: string
}

/**
 * Account summary information
 */
export interface AccountSummary {
  /** Account details */
  account: AccountDetails
  /** Last updated timestamp */
  updated_at: Timestamp
}

/**
 * Account balance information
 */
export interface AccountBalance {
  /** Total portfolio value */
  total_value: DecimalString
  /** Available cash balance */
  cash_balance: DecimalString
  /** Total crypto holdings value */
  crypto_value: DecimalString
  /** Currency of the balances */
  currency: string
  /** Last updated timestamp */
  updated_at: Timestamp
}

/**
 * Account permissions and capabilities
 */
export interface AccountPermissions {
  /** Can place trades */
  trading_enabled: boolean
  /** Can access market data */
  market_data_enabled: boolean
  /** Can view account details */
  account_access_enabled: boolean
  /** Maximum order size limits */
  limits?: {
    /** Maximum order value in USD */
    max_order_value?: DecimalString
    /** Maximum daily trading volume */
    max_daily_volume?: DecimalString
  }
}

/**
 * Account activity entry
 */
export interface AccountActivity {
  /** Activity ID */
  id: string
  /** Type of activity */
  type: 'trade' | 'deposit' | 'withdrawal' | 'fee' | 'interest'
  /** Activity description */
  description: string
  /** Amount involved */
  amount: DecimalString
  /** Currency of the amount */
  currency: string
  /** Activity timestamp */
  created_at: Timestamp
  /** Related order ID if applicable */
  order_id?: string
  /** Additional metadata */
  metadata?: Record<string, unknown>
}
