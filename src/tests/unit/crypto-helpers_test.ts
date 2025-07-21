/**
 * Unit tests for crypto helper functions
 */

import { assertEquals, assertThrows } from '@std/assert'
import {
  base64ToUint8Array,
  createSignatureMessage,
  getCurrentTimestamp,
  importEd25519PrivateKey,
  isTimestampValid,
  sanitizeErrorMessage,
  signMessage,
  uint8ArrayToBase64,
  validateApiKey,
} from '../../client/crypto-helpers.ts'
import { SignatureError } from '../../errors/mod.ts'
import { generateTestKeyPair, uint8ArrayToBase64 as testUint8ToBase64 } from '../utils/test-helpers.ts'

Deno.test('base64ToUint8Array - converts valid base64 string to Uint8Array', () => {
  const base64 = 'SGVsbG8gV29ybGQ=' // "Hello World"
  const result = base64ToUint8Array(base64)

  assertEquals(result.length, 11)
  assertEquals(new TextDecoder().decode(result), 'Hello World')
})

Deno.test('base64ToUint8Array - handles base64 with padding', () => {
  const base64 = 'SGVsbG8='
  const result = base64ToUint8Array(base64)

  assertEquals(new TextDecoder().decode(result), 'Hello')
})

Deno.test('base64ToUint8Array - removes whitespace', () => {
  const base64 = '  SGVs\nbG8g  V29y\tbGQ=  '
  const result = base64ToUint8Array(base64)

  assertEquals(new TextDecoder().decode(result), 'Hello World')
})

Deno.test('base64ToUint8Array - throws SignatureError for invalid format', () => {
  assertThrows(
    () => base64ToUint8Array('invalid@base64!'),
    SignatureError,
    'Failed to decode base64 string',
  )
})

Deno.test('uint8ArrayToBase64 - converts Uint8Array to base64 string', () => {
  const text = 'Hello World'
  const bytes = new TextEncoder().encode(text)
  const result = uint8ArrayToBase64(bytes)

  assertEquals(result, 'SGVsbG8gV29ybGQ=')
})

Deno.test('uint8ArrayToBase64 - handles empty array', () => {
  const result = uint8ArrayToBase64(new Uint8Array(0))
  assertEquals(result, '')
})

Deno.test.ignore('importEd25519PrivateKey - imports valid 32-byte Ed25519 key (DISABLED)', async () => {
  // Generate a valid 32-byte seed
  const seed = new Uint8Array(32)
  globalThis.crypto.getRandomValues(seed)
  const base64Seed = testUint8ToBase64(seed)

  const privateKey = await importEd25519PrivateKey(base64Seed)

  assertEquals(privateKey.type, 'private')
  assertEquals(privateKey.algorithm.name, 'Ed25519')
})

Deno.test('importEd25519PrivateKey - throws SignatureError for invalid seed length', async () => {
  const shortSeed = new Uint8Array(16) // Too short
  const base64Seed = testUint8ToBase64(shortSeed)

  try {
    await importEd25519PrivateKey(base64Seed)
    throw new Error('Expected SignatureError to be thrown')
  } catch (error) {
    assertEquals(error instanceof SignatureError, true)
    assertEquals((error as SignatureError).message.includes('Invalid Ed25519 seed length'), true)
  }
})

Deno.test('importEd25519PrivateKey - throws SignatureError for invalid base64', async () => {
  try {
    await importEd25519PrivateKey('invalid@base64!')
    throw new Error('Expected SignatureError to be thrown')
  } catch (error) {
    assertEquals(error instanceof SignatureError, true)
    assertEquals((error as SignatureError).message.includes('Failed to import Ed25519 private key'), true)
  }
})

Deno.test.ignore('signMessage - creates valid signature (DISABLED - Ed25519 issue)', async () => {
  const { privateKey } = await generateTestKeyPair()
  const message = 'test message'

  const signature = await signMessage(privateKey, message)

  // Should be base64 encoded signature
  assertEquals(typeof signature, 'string')
  assertEquals(signature.length > 0, true)

  // Should be valid base64
  const decoded = base64ToUint8Array(signature)
  assertEquals(decoded.length, 64) // Ed25519 signatures are 64 bytes
})

Deno.test.ignore(
  'signMessage - produces different signatures for different messages (DISABLED - Ed25519 issue)',
  async () => {
    const { privateKey } = await generateTestKeyPair()

    const signature1 = await signMessage(privateKey, 'message 1')
    const signature2 = await signMessage(privateKey, 'message 2')

    assertEquals(signature1 !== signature2, true)
  },
)

Deno.test('getCurrentTimestamp - returns valid Unix timestamp', () => {
  const timestamp = getCurrentTimestamp()
  const now = Math.floor(Date.now() / 1000)

  assertEquals(typeof timestamp, 'number')
  assertEquals(Math.abs(timestamp - now) <= 1, true) // Within 1 second
})

Deno.test('isTimestampValid - validates recent timestamps', () => {
  const now = getCurrentTimestamp()

  assertEquals(isTimestampValid(now), true)
  assertEquals(isTimestampValid(now - 10), true) // 10 seconds ago
  assertEquals(isTimestampValid(now - 30), true) // 30 seconds ago (default max)
})

Deno.test('isTimestampValid - rejects old timestamps', () => {
  const now = getCurrentTimestamp()

  assertEquals(isTimestampValid(now - 31), false) // 31 seconds ago
  assertEquals(isTimestampValid(now - 100), false) // 100 seconds ago
})

Deno.test('isTimestampValid - rejects future timestamps', () => {
  const now = getCurrentTimestamp()

  assertEquals(isTimestampValid(now + 10), false) // 10 seconds in future
})

Deno.test('isTimestampValid - respects custom max age', () => {
  const now = getCurrentTimestamp()

  assertEquals(isTimestampValid(now - 45, 60), true) // 45 seconds ago, max 60
  assertEquals(isTimestampValid(now - 45, 30), false) // 45 seconds ago, max 30
})

Deno.test('createSignatureMessage - creates correct message format', () => {
  const params = {
    apiKey: 'test-api-key',
    timestamp: 1640995200, // Jan 1, 2022
    path: '/api/v1/test',
    method: 'GET',
    body: '',
  }

  const message = createSignatureMessage(params)
  const expected = 'test-api-key1640995200/api/v1/testGET'

  assertEquals(message, expected)
})

Deno.test('createSignatureMessage - handles path without leading slash', () => {
  const params = {
    apiKey: 'test-api-key',
    timestamp: 1640995200,
    path: 'api/v1/test',
    method: 'GET',
    body: '',
  }

  const message = createSignatureMessage(params)
  const expected = 'test-api-key1640995200/api/v1/testGET'

  assertEquals(message, expected)
})

Deno.test('createSignatureMessage - includes request body', () => {
  const params = {
    apiKey: 'test-api-key',
    timestamp: 1640995200,
    path: '/api/v1/test',
    method: 'POST',
    body: '{"test":"value"}',
  }

  const message = createSignatureMessage(params)
  const expected = 'test-api-key1640995200/api/v1/testPOST{"test":"value"}'

  assertEquals(message, expected)
})

Deno.test('createSignatureMessage - normalizes method to uppercase', () => {
  const params = {
    apiKey: 'test-api-key',
    timestamp: 1640995200,
    path: '/api/v1/test',
    method: 'post',
    body: '',
  }

  const message = createSignatureMessage(params)
  const expected = 'test-api-key1640995200/api/v1/testPOST'

  assertEquals(message, expected)
})

Deno.test('createSignatureMessage - handles object body', () => {
  const params = {
    apiKey: 'test-api-key',
    timestamp: 1640995200,
    path: '/api/v1/test',
    method: 'POST',
    body: JSON.stringify({ test: 'value' }),
  }

  const message = createSignatureMessage(params)
  const expected = 'test-api-key1640995200/api/v1/testPOST{"test":"value"}'

  assertEquals(message, expected)
})

Deno.test('validateApiKey - accepts new format with rh-api prefix', () => {
  const validKey = 'rh-api-12345678-1234-1234-1234-123456789012'
  assertEquals(validateApiKey(validKey), true)
})

Deno.test('validateApiKey - accepts old UUID format', () => {
  const validKey = '12345678-1234-1234-1234-123456789012'
  assertEquals(validateApiKey(validKey), true)
})

Deno.test('validateApiKey - rejects invalid formats', () => {
  assertEquals(validateApiKey(''), false)
  assertEquals(validateApiKey('invalid-key'), false)
  assertEquals(validateApiKey('12345678-1234-1234-1234'), false) // Too short
  assertEquals(validateApiKey('not-a-uuid'), false)
  assertEquals(validateApiKey('rh-api-invalid'), false)
})

Deno.test('validateApiKey - rejects non-string input', () => {
  assertEquals(validateApiKey(null as unknown as string), false)
  assertEquals(validateApiKey(undefined as unknown as string), false)
  assertEquals(validateApiKey(123 as unknown as string), false)
})

Deno.test('sanitizeErrorMessage - masks sensitive data', () => {
  const message = 'Error with API key test-api-key-12345'
  const sensitiveData = ['test-api-key-12345']

  const sanitized = sanitizeErrorMessage(message, sensitiveData)

  assertEquals(sanitized, 'Error with API key te***45')
})

Deno.test('sanitizeErrorMessage - handles multiple sensitive values', () => {
  const message = 'Error: API key secret-123 and token abc-def-ghi'
  const sensitiveData = ['secret-123', 'abc-def-ghi']

  const sanitized = sanitizeErrorMessage(message, sensitiveData)

  assertEquals(sanitized, 'Error: API key se***23 and token ab***hi')
})

Deno.test('sanitizeErrorMessage - handles short sensitive values', () => {
  const message = 'Error with key abc'
  const sensitiveData = ['abc']

  const sanitized = sanitizeErrorMessage(message, sensitiveData)

  assertEquals(sanitized, 'Error with key ***')
})

Deno.test('sanitizeErrorMessage - ignores empty sensitive data', () => {
  const message = 'Error message'
  const sensitiveData = ['', '   ']

  const sanitized = sanitizeErrorMessage(message, sensitiveData)

  assertEquals(sanitized, 'Error message')
})

Deno.test.ignore('crypto helpers integration - full authentication flow (DISABLED - Ed25519 issue)', async () => {
  const { seed } = await generateTestKeyPair()
  const base64Seed = testUint8ToBase64(seed)

  const importedKey = await importEd25519PrivateKey(base64Seed)

  const params = {
    apiKey: 'rh-api-12345678-1234-1234-1234-123456789012',
    timestamp: getCurrentTimestamp(),
    path: '/api/v1/crypto/trading/accounts/',
    method: 'GET',
    body: '',
  }

  const message = createSignatureMessage(params)
  const signature = await signMessage(importedKey, message)

  assertEquals(validateApiKey(params.apiKey), true)
  assertEquals(isTimestampValid(params.timestamp), true)
  assertEquals(typeof signature, 'string')
  assertEquals(signature.length > 0, true)

  const decodedSig = base64ToUint8Array(signature)
  assertEquals(decodedSig.length, 64)
})
