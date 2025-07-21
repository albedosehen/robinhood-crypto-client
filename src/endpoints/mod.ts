/**
 * Endpoint module exports for the account, market, and trading endpoints.
 * @module
 */

export { BaseEndpoint } from './base-endpoint.ts'

export { AccountEndpoint } from './account/account-endpoint.ts'
export {
  type AccountActivity,
  type AccountBalance,
  type AccountDetails,
  type AccountPermissions,
  type AccountSummary,
} from './account/account-endpoint.types.ts'

export { MarketDataEndpoint } from './market-data/market-data-endpoint.ts'
export {
  type BestBidAsk,
  type Candlestick,
  type EstimatedPrice,
  type EstimatedPriceResponse,
  type EstimatePriceRequest,
  type MarketDataOptions,
  type MarketDepth,
  type OrderBookLevel,
  type TickerStats,
} from './market-data/market-data-endpoint.types.ts'

export { TradingEndpoint } from './trading/trading-endpoint.ts'
export {
  type CreateOrderRequest,
  type CryptoHolding,
  type LimitBuyOrder,
  type LimitOrderConfig,
  type LimitSellOrder,
  type MarketBuyOrder,
  type MarketOrderConfig,
  type MarketSellOrder,
  type Order,
  type OrderCancellationResponse,
  type OrderExecution,
  type OrderFilters,
  type PortfolioSummary,
  type StopLimitOrderConfig,
  type StopLossOrderConfig,
  type TradingPair,
} from './trading/trading-endpoint.types.ts'
