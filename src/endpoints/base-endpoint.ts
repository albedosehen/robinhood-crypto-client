/**
 * Base endpoint class for all API endpoints
 * @module
 */

import type { HttpClient } from '../client/httpClient.ts'
import type { PaginatedResponse, PaginationOptions } from '../types/mod.ts'

/**
 * Base class for all API endpoints
 */
export abstract class BaseEndpoint {
  protected readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  /**
   * Build query string from parameters
   */
  protected buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    }

    const query = searchParams.toString()
    return query ? `?${query}` : ''
  }

  /**
   * Build query string for multiple values of the same parameter
   */
  protected buildMultiValueQueryString(key: string, values: string[]): string {
    if (values.length === 0) {
      return ''
    }

    const params = values.map((value) => `${key}=${encodeURIComponent(value)}`)
    return `?${params.join('&')}`
  }

  /**
   * Handle paginated responses
   */
  protected async handlePaginatedRequest<T>(
    path: string,
    options: PaginationOptions = {},
  ): Promise<PaginatedResponse<T>> {
    const queryParams: Record<string, string | number | undefined> = {}

    if (options.cursor) {
      queryParams.cursor = options.cursor
    }

    if (options.limit) {
      queryParams.limit = options.limit
    }

    const queryString = this.buildQueryString(queryParams)
    const fullPath = `${path}${queryString}`

    const response = await this.httpClient.get<PaginatedResponse<T>>(fullPath)
    return response.data
  }

  /**
   * Extract cursor from pagination URL
   */
  protected extractCursorFromUrl(url?: string): string | undefined {
    if (!url) {
      return undefined
    }

    try {
      const urlObj = new URL(url)
      return urlObj.searchParams.get('cursor') || undefined
    } catch {
      return undefined
    }
  }

  /**
   * Get all pages of a paginated response
   */
  protected async getAllPages<T>(
    path: string,
    initialOptions: PaginationOptions = {},
  ): Promise<T[]> {
    const allResults: T[] = []
    let cursor = initialOptions.cursor

    while (true) {
      const response = await this.handlePaginatedRequest<T>(path, {
        ...initialOptions,
        cursor,
      })

      allResults.push(...response.results)

      if (!response.next) {
        break
      }

      cursor = this.extractCursorFromUrl(response.next)
      if (!cursor) {
        break
      }
    }

    return allResults
  }
}
