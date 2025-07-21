// deno-lint-ignore-file default-param-last
/**
 * Error classes for the Robinhood Crypto Client
 * @module
 */

/**
 * Base error class for all Robinhood-related errors
 */
export abstract class RobinhoodError extends Error {
  public override readonly name: string
  public readonly timestamp: string

  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date().toISOString()

    // Ensure proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends RobinhoodError {
  constructor(message = 'Authentication failed', code?: string) {
    super(message, code)
  }
}

/**
 * Error thrown when rate limits are exceeded
 */
export class RateLimitError extends RobinhoodError {
  constructor(
    message = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    code?: string,
  ) {
    super(message, code)
  }
}

/**
 * Error thrown for validation issues
 */
export class ValidationError extends RobinhoodError {
  constructor(
    message: string,
    public readonly field?: string,
    code?: string,
  ) {
    super(message, code)
  }
}

/**
 * Error thrown for network-related issues
 */
export class NetworkError extends RobinhoodError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    code?: string,
  ) {
    super(message, code)
  }
}

/**
 * Error thrown for API-specific issues
 */
export class ApiError extends RobinhoodError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown,
    code?: string,
  ) {
    super(message, code)
  }
}

/**
 * Error thrown for configuration issues
 */
export class ConfigurationError extends RobinhoodError {
  constructor(message: string, code?: string) {
    super(message, code)
  }
}

/**
 * Error thrown for signature generation issues
 */
export class SignatureError extends RobinhoodError {
  constructor(message: string, code?: string) {
    super(message, code)
  }
}
