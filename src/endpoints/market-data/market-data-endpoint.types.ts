/**
 * Types for Market Data Endpoints
 * @module
 */

import type { DecimalString, Symbol, Timestamp } from '../../types/mod.ts'

/**
 * Best bid and ask price information
 */
export interface BestBidAsk {
  /** Trading pair symbol (e.g., "BTC-USD") */
  symbol: Symbol
  /** Best bid price */
  bid_price: DecimalString
  /** Best ask price */
  ask_price: DecimalString
  /** Mid price between bid and ask */
  mid_price: DecimalString
  /** Bid-ask spread as decimal */
  spread: DecimalString
  /** Timestamp of the quote */
  timestamp: Timestamp
}

/**
 * Estimated price for a specific quantity
 */
export interface EstimatedPrice {
  /** Trading pair symbol */
  symbol: Symbol
  /** Side of the order (bid/ask/both) */
  side: 'bid' | 'ask' | 'both'
  /** Quantity for the estimate */
  quantity: DecimalString
  /** Estimated execution price */
  estimated_price: DecimalString
  /** Price impact percentage */
  price_impact?: DecimalString
  /** Total estimated cost/proceeds */
  total_cost?: DecimalString
  /** Timestamp of the estimate */
  timestamp: Timestamp
}

/**
 * Multiple estimated prices for different quantities
 */
export interface EstimatedPriceResponse {
  /** Array of estimated prices */
  results: EstimatedPrice[]
}

/**
 * Market depth information
 */
export interface MarketDepth {
  /** Trading pair symbol */
  symbol: Symbol
  /** Bid side order book */
  bids: OrderBookLevel[]
  /** Ask side order book */
  asks: OrderBookLevel[]
  /** Timestamp of the snapshot */
  timestamp: Timestamp
}

/**
 * Order book level (price and quantity)
 */
export interface OrderBookLevel {
  /** Price level */
  price: DecimalString
  /** Total quantity at this level */
  quantity: DecimalString
  /** Number of orders at this level */
  order_count?: number
}

/**
 * 24-hour ticker statistics
 */
export interface TickerStats {
  /** Trading pair symbol */
  symbol: Symbol
  /** Last trade price */
  last_price: DecimalString
  /** 24h price change */
  price_change_24h: DecimalString
  /** 24h price change percentage */
  price_change_percent_24h: DecimalString
  /** 24h high price */
  high_24h: DecimalString
  /** 24h low price */
  low_24h: DecimalString
  /** 24h trading volume */
  volume_24h: DecimalString
  /** 24h volume in quote currency */
  quote_volume_24h: DecimalString
  /** Current best bid */
  bid_price: DecimalString
  /** Current best ask */
  ask_price: DecimalString
  /** Timestamp of the data */
  timestamp: Timestamp
}

/**
 * Candlestick/OHLCV data
 */
export interface Candlestick {
  /** Trading pair symbol */
  symbol: Symbol
  /** Period start time */
  timestamp: Timestamp
  /** Opening price */
  open: DecimalString
  /** Highest price */
  high: DecimalString
  /** Lowest price */
  low: DecimalString
  /** Closing price */
  close: DecimalString
  /** Trading volume */
  volume: DecimalString
  /** Volume in quote currency */
  quote_volume: DecimalString
  /** Number of trades */
  trade_count?: number
}

/**
 * Market data query options
 */
export interface MarketDataOptions {
  /** Symbols to query (if not provided, all symbols) */
  symbols?: Symbol[]
  /** Limit for number of results */
  limit?: number
  /** Start time for historical data */
  start_time?: Timestamp
  /** End time for historical data */
  end_time?: Timestamp
}

/**
 * Price estimation request parameters
 */
export interface EstimatePriceRequest {
  /** Trading pair symbol */
  symbol: Symbol
  /** Order side */
  side: 'bid' | 'ask' | 'both'
  /** Quantities to estimate (max 10) */
  quantities: DecimalString[]
}
