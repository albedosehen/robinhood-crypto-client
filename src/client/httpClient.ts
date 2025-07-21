/**
 * HTTP client for Robinhood Crypto API with authentication, rate limiting, and error handling
 * @module
 */

import type { CryptoClientConfig, RequestHeaders, RequestOptions } from '../types/mod.ts'
import type { ApiErrorResponse, ErrorContext } from '../errors/mod.ts'
import {
  ApiError,
  AuthenticationError,
  HTTP_STATUS,
  NetworkError,
  RateLimitError,
  ValidationError,
} from '../errors/mod.ts'
import {
  createSignatureMessage,
  getCurrentTimestamp,
  importEd25519PrivateKey,
  sanitizeErrorMessage,
  signMessage,
} from './crypto-helpers.ts'
import { createRateLimiterWithRetry } from '../services/mod.ts'

/**
 * HTTP response with enhanced metadata
 */
export interface HttpResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
  url: string
  requestId?: string
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (options: RequestOptions) => RequestOptions | Promise<RequestOptions>

/**
 * Response interceptor function type
 */
export type ResponseInterceptor = <T>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  baseUrl: string
  timeout: number
  debug?: boolean
  maxRetries?: number
  retryDelayMs?: number
}

/**
 * HTTP client for Robinhood Crypto API
 */
export class HttpClient {
  private readonly config: HttpClientConfig
  private readonly privateKey: Promise<CryptoKey>
  private readonly apiKey: string
  private readonly rateLimiter: ReturnType<typeof createRateLimiterWithRetry>
  private readonly requestInterceptors: RequestInterceptor[] = []
  private readonly responseInterceptors: ResponseInterceptor[] = []

  constructor(clientConfig: CryptoClientConfig) {
    this.config = {
      baseUrl: clientConfig.baseUrl!,
      timeout: clientConfig.timeout!,
      debug: clientConfig.debug,
      maxRetries: 3,
      retryDelayMs: 1000,
    }

    this.apiKey = clientConfig.apiKey
    this.privateKey = importEd25519PrivateKey(clientConfig.secretKey)

    this.rateLimiter = createRateLimiterWithRetry(
      clientConfig.rateLimit!,
      {
        maxRetries: this.config.maxRetries,
        baseDelayMs: this.config.retryDelayMs,
      },
    )

    if (this.config.debug) {
      this.addRequestInterceptor(this.debugRequestInterceptor.bind(this))
      this.addResponseInterceptor(this.debugResponseInterceptor.bind(this))
    }
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  /**
   * Make HTTP request with authentication and rate limiting
   */
  async request<T = unknown>(options: RequestOptions): Promise<HttpResponse<T>> {
    return this.rateLimiter.execute(async () => {
      let processedOptions = { ...options }

      // Apply request interceptors
      for (const interceptor of this.requestInterceptors) {
        processedOptions = await interceptor(processedOptions)
      }

      // Create authenticated request
      const authHeaders = await this.createAuthHeaders(processedOptions)
      const url = this.buildUrl(processedOptions.path)

      const requestInit: RequestInit = {
        method: processedOptions.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...processedOptions.headers,
          ...authHeaders,
        },
        signal: AbortSignal.timeout(processedOptions.timeout ?? this.config.timeout),
      }

      if (processedOptions.body && processedOptions.method !== 'GET') {
        requestInit.body = typeof processedOptions.body === 'string'
          ? processedOptions.body
          : JSON.stringify(processedOptions.body)
      }

      const context: ErrorContext = {
        method: processedOptions.method,
        url,
        headers: processedOptions.headers,
        body: processedOptions.body,
        timestamp: new Date().toISOString(),
      }

      try {
        const response = await fetch(url, requestInit)
        let httpResponse = await this.processResponse<T>(response, context)

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          httpResponse = await interceptor(httpResponse)
        }

        return httpResponse
      } catch (error) {
        throw this.handleRequestError(error, context)
      }
    })
  }

  /**
   * GET request
   */
  async get<T = unknown>(path: string, options: Partial<RequestOptions> = {}): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'GET',
      path,
      ...options,
    })
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options: Partial<RequestOptions> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'POST',
      path,
      body,
      ...options,
    })
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options: Partial<RequestOptions> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      path,
      body,
      ...options,
    })
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(path: string, options: Partial<RequestOptions> = {}): Promise<HttpResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      path,
      ...options,
    })
  }

  /**
   * Get rate limiter status
   */
  getRateLimiterStatus() {
    return this.rateLimiter.getStatus()
  }

  /**
   * Reset rate limiter
   */
  resetRateLimiter(): void {
    this.rateLimiter.reset()
  }

  /**
   * Create authentication headers for request
   */
  private async createAuthHeaders(options: RequestOptions): Promise<RequestHeaders> {
    const timestamp = getCurrentTimestamp()
    const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : ''

    const message = createSignatureMessage({
      apiKey: this.apiKey,
      timestamp,
      path: options.path,
      method: options.method,
      body,
    })

    const privateKey = await this.privateKey
    const signature = await signMessage(privateKey, message)

    return {
      'x-api-key': this.apiKey,
      'x-signature': signature,
      'x-timestamp': timestamp.toString(),
    }
  }

  /**
   * Build full URL from path
   */
  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${this.config.baseUrl}${normalizedPath}`
  }

  /**
   * Process HTTP response and handle errors
   */
  private async processResponse<T>(response: Response, context: ErrorContext): Promise<HttpResponse<T>> {
    const requestId = response.headers.get('x-request-id') || undefined

    context.requestId = requestId

    if (!response.ok) {
      await this.handleErrorResponse(response, context)
    }

    let data: T
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text() as T
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.url,
      requestId,
    }
  }

  /**
   * Handle HTTP error responses
   */
  private async handleErrorResponse(response: Response, _context: ErrorContext): Promise<never> {
    let errorBody: unknown

    try {
      const contentType = response.headers.get('content-type') || ''
      errorBody = contentType.includes('application/json') ? await response.json() : await response.text()
    } catch {
      errorBody = null
    }

    const baseMessage = `HTTP ${response.status}: ${response.statusText}`

    switch (response.status) {
      case HTTP_STATUS.BAD_REQUEST:
        if (this.isApiErrorResponse(errorBody)) {
          const details = errorBody.errors.map((e) => e.detail).join('; ')
          throw new ValidationError(`${baseMessage} - ${details}`, undefined, errorBody.type)
        }
        throw new ValidationError(baseMessage)

      case HTTP_STATUS.UNAUTHORIZED:
        throw new AuthenticationError(`${baseMessage} - Invalid API credentials`)

      case HTTP_STATUS.FORBIDDEN:
        throw new AuthenticationError(`${baseMessage} - Access forbidden`)

      // deno-lint-ignore no-case-declarations
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        const retryAfter = response.headers.get('retry-after')
        const retryMs = retryAfter ? parseInt(retryAfter) * 1000 : undefined
        throw new RateLimitError(baseMessage, retryMs)

      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        throw new ApiError(baseMessage, response.status, errorBody)

      default:
        if (response.status >= 400 && response.status < 500) {
          throw new ValidationError(baseMessage)
        } else if (response.status >= 500) {
          throw new ApiError(baseMessage, response.status, errorBody)
        }
        throw new NetworkError(baseMessage, response.status)
    }
  }

  /**
   * Handle request errors (network, timeout, etc.)
   */
  private handleRequestError(error: unknown, _context: ErrorContext): Error {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new NetworkError('Network request failed - check internet connection')
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return new NetworkError(`Request timeout after ${this.config.timeout}ms`)
    }

    if (error instanceof Error) {
      const sanitizedMessage = sanitizeErrorMessage(error.message, [this.apiKey])
      return new NetworkError(sanitizedMessage)
    }

    return new NetworkError('Unknown network error occurred')
  }

  /**
   * Type guard for API error response
   */
  private isApiErrorResponse(body: unknown): body is ApiErrorResponse {
    return body !== null &&
      typeof body === 'object' &&
      'type' in body &&
      'errors' in body &&
      Array.isArray((body as ApiErrorResponse).errors)
  }

  /**
   * Debug request interceptor
   */
  private debugRequestInterceptor(options: RequestOptions): RequestOptions {
    console.log(`[HTTP] ${options.method} ${options.path}`, {
      headers: options.headers,
      body: options.body,
    })
    return options
  }

  /**
   * Debug response interceptor
   */
  private debugResponseInterceptor<T>(response: HttpResponse<T>): HttpResponse<T> {
    console.log(`[HTTP] ${response.status} ${response.url}`, {
      requestId: response.requestId,
      data: response.data,
    })
    return response
  }
}
