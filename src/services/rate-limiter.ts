/**
 * Token Bucket Rate Limiter Service
 * @module
 */

import type { RateLimitConfig } from '../types/mod.ts'
import { RateLimitError } from '../errors/mod.ts'

/**
 * Token bucket rate limiter
 */
export class TokenBucketRateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per millisecond
  private readonly windowMs: number

  constructor(config: RateLimitConfig) {
    this.maxTokens = config.burstCapacity ?? config.maxRequests ?? 100
    this.windowMs = config.windowMs ?? 60000 // 1 minute default
    this.refillRate = (config.maxRequests ?? 100) / this.windowMs
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
  }

  /**
   * Check if a request can be made (consumes a token if available)
   */
  async consume(tokens = 1): Promise<void> {
    this.refillTokens()

    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return
    }

    // Calculate how long to wait for tokens to be available
    const tokensNeeded = tokens - this.tokens
    const waitTime = Math.ceil(tokensNeeded / this.refillRate)

    throw new RateLimitError(
      `Rate limit exceeded. ${this.tokens} tokens available, ${tokens} required.`,
      waitTime,
    )
  }

  /**
   * Check if tokens are available without consuming them
   */
  canConsume(tokens = 1): boolean {
    this.refillTokens()
    return this.tokens >= tokens
  }

  /**
   * Get current token count
   */
  getTokenCount(): number {
    this.refillTokens()
    return this.tokens
  }

  /**
   * Get time until next token is available (in milliseconds)
   */
  getTimeUntilToken(): number {
    this.refillTokens()

    if (this.tokens >= 1) {
      return 0
    }

    return Math.ceil(1 / this.refillRate)
  }

  /**
   * Reset the bucket to full capacity
   */
  reset(): void {
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
  }

  /**
   * Get current bucket status
   */
  getStatus() {
    this.refillTokens()

    return {
      tokens: this.tokens,
      maxTokens: this.maxTokens,
      refillRate: this.refillRate,
      lastRefill: this.lastRefill,
      timeUntilToken: this.getTimeUntilToken(),
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill

    if (elapsed > 0) {
      const tokensToAdd = elapsed * this.refillRate
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
      this.lastRefill = now
    }
  }
}

/**
 * Rate limiter with automatic retry and backoff
 */
export class RateLimiterWithRetry {
  private readonly rateLimiter: TokenBucketRateLimiter
  private readonly maxRetries: number
  private readonly baseDelayMs: number

  constructor(
    config: RateLimitConfig,
    { maxRetries = 3, baseDelayMs = 1000 }: { maxRetries?: number; baseDelayMs?: number } = {},
  ) {
    this.rateLimiter = new TokenBucketRateLimiter(config)
    this.maxRetries = maxRetries
    this.baseDelayMs = baseDelayMs
  }

  /**
   * Execute a function with rate limiting and automatic retry
   */
  async execute<T>(fn: () => Promise<T>, tokens = 1): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        await this.rateLimiter.consume(tokens)
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (error instanceof RateLimitError) {
          if (attempt < this.maxRetries) {
            const delay = Math.min(
              error.retryAfter ?? this.baseDelayMs * Math.pow(2, attempt),
              30000, // Max 30 seconds
            )
            await this.sleep(delay)
            continue
          }
        } else {
          // Non-rate-limit error, don't retry
          throw error
        }
      }
    }

    throw lastError ?? new RateLimitError('Rate limit retry failed')
  }

  /**
   * Get current rate limiter status
   */
  getStatus() {
    return this.rateLimiter.getStatus()
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.rateLimiter.reset()
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

/**
 * Create a rate limiter from configuration
 */
export function createRateLimiter(config: RateLimitConfig): TokenBucketRateLimiter {
  return new TokenBucketRateLimiter(config)
}

/**
 * Create a rate limiter with retry capability
 */
export function createRateLimiterWithRetry(
  config: RateLimitConfig,
  retryConfig?: { maxRetries?: number; baseDelayMs?: number },
): RateLimiterWithRetry {
  return new RateLimiterWithRetry(config, retryConfig)
}
