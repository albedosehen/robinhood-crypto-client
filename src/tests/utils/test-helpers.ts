/**
 * Shared utility functions for the `tests/` directory.
 * @module
 */

import { restore, stub } from '@std/testing/mock'
import type { HttpResponse } from '../../client/httpClient.ts'
import type { CryptoClientConfig } from '../../types/mod.ts'

/**
 * Mock HTTP response factory
 */
export function createMockResponse<T = unknown>(
  data: T,
  options: {
    status?: number
    statusText?: string
    headers?: Record<string, string>
    url?: string
    requestId?: string
  } = {},
): HttpResponse<T> {
  const headers = new Headers()
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers.set(key, value)
    }
  }

  return {
    data,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers,
    url: options.url ?? 'https://trading.robinhood.com/test',
    requestId: options.requestId,
  }
}

/**
 * Test configuration factory
 */
export function createTestConfig(overrides: Partial<CryptoClientConfig> = {}): CryptoClientConfig {
  // Generate a proper 32-byte base64 key for Ed25519
  const secretKeyBytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(secretKeyBytes)
  const secretKey = uint8ArrayToBase64(secretKeyBytes)

  return {
    apiKey: 'rh-api-12345678-1234-1234-1234-123456789012',
    secretKey,
    baseUrl: 'https://trading.robinhood.com',
    timeout: 10000,
    debug: false,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000,
      burstCapacity: 300,
    },
    ...overrides,
  }
}

/**
 * Generate test Ed25519 key pair for testing
 */
export async function generateTestKeyPair(): Promise<
  { privateKey: CryptoKey; publicKey: CryptoKey; seed: Uint8Array }
> {
  // Generate a random 32-byte seed for Ed25519
  const seed = new Uint8Array(32)
  globalThis.crypto.getRandomValues(seed)

  // Import private key from seed
  const privateKey = await globalThis.crypto.subtle.importKey(
    'raw',
    seed,
    'Ed25519',
    false,
    ['sign'],
  )

  // Generate key pair to get public key
  const keyPair = await globalThis.crypto.subtle.generateKey(
    'Ed25519',
    true,
    ['sign', 'verify'],
  ) as CryptoKeyPair

  return {
    privateKey,
    publicKey: keyPair.publicKey,
    seed,
  }
}

/**
 * Convert Uint8Array to base64 string for testing
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binaryString = ''
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i])
  }
  return globalThis.btoa(binaryString)
}

/**
 * Create mock fetch function
 */
export function createMockFetch(responses: Array<{ url?: string; response: Response }>) {
  let callCount = 0

  return stub(globalThis, 'fetch', (input: string | URL | Request) => {
    const urlString = input.toString()

    // Find matching response or use default
    const mockConfig = responses.find((r) => !r.url || urlString.includes(r.url)) || responses[0]

    callCount++
    return Promise.resolve(mockConfig.response)
  })
}

/**
 * Create mock Response object
 */
export function createMockFetchResponse(
  data: unknown,
  options: {
    status?: number
    statusText?: string
    headers?: Record<string, string>
    url?: string
  } = {},
): Response {
  const headers = new Headers()
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers.set(key, value)
    }
  }

  const response = new Response(JSON.stringify(data), {
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers,
  })

  // Mock the url property
  Object.defineProperty(response, 'url', {
    value: options.url ?? 'https://trading.robinhood.com/test',
    writable: false,
  })

  return response
}

/**
 * Wait for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Assert that an error is thrown with expected properties
 */
export async function assertThrowsError<T extends Error>(
  fn: () => Promise<unknown> | unknown,
  ErrorClass: new (...args: unknown[]) => T,
  message?: string | RegExp,
): Promise<T> {
  let error: T | undefined

  try {
    const result = fn()
    if (result instanceof Promise) {
      await result
    }
  } catch (e) {
    if (e instanceof ErrorClass) {
      error = e
    } else {
      throw new Error(`Expected ${ErrorClass.name} but got ${e?.constructor.name}: ${e}`)
    }
  }

  if (!error) {
    throw new Error(`Expected ${ErrorClass.name} to be thrown`)
  }

  if (message) {
    if (typeof message === 'string') {
      if (!error.message.includes(message)) {
        throw new Error(`Expected error message to include "${message}" but got "${error.message}"`)
      }
    } else if (message instanceof RegExp) {
      if (!message.test(error.message)) {
        throw new Error(`Expected error message to match ${message} but got "${error.message}"`)
      }
    }
  }

  return error
}

/**
 * Cleanup mocks after tests
 */
export function cleanupMocks(): void {
  restore()
}

/**
 * Mock environment variables
 */
export function mockEnvVars(vars: Record<string, string>): () => void {
  const originalVars: Record<string, string | undefined> = {}

  // Store original values
  for (const key of Object.keys(vars)) {
    originalVars[key] = Deno.env.get(key)
  }

  // Set new values
  for (const [key, value] of Object.entries(vars)) {
    Deno.env.set(key, value)
  }

  // Return cleanup function
  return () => {
    for (const [key, originalValue] of Object.entries(originalVars)) {
      if (originalValue === undefined) {
        Deno.env.delete(key)
      } else {
        Deno.env.set(key, originalValue)
      }
    }
  }
}

/**
 * Create test timestamp
 */
export function createTestTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
