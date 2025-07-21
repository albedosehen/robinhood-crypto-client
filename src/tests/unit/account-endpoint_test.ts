/**
 * Account Endpoint Unit Tests
 * Tests account-related API functionality and business logic
 */

import { assertEquals } from '@std/assert'
import { stub } from '@std/testing/mock'
import { AccountEndpoint } from '../../endpoints/account/account-endpoint.ts'
import type { HttpClient, HttpResponse } from '../../client/httpClient.ts'
import { mockAccountDetails } from '../fixtures/api-responses.ts'

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

Deno.test('AccountEndpoint - initializes correctly', () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  assertEquals(typeof endpoint, 'object')
  assertEquals(typeof endpoint.getAccountDetails, 'function')
  assertEquals(typeof endpoint.getAccountSummary, 'function')
  assertEquals(typeof endpoint.getAccountBalance, 'function')
})

Deno.test('AccountEndpoint - getAccountDetails returns account data', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockAccountDetails,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/accounts/',
    }))

  try {
    const result = await endpoint.getAccountDetails()

    assertEquals(result, mockAccountDetails)
    assertEquals(getStub.calls.length, 1)
    assertEquals(getStub.calls[0].args[0], '/api/v1/crypto/trading/accounts/')
  } finally {
    getStub.restore()
  }
})

Deno.test('AccountEndpoint - getAccountSummary includes account and timestamp', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockAccountDetails,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/accounts/',
    }))

  try {
    const result = await endpoint.getAccountSummary()

    assertEquals(result.account, mockAccountDetails)
    assertEquals(typeof result.updated_at, 'string')
    // Verify it's a valid ISO date string
    assertEquals(new Date(result.updated_at).toString() !== 'Invalid Date', true)
  } finally {
    getStub.restore()
  }
})

Deno.test('AccountEndpoint - getAccountBalance calculates from buying power', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockAccountDetails,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/accounts/',
    }))

  try {
    const result = await endpoint.getAccountBalance()

    assertEquals(result.total_value, mockAccountDetails.buying_power)
    assertEquals(result.cash_balance, mockAccountDetails.buying_power)
    assertEquals(result.crypto_value, '0.00')
    assertEquals(result.currency, mockAccountDetails.buying_power_currency)
    assertEquals(typeof result.updated_at, 'string')
  } finally {
    getStub.restore()
  }
})

Deno.test('AccountEndpoint - getAccountPermissions derives from account status', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const activeAccount = { ...mockAccountDetails, status: 'active' }
  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: activeAccount,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/accounts/',
    }))

  try {
    const result = await endpoint.getAccountPermissions()

    assertEquals(result.trading_enabled, true)
    assertEquals(result.market_data_enabled, true)
    assertEquals(result.account_access_enabled, true)
    assertEquals(result.limits?.max_order_value, undefined)
    assertEquals(result.limits?.max_daily_volume, undefined)
  } finally {
    getStub.restore()
  }
})

Deno.test('AccountEndpoint - getAccountPermissions trading disabled for inactive account', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const inactiveAccount = { ...mockAccountDetails, status: 'inactive' }
  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: inactiveAccount,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/accounts/',
    }))

  try {
    const result = await endpoint.getAccountPermissions()

    assertEquals(result.trading_enabled, false)
    assertEquals(result.market_data_enabled, true)
    assertEquals(result.account_access_enabled, true)
  } finally {
    getStub.restore()
  }
})

Deno.test('AccountEndpoint - getAccountActivity returns empty results', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const result = await endpoint.getAccountActivity()

  assertEquals(result.results, [])
  assertEquals(result.next, undefined)
  assertEquals(result.previous, undefined)
})

Deno.test('AccountEndpoint - getAllAccountActivity uses getAllPages', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  // Mock the getAllPages method (inherited from BaseEndpoint)
  // deno-lint-ignore no-explicit-any
  const getAllPagesStub = stub(endpoint, 'getAllPages' as any, () => Promise.resolve([]))

  try {
    const result = await endpoint.getAllAccountActivity()

    assertEquals(result, [])
    assertEquals(getAllPagesStub.calls.length, 1)
    assertEquals(getAllPagesStub.calls[0].args[0], '/api/v1/crypto/trading/activity/')
  } finally {
    getAllPagesStub.restore()
  }
})

Deno.test('AccountEndpoint - isAccountActive returns true for active account', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const activeAccount = { ...mockAccountDetails, status: 'active' }
  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: activeAccount,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/accounts/',
    }))

  try {
    const result = await endpoint.isAccountActive()
    assertEquals(result, true)
  } finally {
    getStub.restore()
  }
})

Deno.test('AccountEndpoint - isAccountActive returns false for inactive account', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const inactiveAccount = { ...mockAccountDetails, status: 'pending' }
  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: inactiveAccount,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/accounts/',
    }))

  try {
    const result = await endpoint.isAccountActive()
    assertEquals(result, false)
  } finally {
    getStub.restore()
  }
})

Deno.test('AccountEndpoint - isAccountActive returns false on error', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () => Promise.reject(new Error('API Error')))

  try {
    const result = await endpoint.isAccountActive()
    assertEquals(result, false)
  } finally {
    getStub.restore()
  }
})

Deno.test('AccountEndpoint - getAccountStatus returns account status', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockAccountDetails,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/accounts/',
    }))

  try {
    const result = await endpoint.getAccountStatus()
    assertEquals(result, mockAccountDetails.status)
  } finally {
    getStub.restore()
  }
})

Deno.test('AccountEndpoint - getBuyingPower returns buying power details', async () => {
  const mockClient = new MockHttpClient() as unknown as HttpClient
  const endpoint = new AccountEndpoint(mockClient)

  const getStub = stub(mockClient, 'get', () =>
    Promise.resolve({
      data: mockAccountDetails,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: 'https://trading.robinhood.com/api/v1/crypto/trading/accounts/',
    }))

  try {
    const result = await endpoint.getBuyingPower()

    assertEquals(result.amount, mockAccountDetails.buying_power)
    assertEquals(result.currency, mockAccountDetails.buying_power_currency)
  } finally {
    getStub.restore()
  }
})
