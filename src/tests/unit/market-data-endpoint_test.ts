/**
 * Market Data Endpoint Unit Tests
 * Tests market data API functionality and validation logic
 */

import { assertEquals, assertRejects, assertThrows } from '@std/assert'
import { stub } from '@std/testing/mock'
import { MarketDataEndpoint } from '../../endpoints/market-data/market-data-endpoint.ts'
import type { HttpClient, HttpResponse } from '../../client/httpClient.ts'
import { ValidationError } from '../../errors/mod.ts'
import { mockBestBidAsk } from '../fixtures/api-responses.ts'

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

Deno.test('MarketDataEndpoint - initializes correctly', () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  assertEquals(typeof endpoint, 'object')
  assertEquals(typeof endpoint.getBestBidAsk, 'function')
  assertEquals(typeof endpoint.getEstimatedPrice, 'function')
  assertEquals(typeof endpoint.getCurrentPrice, 'function')
})

Deno.test('MarketDataEndpoint - getBestBidAsk without symbols', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const mockResponse = { results: mockBestBidAsk }
  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/marketdata/best_bid_ask/',
    }))

  try {
    const result = await endpoint.getBestBidAsk()

    assertEquals(result, mockResponse)
    assertEquals(getStub.calls.length, 1)
    assertEquals(getStub.calls[0].args[0], '/api/v1/crypto/marketdata/best_bid_ask/')
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - getBestBidAsk with symbols calls correct path', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const mockResponse = { results: mockBestBidAsk }
  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/marketdata/best_bid_ask/',
    }))

  try {
    const result = await endpoint.getBestBidAsk(['BTC-USD', 'ETH-USD'])

    assertEquals(result, mockResponse)
    assertEquals(getStub.calls.length, 1)
    const calledPath = getStub.calls[0].args[0] as string
    assertEquals(calledPath.includes('symbol=BTC-USD'), true)
    assertEquals(calledPath.includes('symbol=ETH-USD'), true)
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - getBestBidAsk validates symbol format', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  await assertRejects(
    () => endpoint.getBestBidAsk(['INVALID']),
    ValidationError,
    'Invalid symbol format: INVALID. Expected format like "BTC-USD"',
  )

  await assertRejects(
    () => endpoint.getBestBidAsk(['']),
    ValidationError,
    'Symbol must be a non-empty string',
  )
})

Deno.test('MarketDataEndpoint - getEstimatedPrice validates symbol', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  await assertRejects(
    () =>
      endpoint.getEstimatedPrice({
        symbol: '',
        side: 'ask',
        quantities: ['1.0'],
      }),
    ValidationError,
    'Symbol is required and must be a string',
  )

  await assertRejects(
    () =>
      endpoint.getEstimatedPrice({
        symbol: 'INVALID',
        side: 'ask',
        quantities: ['1.0'],
      }),
    ValidationError,
    'Invalid symbol format: INVALID. Expected format like "BTC-USD"',
  )
})

Deno.test('MarketDataEndpoint - getEstimatedPrice validates side', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  await assertRejects(
    () =>
      endpoint.getEstimatedPrice({
        symbol: 'BTC-USD',
        // deno-lint-ignore no-explicit-any
        side: 'invalid' as any,
        quantities: ['1.0'],
      }),
    ValidationError,
    'Side must be "bid", "ask", or "both"',
  )
})

Deno.test('MarketDataEndpoint - getEstimatedPrice validates quantities', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  await assertRejects(
    () =>
      endpoint.getEstimatedPrice({
        symbol: 'BTC-USD',
        side: 'ask',
        quantities: [],
      }),
    ValidationError,
    'Quantities array is required and must not be empty',
  )

  await assertRejects(
    () =>
      endpoint.getEstimatedPrice({
        symbol: 'BTC-USD',
        side: 'ask',
        quantities: Array(11).fill('1.0'),
      }),
    ValidationError,
    'Maximum 10 quantities can be specified per request',
  )

  await assertRejects(
    () =>
      endpoint.getEstimatedPrice({
        symbol: 'BTC-USD',
        side: 'ask',
        quantities: ['invalid'],
      }),
    ValidationError,
    'Invalid quantity: invalid. Must be a positive number',
  )

  await assertRejects(
    () =>
      endpoint.getEstimatedPrice({
        symbol: 'BTC-USD',
        side: 'ask',
        quantities: ['-1.0'],
      }),
    ValidationError,
    'Invalid quantity: -1.0. Must be a positive number',
  )
})

Deno.test('MarketDataEndpoint - getCurrentPrice returns mid price', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const mockResponse = { results: mockBestBidAsk }
  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/marketdata/best_bid_ask/',
    }))

  try {
    const result = await endpoint.getCurrentPrice('BTC-USD')

    assertEquals(result, mockBestBidAsk[0].mid_price)
    assertEquals(getStub.calls.length, 1)
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - getCurrentPrice throws when no data', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const mockResponse = { results: [] }
  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/marketdata/best_bid_ask/',
    }))

  try {
    await assertRejects(
      () => endpoint.getCurrentPrice('INVALID-USD'),
      ValidationError,
      'No quote data available for symbol: INVALID-USD',
    )
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - getCurrentPrices returns price map', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const mockBtc = { ...mockBestBidAsk[0], symbol: 'BTC-USD', mid_price: '50000.00' }
  const mockEth = { ...mockBestBidAsk[0], symbol: 'ETH-USD', mid_price: '3000.00' }
  const mockResponse = { results: [mockBtc, mockEth] }

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/marketdata/best_bid_ask/',
    }))

  try {
    const result = await endpoint.getCurrentPrices(['BTC-USD', 'ETH-USD'])

    assertEquals(result['BTC-USD'], '50000.00')
    assertEquals(result['ETH-USD'], '3000.00')
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - getSpread calculates spread correctly', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const mockQuote = {
    ...mockBestBidAsk[0],
    symbol: 'BTC-USD',
    bid_price: '49900.00',
    ask_price: '50100.00',
    mid_price: '50000.00',
  }
  const mockResponse = { results: [mockQuote] }

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/marketdata/best_bid_ask/',
    }))

  try {
    const result = await endpoint.getSpread('BTC-USD')

    assertEquals(result.symbol, 'BTC-USD')
    assertEquals(result.spread, '200')
    assertEquals(result.spreadPercent, '0.4000')
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - isSymbolTrading returns true for valid quotes', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const mockQuote = {
    ...mockBestBidAsk[0],
    bid_price: '49900.00',
    ask_price: '50100.00',
  }
  const mockResponse = { results: [mockQuote] }

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/marketdata/best_bid_ask/',
    }))

  try {
    const result = await endpoint.isSymbolTrading('BTC-USD')
    assertEquals(result, true)
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - isSymbolTrading returns false for invalid quotes', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const mockQuote = {
    ...mockBestBidAsk[0],
    bid_price: '0.00',
    ask_price: '0.00',
  }
  const mockResponse = { results: [mockQuote] }

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/marketdata/best_bid_ask/',
    }))

  try {
    const result = await endpoint.isSymbolTrading('BTC-USD')
    assertEquals(result, false)
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - isSymbolTrading returns false on error', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () => Promise.reject(new Error('API Error')))

  try {
    const result = await endpoint.isSymbolTrading('BTC-USD')
    assertEquals(result, false)
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - getAvailableSymbols returns symbol list', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  const mockBtc = { ...mockBestBidAsk[0], symbol: 'BTC-USD' }
  const mockEth = { ...mockBestBidAsk[0], symbol: 'ETH-USD' }
  const mockResponse = { results: [mockBtc, mockEth] }

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/marketdata/best_bid_ask/',
    }))

  try {
    const result = await endpoint.getAvailableSymbols()

    assertEquals(result, ['BTC-USD', 'ETH-USD'])
  } finally {
    getStub.restore()
  }
})

Deno.test('MarketDataEndpoint - validateSymbol throws for invalid formats', () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  // Test empty string
  assertThrows(
    () => endpoint.validateSymbol(''),
    ValidationError,
    'Symbol must be a non-empty string',
  )

  // Test missing dash
  assertThrows(
    () => endpoint.validateSymbol('BTCUSD'),
    ValidationError,
    'Invalid symbol format: BTCUSD. Expected format like "BTC-USD"',
  )

  // Test empty parts
  assertThrows(
    () => endpoint.validateSymbol('-USD'),
    ValidationError,
    'Invalid symbol format: -USD. Expected format like "BTC-USD"',
  )

  assertThrows(
    () => endpoint.validateSymbol('BTC-'),
    ValidationError,
    'Invalid symbol format: BTC-. Expected format like "BTC-USD"',
  )
})

Deno.test('MarketDataEndpoint - validateSymbol accepts valid format', () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new MarketDataEndpoint(mockClient)

  // Should not throw
  endpoint.validateSymbol('BTC-USD')
  endpoint.validateSymbol('ETH-USDC')
  assertEquals(true, true) // Test passed if no exception thrown
})
