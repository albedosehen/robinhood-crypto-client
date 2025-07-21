/**
 * Unit tests for rate limiter functionality
 */

import { assertEquals } from '@std/assert'
import {
  createRateLimiter,
  createRateLimiterWithRetry,
  RateLimiterWithRetry,
  TokenBucketRateLimiter,
} from '../../services/rate-limiter.ts'
import { RateLimitError } from '../../errors/mod.ts'
import { sleep } from '../utils/test-helpers.ts'

Deno.test('TokenBucketRateLimiter - initializes with correct defaults', () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 100,
    windowMs: 60000,
  })

  const status = rateLimiter.getStatus()
  assertEquals(status.maxTokens, 100)
  assertEquals(status.tokens, 100)
  assertEquals(status.refillRate, 100 / 60000)
})

Deno.test('TokenBucketRateLimiter - initializes with burst capacity', () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 100,
    windowMs: 60000,
    burstCapacity: 200,
  })

  const status = rateLimiter.getStatus()
  assertEquals(status.maxTokens, 200)
  assertEquals(status.tokens, 200)
})

Deno.test('TokenBucketRateLimiter - consume reduces token count', async () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 100,
    windowMs: 60000,
  })

  const initialTokens = rateLimiter.getTokenCount()
  await rateLimiter.consume(1)
  const afterTokens = rateLimiter.getTokenCount()

  assertEquals(afterTokens, initialTokens - 1)
})

Deno.test('TokenBucketRateLimiter - consume multiple tokens', async () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 100,
    windowMs: 60000,
  })

  const initialTokens = rateLimiter.getTokenCount()
  await rateLimiter.consume(5)
  const afterTokens = rateLimiter.getTokenCount()

  assertEquals(afterTokens, initialTokens - 5)
})

Deno.test('TokenBucketRateLimiter - throws RateLimitError when tokens exhausted', async () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 2,
    windowMs: 60000,
  })

  // Consume all tokens
  await rateLimiter.consume(2)

  // Next consume should throw
  try {
    await rateLimiter.consume(1)
    throw new Error('Expected RateLimitError to be thrown')
  } catch (error) {
    assertEquals(error instanceof RateLimitError, true)
    assertEquals((error as RateLimitError).message.includes('Rate limit exceeded'), true)
  }
})

Deno.test('TokenBucketRateLimiter - canConsume checks without consuming', async () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 3,
    windowMs: 60000,
  })

  assertEquals(rateLimiter.canConsume(3), true)
  assertEquals(rateLimiter.canConsume(4), false)

  // Should not have consumed any tokens
  assertEquals(rateLimiter.getTokenCount(), 3)
})

Deno.test('TokenBucketRateLimiter - refills tokens over time', async () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 10,
    windowMs: 1000, // 1 second for faster testing
  })

  // Consume all tokens
  await rateLimiter.consume(10)
  assertEquals(rateLimiter.getTokenCount(), 0)

  // Wait for some refill
  await sleep(200) // 200ms should add ~2 tokens

  const tokensAfterWait = rateLimiter.getTokenCount()
  assertEquals(tokensAfterWait > 0, true)
  assertEquals(tokensAfterWait < 10, true)
})

Deno.test('TokenBucketRateLimiter - reset restores full capacity', async () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 10,
    windowMs: 60000,
  })

  // Consume some tokens
  await rateLimiter.consume(5)
  assertEquals(rateLimiter.getTokenCount(), 5)

  // Reset
  rateLimiter.reset()
  assertEquals(rateLimiter.getTokenCount(), 10)
})

Deno.test('TokenBucketRateLimiter - getTimeUntilToken returns correct wait time', () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 10,
    windowMs: 1000,
  })

  // When tokens are available
  assertEquals(rateLimiter.getTimeUntilToken(), 0)

  // When no tokens available
  rateLimiter.getStatus() // Force token count update
  while (rateLimiter.canConsume(1)) {
    rateLimiter.consume(1)
  }

  const waitTime = rateLimiter.getTimeUntilToken()
  assertEquals(waitTime > 0, true)
  assertEquals(waitTime <= 100, true) // Should be ~100ms for 1 token
})

Deno.test('RateLimiterWithRetry - executes function when tokens available', async () => {
  const rateLimiter = new RateLimiterWithRetry({
    maxRequests: 10,
    windowMs: 60000,
  })

  let executed = false
  const result = await rateLimiter.execute(async () => {
    executed = true
    return 'success'
  })

  assertEquals(executed, true)
  assertEquals(result, 'success')
})

Deno.test('RateLimiterWithRetry - retries on rate limit error', async () => {
  const rateLimiter = new RateLimiterWithRetry({
    maxRequests: 1,
    windowMs: 1000, // 1 second
  }, {
    maxRetries: 2,
    baseDelayMs: 100,
  })

  let callCount = 0

  // First call consumes the only token
  await rateLimiter.execute(async () => {
    callCount++
    return 'first'
  })

  // Second call should trigger retry
  const result = await rateLimiter.execute(async () => {
    callCount++
    return 'second'
  })

  assertEquals(callCount, 2)
  assertEquals(result, 'second')
})

Deno.test('RateLimiterWithRetry - throws after max retries exceeded', async () => {
  const rateLimiter = new RateLimiterWithRetry({
    maxRequests: 1,
    windowMs: 60000, // Long window to prevent refill
  }, {
    maxRetries: 1,
    baseDelayMs: 10,
  })

  // Consume the only token
  await rateLimiter.execute(async () => 'first')

  // Second call should exhaust retries
  try {
    await rateLimiter.execute(async () => 'second')
    throw new Error('Expected RateLimitError to be thrown')
  } catch (error) {
    assertEquals(error instanceof RateLimitError, true)
  }
})

Deno.test('RateLimiterWithRetry - does not retry non-rate-limit errors', async () => {
  const rateLimiter = new RateLimiterWithRetry({
    maxRequests: 10,
    windowMs: 60000,
  })

  let callCount = 0

  try {
    await rateLimiter.execute(async () => {
      callCount++
      throw new Error('Non-rate-limit error')
    })
    throw new Error('Expected Error to be thrown')
  } catch (error) {
    assertEquals((error as Error).message, 'Non-rate-limit error')
    assertEquals(callCount, 1) // Should not retry
  }
})

Deno.test('RateLimiterWithRetry - exponential backoff on retries', async () => {
  const rateLimiter = new RateLimiterWithRetry({
    maxRequests: 1,
    windowMs: 1000,
  }, {
    maxRetries: 2,
    baseDelayMs: 50,
  })

  // Consume token
  await rateLimiter.execute(async () => 'first')

  const startTime = Date.now()
  await rateLimiter.execute(async () => 'second')
  const endTime = Date.now()

  // Should have waited for retry
  const totalTime = endTime - startTime
  assertEquals(totalTime >= 50, true) // At least base delay
})

Deno.test('RateLimiterWithRetry - getStatus returns underlying status', () => {
  const rateLimiter = new RateLimiterWithRetry({
    maxRequests: 100,
    windowMs: 60000,
  })

  const status = rateLimiter.getStatus()
  assertEquals(status.maxTokens, 100)
  assertEquals(status.tokens, 100)
})

Deno.test('RateLimiterWithRetry - reset resets underlying limiter', async () => {
  const rateLimiter = new RateLimiterWithRetry({
    maxRequests: 5,
    windowMs: 60000,
  })

  // Consume some tokens
  await rateLimiter.execute(async () => 'test', 3)
  assertEquals(rateLimiter.getStatus().tokens, 2)

  // Reset
  rateLimiter.reset()
  assertEquals(rateLimiter.getStatus().tokens, 5)
})

Deno.test('createRateLimiter - factory creates TokenBucketRateLimiter', () => {
  const rateLimiter = createRateLimiter({
    maxRequests: 50,
    windowMs: 30000,
  })

  assertEquals(rateLimiter instanceof TokenBucketRateLimiter, true)
  assertEquals(rateLimiter.getStatus().maxTokens, 50)
})

Deno.test('createRateLimiterWithRetry - factory creates RateLimiterWithRetry', () => {
  const rateLimiter = createRateLimiterWithRetry({
    maxRequests: 50,
    windowMs: 30000,
  }, {
    maxRetries: 3,
    baseDelayMs: 500,
  })

  assertEquals(rateLimiter instanceof RateLimiterWithRetry, true)
  assertEquals(rateLimiter.getStatus().maxTokens, 50)
})

Deno.test('TokenBucketRateLimiter - handles zero window gracefully', () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 100,
    windowMs: 0,
  })

  // Should not crash and should allow consumption
  assertEquals(rateLimiter.canConsume(1), true)
})

Deno.test('TokenBucketRateLimiter - handles very high rates', async () => {
  const rateLimiter = new TokenBucketRateLimiter({
    maxRequests: 1000,
    windowMs: 1000,
    burstCapacity: 1000,
  })

  const initialTokens = rateLimiter.getTokenCount()
  assertEquals(initialTokens, 1000)

  // Should be able to consume many tokens quickly
  for (let i = 0; i < 100; i++) {
    await rateLimiter.consume(1)
  }

  const finalTokens = rateLimiter.getTokenCount()
  // Allow for small refill during execution (should be close to 900, but could be slightly higher due to refill)
  assertEquals(
    finalTokens >= 890 && finalTokens <= 910,
    true,
    `Expected tokens to be between 890-910, got ${finalTokens}`,
  )
})

Deno.test('Rate limiter integration - realistic usage scenario', async () => {
  const rateLimiter = createRateLimiterWithRetry({
    maxRequests: 5,
    windowMs: 1000,
    burstCapacity: 10,
  }, {
    maxRetries: 2,
    baseDelayMs: 100,
  })

  const results: string[] = []

  // Execute multiple operations
  for (let i = 0; i < 3; i++) {
    const result = await rateLimiter.execute(async () => {
      return `operation-${i}`
    })
    results.push(result)
  }

  assertEquals(results.length, 3)
  assertEquals(results[0], 'operation-0')
  assertEquals(results[1], 'operation-1')
  assertEquals(results[2], 'operation-2')

  // Should have consumed 3 tokens (allow for small floating point precision)
  const status = rateLimiter.getStatus()
  assertEquals(Math.floor(status.tokens), 7) // 10 - 3 (rounded down)
})
