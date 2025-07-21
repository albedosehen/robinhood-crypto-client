/**
 * Mock API response fixtures for testing
 * @module
 */

import type {
  AccountDetails,
  BestBidAsk,
  CryptoHolding,
  EstimatedPriceResponse,
  Order,
  TradingPair,
} from '../../endpoints/mod.ts'

/**
 * Mock account details response
 */
export const mockAccountDetails: AccountDetails = {
  account_number: 'A12345678',
  status: 'active',
  buying_power: '1000.00',
  buying_power_currency: 'USD',
}

/**
 * Mock trading pairs response
 */
export const mockTradingPairs: TradingPair[] = [
  {
    symbol: 'BTC-USD',
    base_asset: 'BTC',
    quote_asset: 'USD',
    min_order_size: '0.000001',
    max_order_size: '1000000',
    price_increment: '0.01',
    quantity_increment: '0.000001',
    trading_enabled: true,
    status: 'active',
  },
  {
    symbol: 'ETH-USD',
    base_asset: 'ETH',
    quote_asset: 'USD',
    min_order_size: '0.00001',
    max_order_size: '1000000',
    price_increment: '0.01',
    quantity_increment: '0.00001',
    trading_enabled: true,
    status: 'active',
  },
]

/**
 * Mock crypto holdings response
 */
export const mockCryptoHoldings: CryptoHolding[] = [
  {
    asset_code: 'BTC',
    quantity: '0.12345678',
    available_quantity: '0.12345678',
    locked_quantity: '0.0',
    average_cost: '45000.00',
    cost_currency: 'USD',
    market_value: '50000.00',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    asset_code: 'ETH',
    quantity: '2.5',
    available_quantity: '2.5',
    locked_quantity: '0.0',
    average_cost: '1200.00',
    cost_currency: 'USD',
    market_value: '3500.00',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

/**
 * Mock order response
 */
export const mockOrder: Order = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  account_number: 'A12345678',
  client_order_id: '550e8400-e29b-41d4-a716-446655440001',
  symbol: 'BTC-USD',
  side: 'buy',
  type: 'market',
  state: 'filled',
  filled_asset_quantity: '0.001',
  average_price: '50000.00',
  executions: [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      quantity: '0.001',
      price: '50000.00',
      value: '50.00',
      timestamp: '2023-01-01T00:00:00Z',
    },
  ],
  market_order_config: {
    asset_quantity: '0.001',
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

/**
 * Mock orders list response
 */
export const mockOrders: Order[] = [
  mockOrder,
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    account_number: 'A12345678',
    client_order_id: '550e8400-e29b-41d4-a716-446655440003',
    symbol: 'ETH-USD',
    side: 'sell',
    type: 'limit',
    state: 'open',
    filled_asset_quantity: '0.0',
    executions: [],
    limit_order_config: {
      asset_quantity: '1.0',
      limit_price: '1400.00',
      time_in_force: 'gtc',
    },
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
]

/**
 * Mock best bid ask response
 */
export const mockBestBidAsk: BestBidAsk[] = [
  {
    symbol: 'BTC-USD',
    bid_price: '49950.00',
    ask_price: '50050.00',
    mid_price: '50000.00',
    spread: '100.00',
    timestamp: '2023-01-01T00:00:00Z',
  },
  {
    symbol: 'ETH-USD',
    bid_price: '1395.00',
    ask_price: '1405.00',
    mid_price: '1400.00',
    spread: '10.00',
    timestamp: '2023-01-01T00:00:00Z',
  },
]

/**
 * Mock estimated price response
 */
export const mockEstimatedPrice: EstimatedPriceResponse = {
  results: [
    {
      symbol: 'BTC-USD',
      side: 'ask',
      quantity: '0.1',
      estimated_price: '50025.00',
      total_cost: '5002.50',
      timestamp: '2023-01-01T00:00:00Z',
    },
  ],
}

/**
 * Mock error responses
 */
export const mockErrorResponses = {
  badRequest: {
    type: 'validation_error',
    errors: [
      {
        code: 'invalid_symbol',
        detail: 'Invalid trading pair symbol',
        field: 'symbol',
      },
    ],
  },
  unauthorized: {
    type: 'authentication_error',
    errors: [
      {
        code: 'invalid_credentials',
        detail: 'Invalid API credentials',
      },
    ],
  },
  rateLimit: {
    type: 'rate_limit_error',
    errors: [
      {
        code: 'rate_limit_exceeded',
        detail: 'Rate limit exceeded. Try again later.',
      },
    ],
  },
  serverError: {
    type: 'internal_error',
    errors: [
      {
        code: 'internal_server_error',
        detail: 'An unexpected error occurred',
      },
    ],
  },
}

/**
 * Mock paginated responses
 */
export const mockPaginatedResponse = {
  tradingPairs: {
    results: mockTradingPairs,
    next: 'https://trading.robinhood.com/api/v1/crypto/trading/trading_pairs/?cursor=next_cursor',
    previous: undefined,
  },
  holdings: {
    results: mockCryptoHoldings,
    next: undefined,
    previous: undefined,
  },
  orders: {
    results: mockOrders,
    next: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/?cursor=next_cursor',
    previous: undefined,
  },
}
