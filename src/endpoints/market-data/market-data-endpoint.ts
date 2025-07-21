/**
 * Market Data Endpoint for Robinhood Crypto Client
 * @module
 */

import { BaseEndpoint } from '../base-endpoint.ts'
import type { HttpClient } from '../../client/httpClient.ts'
import type { Symbol } from '../../types/mod.ts'
import type { BestBidAsk, EstimatedPriceResponse, EstimatePriceRequest } from './market-data-endpoint.types.ts'
import { ValidationError } from '../../errors/mod.ts'

/**
 * Market data endpoint for accessing real-time and historical market information
 *
 * @example
 * ```typescript
 * // Get best bid/ask for BTC-USD
 * const quotes = await client.marketData.getBestBidAsk(['BTC-USD'])
 * console.log('BTC bid:', quotes.results[0].bid_price)
 * console.log('BTC ask:', quotes.results[0].ask_price)
 *
 * // Get estimated price for buying 0.1 BTC
 * const estimate = await client.marketData.getEstimatedPrice({
 *   symbol: 'BTC-USD',
 *   side: 'ask',
 *   quantities: ['0.1']
 * })
 * ```
 */
export class MarketDataEndpoint extends BaseEndpoint {
  constructor(httpClient: HttpClient) {
    super(httpClient)
  }

  /**
   * Get best bid and ask prices for trading pairs
   *
   * @param symbols - Array of trading pair symbols (e.g., ['BTC-USD', 'ETH-USD'])
   * @returns Promise resolving to best bid/ask data
   *
   * @example
   * ```typescript
   * // Get quotes for multiple symbols
   * const quotes = await client.marketData.getBestBidAsk(['BTC-USD', 'ETH-USD'])
   * for (const quote of quotes.results) {
   *   console.log(`${quote.symbol}: ${quote.bid_price} / ${quote.ask_price}`)
   * }
   *
   * // Get quotes for all available symbols
   * const allQuotes = await client.marketData.getBestBidAsk()
   * ```
   */
  async getBestBidAsk(symbols?: Symbol[]): Promise<{ results: BestBidAsk[] }> {
    let path = '/api/v1/crypto/marketdata/best_bid_ask/'

    if (symbols && symbols.length > 0) {
      // Validate symbols format
      for (const symbol of symbols) {
        if (!symbol || typeof symbol !== 'string') {
          throw new ValidationError('Symbol must be a non-empty string')
        }
        if (!symbol.includes('-')) {
          throw new ValidationError(`Invalid symbol format: ${symbol}. Expected format like "BTC-USD"`)
        }
      }

      const queryString = this.buildMultiValueQueryString('symbol', symbols)
      path += queryString
    }

    const response = await this.httpClient.get<{ results: BestBidAsk[] }>(path)
    return response.data
  }

  /**
   * Get estimated execution price for a specific order
   *
   * @param request - Price estimation request parameters
   * @returns Promise resolving to estimated price data
   *
   * @example
   * ```typescript
   * // Get estimated price for buying different amounts of BTC
   * const estimates = await client.marketData.getEstimatedPrice({
   *   symbol: 'BTC-USD',
   *   side: 'ask', // Use 'ask' for buy orders
   *   quantities: ['0.1', '1', '5']
   * })
   *
   * // Get estimated price for selling ETH
   * const sellEstimate = await client.marketData.getEstimatedPrice({
   *   symbol: 'ETH-USD',
   *   side: 'bid', // Use 'bid' for sell orders
   *   quantities: ['10']
   * })
   * ```
   */
  async getEstimatedPrice(request: EstimatePriceRequest): Promise<EstimatedPriceResponse> {
    // Validate request parameters
    if (!request.symbol || typeof request.symbol !== 'string') {
      throw new ValidationError('Symbol is required and must be a string')
    }

    if (!request.symbol.includes('-')) {
      throw new ValidationError(`Invalid symbol format: ${request.symbol}. Expected format like "BTC-USD"`)
    }

    if (!['bid', 'ask', 'both'].includes(request.side)) {
      throw new ValidationError('Side must be "bid", "ask", or "both"')
    }

    if (!request.quantities || !Array.isArray(request.quantities) || request.quantities.length === 0) {
      throw new ValidationError('Quantities array is required and must not be empty')
    }

    if (request.quantities.length > 10) {
      throw new ValidationError('Maximum 10 quantities can be specified per request')
    }

    // Validate quantity format
    for (const quantity of request.quantities) {
      if (!quantity || typeof quantity !== 'string') {
        throw new ValidationError('Each quantity must be a non-empty string')
      }

      const numValue = parseFloat(quantity)
      if (isNaN(numValue) || numValue <= 0) {
        throw new ValidationError(`Invalid quantity: ${quantity}. Must be a positive number`)
      }
    }

    const queryParams = {
      symbol: request.symbol.toUpperCase(),
      side: request.side,
      quantity: request.quantities.join(','),
    }

    const queryString = this.buildQueryString(queryParams)
    const path = `/api/v1/crypto/marketdata/estimated_price/${queryString}`

    const response = await this.httpClient.get<EstimatedPriceResponse>(path)
    return response.data
  }

  /**
   * Get current market price for a symbol (mid price from best bid/ask)
   *
   * @param symbol - Trading pair symbol
   * @returns Promise resolving to current market price
   *
   * @example
   * ```typescript
   * const btcPrice = await client.marketData.getCurrentPrice('BTC-USD')
   * console.log('Current BTC price:', btcPrice)
   * ```
   */
  async getCurrentPrice(symbol: Symbol): Promise<string> {
    const quotes = await this.getBestBidAsk([symbol])

    if (quotes.results.length === 0) {
      throw new ValidationError(`No quote data available for symbol: ${symbol}`)
    }

    return quotes.results[0].mid_price
  }

  /**
   * Get current prices for multiple symbols
   *
   * @param symbols - Array of trading pair symbols
   * @returns Promise resolving to price map
   *
   * @example
   * ```typescript
   * const prices = await client.marketData.getCurrentPrices(['BTC-USD', 'ETH-USD'])
   * console.log('BTC:', prices['BTC-USD'])
   * console.log('ETH:', prices['ETH-USD'])
   * ```
   */
  async getCurrentPrices(symbols: Symbol[]): Promise<Record<Symbol, string>> {
    const quotes = await this.getBestBidAsk(symbols)
    const prices: Record<Symbol, string> = {}

    for (const quote of quotes.results) {
      prices[quote.symbol] = quote.mid_price
    }

    return prices
  }

  /**
   * Get bid-ask spread for a symbol
   *
   * @param symbol - Trading pair symbol
   * @returns Promise resolving to spread information
   */
  async getSpread(symbol: Symbol): Promise<{ symbol: Symbol; spread: string; spreadPercent: string }> {
    const quotes = await this.getBestBidAsk([symbol])

    if (quotes.results.length === 0) {
      throw new ValidationError(`No quote data available for symbol: ${symbol}`)
    }

    const quote = quotes.results[0]
    const bid = parseFloat(quote.bid_price)
    const ask = parseFloat(quote.ask_price)
    const mid = (bid + ask) / 2
    const spread = ask - bid
    const spreadPercent = ((spread / mid) * 100).toFixed(4)

    return {
      symbol: quote.symbol,
      spread: spread.toString(),
      spreadPercent: spreadPercent,
    }
  }

  /**
   * Check if a symbol is actively trading (has valid bid/ask)
   *
   * @param symbol - Trading pair symbol
   * @returns Promise resolving to boolean indicating if symbol is trading
   */
  async isSymbolTrading(symbol: Symbol): Promise<boolean> {
    try {
      const quotes = await this.getBestBidAsk([symbol])
      if (quotes.results.length === 0) {
        return false
      }

      const quote = quotes.results[0]
      const bid = parseFloat(quote.bid_price)
      const ask = parseFloat(quote.ask_price)

      return bid > 0 && ask > 0 && ask > bid
    } catch {
      return false
    }
  }

  /**
   * Get all available trading symbols
   * Note: This gets all symbols by calling getBestBidAsk without filters
   *
   * @returns Promise resolving to array of available symbols
   */
  async getAvailableSymbols(): Promise<Symbol[]> {
    const quotes = await this.getBestBidAsk()
    return quotes.results.map((quote) => quote.symbol)
  }

  /**
   * Validate symbol format
   *
   * @param symbol - Symbol to validate
   * @throws {ValidationError} If symbol format is invalid
   */
  validateSymbol(symbol: Symbol): void {
    if (!symbol || typeof symbol !== 'string') {
      throw new ValidationError('Symbol must be a non-empty string')
    }

    if (!symbol.includes('-')) {
      throw new ValidationError(`Invalid symbol format: ${symbol}. Expected format like "BTC-USD"`)
    }

    const parts = symbol.split('-')
    if (parts.length !== 2 || parts[0].length === 0 || parts[1].length === 0) {
      throw new ValidationError(`Invalid symbol format: ${symbol}. Expected format like "BTC-USD"`)
    }
  }
}
