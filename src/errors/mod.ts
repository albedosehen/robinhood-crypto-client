/**
 * Error module exports for Robinhood Crypto Client
 * @module
 */

export {
  ApiError,
  AuthenticationError,
  ConfigurationError,
  NetworkError,
  RateLimitError,
  RobinhoodError,
  SignatureError,
  ValidationError,
} from './error.ts'
export {
  type ApiErrorDetail,
  type ApiErrorResponse,
  type ErrorCategory,
  type ErrorContext,
  type ErrorSeverity,
  HTTP_STATUS,
  type RetryConfig,
} from './error.types.ts'
