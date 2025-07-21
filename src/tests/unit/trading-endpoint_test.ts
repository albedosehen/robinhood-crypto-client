/**
 * Trading Endpoint Unit Tests
 * Tests trading-related API functionality and validation logic
 */

import { assertEquals, assertRejects } from '@std/assert'
import { stub } from '@std/testing/mock'
import { TradingEndpoint } from '../../endpoints/trading/trading-endpoint.ts'
import type { HttpClient, HttpResponse } from '../../client/httpClient.ts'
import type { CreateOrderRequest, OrderFilters } from '../../endpoints/trading/trading-endpoint.types.ts'
import { ValidationError } from '../../errors/mod.ts'
import { mockCryptoHoldings, mockOrder, mockPaginatedResponse } from '../fixtures/api-responses.ts'

// Mock HttpClient for testing
class MockHttpClient {
  async get<T>(path: string): Promise<HttpResponse<T>> {
    return {
      data: {} as T,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com' + path,
    }
  }

  // deno-lint-ignore no-unused-vars
  async post<T>(path: string, body?: unknown): Promise<HttpResponse<T>> {
    return {
      data: {} as T,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com' + path,
    }
  }
}

Deno.test('TradingEndpoint - initializes correctly', () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  assertEquals(typeof endpoint, 'object')
  assertEquals(typeof endpoint.getTradingPairs, 'function')
  assertEquals(typeof endpoint.getHoldings, 'function')
  assertEquals(typeof endpoint.getOrders, 'function')
  assertEquals(typeof endpoint.placeOrder, 'function')
  assertEquals(typeof endpoint.cancelOrder, 'function')
})

Deno.test('TradingEndpoint - getTradingPairs without symbols', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockPaginatedResponse.tradingPairs,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/trading_pairs/',
    }))

  try {
    const result = await endpoint.getTradingPairs()

    assertEquals(result, mockPaginatedResponse.tradingPairs)
    assertEquals(getStub.calls.length, 1)
    assertEquals(getStub.calls[0].args[0], '/api/v1/crypto/trading/trading_pairs/')
  } finally {
    getStub.restore()
  }
})

Deno.test('TradingEndpoint - getTradingPairs with symbols', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockPaginatedResponse.tradingPairs,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/trading_pairs/',
    }))

  try {
    const result = await endpoint.getTradingPairs(['BTC-USD', 'ETH-USD'])

    assertEquals(result, mockPaginatedResponse.tradingPairs)
    assertEquals(getStub.calls.length, 1)
    const calledPath = getStub.calls[0].args[0] as string
    assertEquals(calledPath.includes('symbol=BTC-USD'), true)
    assertEquals(calledPath.includes('symbol=ETH-USD'), true)
  } finally {
    getStub.restore()
  }
})

Deno.test('TradingEndpoint - getHoldings without asset codes', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockPaginatedResponse.holdings,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/holdings/',
    }))

  try {
    const result = await endpoint.getHoldings()

    assertEquals(result, mockPaginatedResponse.holdings)
    assertEquals(getStub.calls.length, 1)
    assertEquals(getStub.calls[0].args[0], '/api/v1/crypto/trading/holdings/')
  } finally {
    getStub.restore()
  }
})

Deno.test('TradingEndpoint - getHoldings with asset codes', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockPaginatedResponse.holdings,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/holdings/',
    }))

  try {
    const result = await endpoint.getHoldings(['BTC', 'ETH'])

    assertEquals(result, mockPaginatedResponse.holdings)
    assertEquals(getStub.calls.length, 1)
    const calledPath = getStub.calls[0].args[0] as string
    assertEquals(calledPath.includes('asset_code=BTC'), true)
    assertEquals(calledPath.includes('asset_code=ETH'), true)
  } finally {
    getStub.restore()
  }
})

Deno.test('TradingEndpoint - getOrders with filters', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockPaginatedResponse.orders,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/',
    }))

  try {
    const filters: OrderFilters = { state: 'open', symbol: 'BTC-USD' }
    const result = await endpoint.getOrders(filters)

    assertEquals(result, mockPaginatedResponse.orders)
    assertEquals(getStub.calls.length, 1)
    const calledPath = getStub.calls[0].args[0] as string
    assertEquals(calledPath.includes('state=open'), true)
    assertEquals(calledPath.includes('symbol=BTC-USD'), true)
  } finally {
    getStub.restore()
  }
})

Deno.test('TradingEndpoint - getOrder by ID', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockOrder,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/test-id/',
    }))

  try {
    const result = await endpoint.getOrder('test-id')

    assertEquals(result, mockOrder)
    assertEquals(getStub.calls.length, 1)
    assertEquals(getStub.calls[0].args[0], '/api/v1/crypto/trading/orders/test-id/')
  } finally {
    getStub.restore()
  }
})

Deno.test('TradingEndpoint - getOrder validates order ID', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  await assertRejects(
    () => endpoint.getOrder(''),
    ValidationError,
    'Order ID is required and must be a string',
  )
})

Deno.test('TradingEndpoint - placeOrder with valid request', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const postStub = stub(mockClient, 'post', () =>
    Promise.resolve({
      data: mockOrder,
      status: 201,
      statusText: 'Created',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/',
    }))

  try {
    const request: CreateOrderRequest = {
      symbol: 'BTC-USD',
      client_order_id: 'test-client-id',
      side: 'buy',
      type: 'market',
      market_order_config: {
        asset_quantity: '0.001',
      },
    }

    const result = await endpoint.placeOrder(request)

    assertEquals(result, mockOrder)
    assertEquals(postStub.calls.length, 1)
    assertEquals(postStub.calls[0].args[0], '/api/v1/crypto/trading/orders/')
    assertEquals(postStub.calls[0].args[1], request)
  } finally {
    postStub.restore()
  }
})

Deno.test('TradingEndpoint - placeOrder validates request', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  // Missing symbol
  await assertRejects(
    () =>
      endpoint.placeOrder({
        symbol: '',
        client_order_id: 'test-id',
        side: 'buy',
        type: 'market',
        market_order_config: { asset_quantity: '0.001' },
      }),
    ValidationError,
    'Symbol is required and must be a string',
  )

  // Missing client_order_id
  await assertRejects(
    () =>
      endpoint.placeOrder({
        symbol: 'BTC-USD',
        client_order_id: '',
        side: 'buy',
        type: 'market',
        market_order_config: { asset_quantity: '0.001' },
      }),
    ValidationError,
    'Client order ID is required and must be a string',
  )

  // Invalid side
  await assertRejects(
    () =>
      endpoint.placeOrder({
        symbol: 'BTC-USD',
        client_order_id: 'test-id',
        // deno-lint-ignore no-explicit-any
        side: 'invalid' as any,
        type: 'market',
        market_order_config: { asset_quantity: '0.001' },
      }),
    ValidationError,
    'Side must be "buy" or "sell"',
  )

  // Invalid type
  await assertRejects(
    () =>
      endpoint.placeOrder({
        symbol: 'BTC-USD',
        client_order_id: 'test-id',
        side: 'buy',
        // deno-lint-ignore no-explicit-any
        type: 'invalid' as any,
        market_order_config: { asset_quantity: '0.001' },
      }),
    ValidationError,
    'Type must be "limit", "market", "stop_limit", or "stop_loss"',
  )
})

Deno.test('TradingEndpoint - cancelOrder', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const postStub = stub(mockClient, 'post', () =>
    Promise.resolve({
      data: 'Order cancelled successfully',
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/test-id/cancel/',
    }))

  try {
    const result = await endpoint.cancelOrder('test-id')

    assertEquals(result.message, 'Order cancelled successfully')
    assertEquals(result.order_id, 'test-id')
    assertEquals(typeof result.cancelled_at, 'string')
    assertEquals(postStub.calls.length, 1)
    assertEquals(postStub.calls[0].args[0], '/api/v1/crypto/trading/orders/test-id/cancel/')
  } finally {
    postStub.restore()
  }
})

Deno.test('TradingEndpoint - cancelOrder validates order ID', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  await assertRejects(
    () => endpoint.cancelOrder(''),
    ValidationError,
    'Order ID is required and must be a string',
  )
})

Deno.test('TradingEndpoint - placeMarketBuyOrder with asset quantity', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const postStub = stub(mockClient, 'post', () =>
    Promise.resolve({
      data: mockOrder,
      status: 201,
      statusText: 'Created',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/',
    }))

  try {
    const result = await endpoint.placeMarketBuyOrder({
      symbol: 'BTC-USD',
      assetQuantity: '0.001',
    })

    assertEquals(result, mockOrder)
    assertEquals(postStub.calls.length, 1)

    const calledRequest = postStub.calls[0].args[1] as CreateOrderRequest
    assertEquals(calledRequest.symbol, 'BTC-USD')
    assertEquals(calledRequest.side, 'buy')
    assertEquals(calledRequest.type, 'market')
    assertEquals(calledRequest.market_order_config?.asset_quantity, '0.001')
  } finally {
    postStub.restore()
  }
})

Deno.test('TradingEndpoint - placeMarketBuyOrder validates parameters', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  // Missing both quantities
  await assertRejects(
    () => endpoint.placeMarketBuyOrder({ symbol: 'BTC-USD' }),
    ValidationError,
    'Either assetQuantity or quoteAmount must be provided',
  )

  // Both quantities provided
  await assertRejects(
    () =>
      endpoint.placeMarketBuyOrder({
        symbol: 'BTC-USD',
        assetQuantity: '0.001',
        quoteAmount: '50.00',
      }),
    ValidationError,
    'Cannot specify both assetQuantity and quoteAmount',
  )
})

Deno.test('TradingEndpoint - placeMarketSellOrder with asset quantity', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const postStub = stub(mockClient, 'post', () =>
    Promise.resolve({
      data: mockOrder,
      status: 201,
      statusText: 'Created',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/',
    }))

  try {
    const result = await endpoint.placeMarketSellOrder({
      symbol: 'BTC-USD',
      assetQuantity: '0.001',
    })

    assertEquals(result, mockOrder)
    assertEquals(postStub.calls.length, 1)

    const calledRequest = postStub.calls[0].args[1] as CreateOrderRequest
    assertEquals(calledRequest.symbol, 'BTC-USD')
    assertEquals(calledRequest.side, 'sell')
    assertEquals(calledRequest.type, 'market')
    assertEquals(calledRequest.market_order_config?.asset_quantity, '0.001')
  } finally {
    postStub.restore()
  }
})

Deno.test('TradingEndpoint - placeLimitBuyOrder', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const postStub = stub(mockClient, 'post', () =>
    Promise.resolve({
      data: mockOrder,
      status: 201,
      statusText: 'Created',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/',
    }))

  try {
    const result = await endpoint.placeLimitBuyOrder({
      symbol: 'BTC-USD',
      limitPrice: '49000.00',
      assetQuantity: '0.001',
    })

    assertEquals(result, mockOrder)
    assertEquals(postStub.calls.length, 1)

    const calledRequest = postStub.calls[0].args[1] as CreateOrderRequest
    assertEquals(calledRequest.symbol, 'BTC-USD')
    assertEquals(calledRequest.side, 'buy')
    assertEquals(calledRequest.type, 'limit')
    assertEquals(calledRequest.limit_order_config?.limit_price, '49000.00')
    assertEquals(calledRequest.limit_order_config?.asset_quantity, '0.001')
    assertEquals(calledRequest.limit_order_config?.time_in_force, 'gtc')
  } finally {
    postStub.restore()
  }
})

Deno.test('TradingEndpoint - placeLimitSellOrder', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const postStub = stub(mockClient, 'post', () =>
    Promise.resolve({
      data: mockOrder,
      status: 201,
      statusText: 'Created',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/',
    }))

  try {
    const result = await endpoint.placeLimitSellOrder({
      symbol: 'BTC-USD',
      limitPrice: '51000.00',
      assetQuantity: '0.001',
      timeInForce: 'ioc',
    })

    assertEquals(result, mockOrder)
    assertEquals(postStub.calls.length, 1)

    const calledRequest = postStub.calls[0].args[1] as CreateOrderRequest
    assertEquals(calledRequest.symbol, 'BTC-USD')
    assertEquals(calledRequest.side, 'sell')
    assertEquals(calledRequest.type, 'limit')
    assertEquals(calledRequest.limit_order_config?.limit_price, '51000.00')
    assertEquals(calledRequest.limit_order_config?.asset_quantity, '0.001')
    assertEquals(calledRequest.limit_order_config?.time_in_force, 'ioc')
  } finally {
    postStub.restore()
  }
})

Deno.test('TradingEndpoint - getOpenOrders', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockPaginatedResponse.orders,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/orders/',
    }))

  try {
    const result = await endpoint.getOpenOrders('BTC-USD')

    assertEquals(result, mockPaginatedResponse.orders.results)
    assertEquals(getStub.calls.length, 1)
    const calledPath = getStub.calls[0].args[0] as string
    assertEquals(calledPath.includes('state=open'), true)
    assertEquals(calledPath.includes('symbol=BTC-USD'), true)
  } finally {
    getStub.restore()
  }
})

Deno.test('TradingEndpoint - getPortfolioSummary', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockPaginatedResponse.holdings,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/holdings/',
    }))

  try {
    const result = await endpoint.getPortfolioSummary()

    assertEquals(typeof result.total_value, 'string')
    assertEquals(typeof result.cash_balance, 'string')
    assertEquals(typeof result.crypto_value, 'string')
    assertEquals(result.currency, 'USD')
    assertEquals(result.holdings, mockPaginatedResponse.holdings.results)
    assertEquals(typeof result.updated_at, 'string')
  } finally {
    getStub.restore()
  }
})

Deno.test('TradingEndpoint - hasSufficientBalance returns true when sufficient', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const mockHolding = { ...mockCryptoHoldings[0], asset_code: 'USD', available_quantity: '1000.00' }
  const mockHoldingsResponse = { results: [mockHolding], next: undefined, previous: undefined }

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockHoldingsResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/holdings/',
    }))

  try {
    const result = await endpoint.hasSufficientBalance('BTC-USD', 'buy', '500.00')

    assertEquals(result, true)
    assertEquals(getStub.calls.length, 1)
    const calledPath = getStub.calls[0].args[0] as string
    assertEquals(calledPath.includes('asset_code=USD'), true)
  } finally {
    getStub.restore()
  }
})

Deno.test('TradingEndpoint - hasSufficientBalance returns false when insufficient', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new TradingEndpoint(mockClient)

  const mockHolding = { ...mockCryptoHoldings[0], asset_code: 'USD', available_quantity: '100.00' }
  const mockHoldingsResponse = { results: [mockHolding], next: undefined, previous: undefined }

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockHoldingsResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/holdings/',
    }))

  try {
    const result = await endpoint.hasSufficientBalance('BTC-USD', 'buy', '500.00')

    assertEquals(result, false)
  } finally {
    getStub.restore()
  }
})
