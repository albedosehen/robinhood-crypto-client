/**
 * Types for Trading Endpoints
 * @module
 */

import type {
  AssetCode,
  DecimalString,
  OrderSide,
  OrderState,
  OrderType,
  Symbol,
  TimeInForce,
  Timestamp,
  UUID,
} from '../../types/mod.ts'

/**
 * Trading pair information
 */
export interface TradingPair {
  /** Trading pair symbol */
  symbol: Symbol
  /** Base asset code */
  base_asset: AssetCode
  /** Quote asset code */
  quote_asset: AssetCode
  /** Minimum order size */
  min_order_size: DecimalString
  /** Maximum order size */
  max_order_size: DecimalString
  /** Price increment/tick size */
  price_increment: DecimalString
  /** Quantity increment/step size */
  quantity_increment: DecimalString
  /** Whether trading is enabled */
  trading_enabled: boolean
  /** Status of the trading pair */
  status: 'active' | 'inactive' | 'halted'
}

/**
 * Crypto holdings information
 */
export interface CryptoHolding {
  /** Asset code */
  asset_code: AssetCode
  /** Total quantity held */
  quantity: DecimalString
  /** Available quantity for trading */
  available_quantity: DecimalString
  /** Quantity locked in open orders */
  locked_quantity: DecimalString
  /** Average cost basis */
  average_cost: DecimalString
  /** Currency of the cost basis */
  cost_currency: string
  /** Current market value */
  market_value?: DecimalString
  /** Last updated timestamp */
  updated_at: Timestamp
}

/**
 * Market order configuration
 */
export interface MarketOrderConfig {
  /** Asset quantity to buy/sell */
  asset_quantity?: DecimalString
  /** Quote amount (alternative to asset_quantity) */
  quote_amount?: DecimalString
}

/**
 * Limit order configuration
 */
export interface LimitOrderConfig {
  /** Asset quantity to buy/sell */
  asset_quantity?: DecimalString
  /** Quote amount (alternative to asset_quantity) */
  quote_amount?: DecimalString
  /** Limit price */
  limit_price: DecimalString
  /** Time in force */
  time_in_force: TimeInForce
}

/**
 * Stop loss order configuration
 */
export interface StopLossOrderConfig {
  /** Asset quantity to buy/sell */
  asset_quantity?: DecimalString
  /** Quote amount (alternative to asset_quantity) */
  quote_amount?: DecimalString
  /** Stop price */
  stop_price: DecimalString
  /** Time in force */
  time_in_force: TimeInForce
}

/**
 * Stop limit order configuration
 */
export interface StopLimitOrderConfig {
  /** Asset quantity to buy/sell */
  asset_quantity?: DecimalString
  /** Quote amount (alternative to asset_quantity) */
  quote_amount?: DecimalString
  /** Limit price */
  limit_price: DecimalString
  /** Stop price */
  stop_price: DecimalString
  /** Time in force */
  time_in_force: TimeInForce
}

/**
 * Order execution information
 */
export interface OrderExecution {
  /** Execution ID */
  id: UUID
  /** Executed quantity */
  quantity: DecimalString
  /** Execution price */
  price: DecimalString
  /** Total execution value */
  value: DecimalString
  /** Execution timestamp */
  timestamp: Timestamp
  /** Fee charged */
  fee?: DecimalString
  /** Fee currency */
  fee_currency?: string
}

/**
 * Complete order information
 */
export interface Order {
  /** Order ID */
  id: UUID
  /** Account number */
  account_number: string
  /** Trading pair symbol */
  symbol: Symbol
  /** Client order ID */
  client_order_id: UUID
  /** Order side */
  side: OrderSide
  /** Order type */
  type: OrderType
  /** Order state */
  state: OrderState
  /** Average execution price */
  average_price?: DecimalString
  /** Total filled quantity */
  filled_asset_quantity: DecimalString
  /** Order creation timestamp */
  created_at: Timestamp
  /** Last update timestamp */
  updated_at: Timestamp
  /** Array of executions */
  executions: OrderExecution[]
  /** Market order configuration (if applicable) */
  market_order_config?: MarketOrderConfig
  /** Limit order configuration (if applicable) */
  limit_order_config?: LimitOrderConfig
  /** Stop loss order configuration (if applicable) */
  stop_loss_order_config?: StopLossOrderConfig
  /** Stop limit order configuration (if applicable) */
  stop_limit_order_config?: StopLimitOrderConfig
}

/**
 * Order creation request
 */
export interface CreateOrderRequest {
  /** Trading pair symbol */
  symbol: Symbol
  /** Client order ID for idempotency */
  client_order_id: UUID
  /** Order side */
  side: OrderSide
  /** Order type */
  type: OrderType
  /** Market order configuration */
  market_order_config?: MarketOrderConfig
  /** Limit order configuration */
  limit_order_config?: LimitOrderConfig
  /** Stop loss order configuration */
  stop_loss_order_config?: StopLossOrderConfig
  /** Stop limit order configuration */
  stop_limit_order_config?: StopLimitOrderConfig
}

/**
 * Order query filters
 */
export interface OrderFilters {
  /** Filter by creation start time */
  created_at_start?: Timestamp
  /** Filter by creation end time */
  created_at_end?: Timestamp
  /** Filter by symbol */
  symbol?: Symbol
  /** Filter by order ID */
  id?: UUID
  /** Filter by side */
  side?: OrderSide
  /** Filter by state */
  state?: OrderState
  /** Filter by type */
  type?: OrderType
  /** Filter by update start time */
  updated_at_start?: Timestamp
  /** Filter by update end time */
  updated_at_end?: Timestamp
}

/**
 * Order cancellation response
 */
export interface OrderCancellationResponse {
  /** Success message */
  message: string
  /** Order ID that was cancelled */
  order_id: UUID
  /** Cancellation timestamp */
  cancelled_at: Timestamp
}

/**
 * Portfolio summary
 */
export interface PortfolioSummary {
  /** Total portfolio value */
  total_value: DecimalString
  /** Total cash balance */
  cash_balance: DecimalString
  /** Total crypto value */
  crypto_value: DecimalString
  /** Currency of the values */
  currency: string
  /** Individual holdings */
  holdings: CryptoHolding[]
  /** Last updated timestamp */
  updated_at: Timestamp
}

/**
 * Order helper types for convenience
 */
export type MarketBuyOrder = {
  symbol: Symbol
  client_order_id: UUID
  side: 'buy'
  type: 'market'
  market_order_config: MarketOrderConfig
}

export type MarketSellOrder = {
  symbol: Symbol
  client_order_id: UUID
  side: 'sell'
  type: 'market'
  market_order_config: MarketOrderConfig
}

export type LimitBuyOrder = {
  symbol: Symbol
  client_order_id: UUID
  side: 'buy'
  type: 'limit'
  limit_order_config: LimitOrderConfig
}

export type LimitSellOrder = {
  symbol: Symbol
  client_order_id: UUID
  side: 'sell'
  type: 'limit'
  limit_order_config: LimitOrderConfig
}
