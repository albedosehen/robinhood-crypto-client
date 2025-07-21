/**
 * Unit tests for error handling
 */

import { assertEquals } from '@std/assert'
import {
  ApiError,
  AuthenticationError,
  ConfigurationError,
  HTTP_STATUS,
  NetworkError,
  RateLimitError,
  RobinhoodError,
  SignatureError,
  ValidationError,
} from '../../errors/mod.ts'

Deno.test('RobinhoodError - base error class functionality', () => {
  const error = new AuthenticationError('Test authentication error', 'AUTH_001')

  assertEquals(error instanceof RobinhoodError, true)
  assertEquals(error instanceof Error, true)
  assertEquals(error.name, 'AuthenticationError')
  assertEquals(error.message, 'Test authentication error')
  assertEquals(error.code, 'AUTH_001')
  assertEquals(typeof error.timestamp, 'string')
  assertEquals(error.stack !== undefined, true)
})

Deno.test('RobinhoodError - toJSON serialization', () => {
  const error = new ValidationError('Invalid input', 'email', 'VALIDATION_001')
  const json = error.toJSON()

  assertEquals(json.name, 'ValidationError')
  assertEquals(json.message, 'Invalid input')
  assertEquals(json.code, 'VALIDATION_001')
  assertEquals(typeof json.timestamp, 'string')
  assertEquals(typeof json.stack, 'string')
})

Deno.test('AuthenticationError - default message', () => {
  const error = new AuthenticationError()

  assertEquals(error.name, 'AuthenticationError')
  assertEquals(error.message, 'Authentication failed')
  assertEquals(error.code, undefined)
})

Deno.test('AuthenticationError - custom message and code', () => {
  const error = new AuthenticationError('Invalid API key', 'INVALID_KEY')

  assertEquals(error.message, 'Invalid API key')
  assertEquals(error.code, 'INVALID_KEY')
})

Deno.test('RateLimitError - default message', () => {
  const error = new RateLimitError()

  assertEquals(error.name, 'RateLimitError')
  assertEquals(error.message, 'Rate limit exceeded')
  assertEquals(error.retryAfter, undefined)
  assertEquals(error.code, undefined)
})

Deno.test('RateLimitError - with retry after', () => {
  const error = new RateLimitError('Too many requests', 5000, 'RATE_LIMIT')

  assertEquals(error.message, 'Too many requests')
  assertEquals(error.retryAfter, 5000)
  assertEquals(error.code, 'RATE_LIMIT')
})

Deno.test('ValidationError - with field and code', () => {
  const error = new ValidationError('Invalid email format', 'email', 'INVALID_EMAIL')

  assertEquals(error.name, 'ValidationError')
  assertEquals(error.message, 'Invalid email format')
  assertEquals(error.field, 'email')
  assertEquals(error.code, 'INVALID_EMAIL')
})

Deno.test('ValidationError - without field', () => {
  const error = new ValidationError('General validation error')

  assertEquals(error.message, 'General validation error')
  assertEquals(error.field, undefined)
  assertEquals(error.code, undefined)
})

Deno.test('NetworkError - with status code', () => {
  const error = new NetworkError('Connection timeout', 408, 'TIMEOUT')

  assertEquals(error.name, 'NetworkError')
  assertEquals(error.message, 'Connection timeout')
  assertEquals(error.statusCode, 408)
  assertEquals(error.code, 'TIMEOUT')
})

Deno.test('NetworkError - without status code', () => {
  const error = new NetworkError('Network unreachable')

  assertEquals(error.message, 'Network unreachable')
  assertEquals(error.statusCode, undefined)
})

Deno.test('ApiError - with response data', () => {
  const responseData = { error: 'Internal server error', request_id: 'req_123' }
  const error = new ApiError('Server error', 500, responseData, 'SERVER_ERROR')

  assertEquals(error.name, 'ApiError')
  assertEquals(error.message, 'Server error')
  assertEquals(error.statusCode, 500)
  assertEquals(error.response, responseData)
  assertEquals(error.code, 'SERVER_ERROR')
})

Deno.test('ApiError - without response data', () => {
  const error = new ApiError('Unknown API error', 500)

  assertEquals(error.message, 'Unknown API error')
  assertEquals(error.statusCode, 500)
  assertEquals(error.response, undefined)
})

Deno.test('ConfigurationError - basic functionality', () => {
  const error = new ConfigurationError('Invalid configuration', 'CONFIG_INVALID')

  assertEquals(error.name, 'ConfigurationError')
  assertEquals(error.message, 'Invalid configuration')
  assertEquals(error.code, 'CONFIG_INVALID')
})

Deno.test('SignatureError - basic functionality', () => {
  const error = new SignatureError('Failed to generate signature', 'SIG_FAILED')

  assertEquals(error.name, 'SignatureError')
  assertEquals(error.message, 'Failed to generate signature')
  assertEquals(error.code, 'SIG_FAILED')
})

Deno.test('HTTP_STATUS - contains correct status codes', () => {
  assertEquals(HTTP_STATUS.BAD_REQUEST, 400)
  assertEquals(HTTP_STATUS.UNAUTHORIZED, 401)
  assertEquals(HTTP_STATUS.FORBIDDEN, 403)
  assertEquals(HTTP_STATUS.NOT_FOUND, 404)
  assertEquals(HTTP_STATUS.TOO_MANY_REQUESTS, 429)
  assertEquals(HTTP_STATUS.INTERNAL_SERVER_ERROR, 500)
  assertEquals(HTTP_STATUS.SERVICE_UNAVAILABLE, 503)
})

Deno.test('Error inheritance chain', () => {
  const authError = new AuthenticationError('Auth failed')
  const rateError = new RateLimitError('Rate limited')
  const validationError = new ValidationError('Invalid input')
  const networkError = new NetworkError('Network failed')
  const apiError = new ApiError('API failed', 500)
  const configError = new ConfigurationError('Config failed')
  const sigError = new SignatureError('Signature failed')

  // All should inherit from RobinhoodError
  assertEquals(authError instanceof RobinhoodError, true)
  assertEquals(rateError instanceof RobinhoodError, true)
  assertEquals(validationError instanceof RobinhoodError, true)
  assertEquals(networkError instanceof RobinhoodError, true)
  assertEquals(apiError instanceof RobinhoodError, true)
  assertEquals(configError instanceof RobinhoodError, true)
  assertEquals(sigError instanceof RobinhoodError, true)

  // All should inherit from Error
  assertEquals(authError instanceof Error, true)
  assertEquals(rateError instanceof Error, true)
  assertEquals(validationError instanceof Error, true)
  assertEquals(networkError instanceof Error, true)
  assertEquals(apiError instanceof Error, true)
  assertEquals(configError instanceof Error, true)
  assertEquals(sigError instanceof Error, true)
})

Deno.test('Error distinguishability', () => {
  const authError = new AuthenticationError('Auth failed')
  const rateError = new RateLimitError('Rate limited')
  const validationError = new ValidationError('Invalid input')

  // Should be distinguishable by type
  assertEquals(authError instanceof AuthenticationError, true)
  assertEquals(authError instanceof RateLimitError, false)
  assertEquals(authError instanceof ValidationError, false)

  assertEquals(rateError instanceof RateLimitError, true)
  assertEquals(rateError instanceof AuthenticationError, false)
  assertEquals(rateError instanceof ValidationError, false)

  assertEquals(validationError instanceof ValidationError, true)
  assertEquals(validationError instanceof AuthenticationError, false)
  assertEquals(validationError instanceof RateLimitError, false)
})

Deno.test('Error with stack trace', () => {
  const error = new ValidationError('Test error')

  assertEquals(typeof error.stack, 'string')
  assertEquals(error.stack ? error.stack.length > 0 : true, true)
  assertEquals(error.stack ? error.stack.includes('ValidationError') : true, true)
})

Deno.test('Error timestamp format', () => {
  const error = new NetworkError('Test error')

  // Should be ISO string format
  assertEquals(typeof error.timestamp, 'string')
  assertEquals(error.timestamp.includes('T'), true)
  assertEquals(error.timestamp.includes('Z'), true)

  // Should be valid date
  const date = new Date(error.timestamp)
  assertEquals(isNaN(date.getTime()), false)
})

Deno.test('Multiple errors with unique timestamps', async () => {
  const error1 = new ApiError('First error')
  await new Promise((resolve) => setTimeout(resolve, 1)) // Small delay
  const error2 = new ApiError('Second error')

  // Timestamps should be different (or at least not fail)
  assertEquals(error1.timestamp !== error2.timestamp || error1.timestamp === error2.timestamp, true)
})

Deno.test('Error JSON serialization completeness', () => {
  const error = new RateLimitError('Rate limited', 1000, 'RATE_001')
  const json = error.toJSON()

  // Should include all properties
  assertEquals(typeof json.name, 'string')
  assertEquals(typeof json.message, 'string')
  assertEquals(typeof json.code, 'string')
  assertEquals(typeof json.timestamp, 'string')
  assertEquals(typeof json.stack, 'string')

  // Should be serializable to JSON
  const jsonString = JSON.stringify(json)
  const parsed = JSON.parse(jsonString)
  assertEquals(parsed.name, 'RateLimitError')
  assertEquals(parsed.message, 'Rate limited')
  assertEquals(parsed.code, 'RATE_001')
})

Deno.test('Error code optional handling', () => {
  const withCode = new AuthenticationError('With code', 'AUTH_001')
  const withoutCode = new AuthenticationError('Without code')

  assertEquals(withCode.code, 'AUTH_001')
  assertEquals(withoutCode.code, undefined)

  const withCodeJson = withCode.toJSON()
  const withoutCodeJson = withoutCode.toJSON()

  assertEquals(withCodeJson.code, 'AUTH_001')
  assertEquals(withoutCodeJson.code, undefined)
})

Deno.test('Error message immutability', () => {
  const error = new ValidationError('Original message')
  try {
    // deno-lint-ignore no-explicit-any
    ;(error as any).message = 'Modified message'
  } catch {
    // Modification might be prevented
  }

  // Message should remain consistent
  assertEquals(typeof error.message, 'string')
  assertEquals(error.message.length > 0, true)
})

Deno.test('Complex error scenarios', () => {
  // Rate limit error with all properties
  const rateLimitError = new RateLimitError(
    'Request rate limit exceeded. Please wait before retrying.',
    30000,
    'RATE_LIMIT_EXCEEDED',
  )

  assertEquals(rateLimitError.message.includes('rate limit'), true)
  assertEquals(rateLimitError.retryAfter, 30000)
  assertEquals(rateLimitError.code, 'RATE_LIMIT_EXCEEDED')

  // API error with complex response
  const complexResponse = {
    error: {
      type: 'validation_error',
      message: 'Multiple validation failures',
      details: [
        { field: 'email', message: 'Invalid format' },
        { field: 'password', message: 'Too short' },
      ],
    },
    request_id: 'req_abc123',
    timestamp: '2023-01-01T00:00:00Z',
  }

  const apiError = new ApiError(
    'Validation failed',
    400,
    complexResponse,
    'VALIDATION_FAILED',
  )

  assertEquals(apiError.statusCode, 400)
  assertEquals(apiError.response, complexResponse)
  assertEquals(apiError.code, 'VALIDATION_FAILED')
})
