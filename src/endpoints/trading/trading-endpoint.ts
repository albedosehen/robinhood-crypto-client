/**
 * Trading Endpoint for Robinhood Crypto Client
 * @module
 */

import { BaseEndpoint } from '../base-endpoint.ts'
import type { HttpClient } from '../../client/httpClient.ts'
import type { AssetCode, PaginatedResponse, PaginationOptions, Symbol } from '../../types/mod.ts'
import type {
  CreateOrderRequest,
  CryptoHolding,
  Order,
  OrderCancellationResponse,
  OrderFilters,
  PortfolioSummary,
  TradingPair,
  // MarketBuyOrder,
  // MarketSellOrder,
  // LimitBuyOrder,
  // LimitSellOrder
} from './trading-endpoint.types.ts'
import { ValidationError } from '../../errors/mod.ts'

/**
 * Trading endpoint for managing orders, holdings, and trading operations
 *
 * @example
 * ```typescript
 * // Get trading pairs
 * const pairs = await client.trading.getTradingPairs(['BTC-USD'])
 * console.log('Min order size:', pairs.results[0].min_order_size)
 *
 * // Get holdings
 * const holdings = await client.trading.getHoldings(['BTC'])
 * console.log('BTC balance:', holdings.results[0].quantity)
 *
 * // Place a market buy order
 * const order = await client.trading.placeMarketBuyOrder({
 *   symbol: 'BTC-USD',
 *   assetQuantity: '0.001'
 * })
 * console.log('Order placed:', order.id)
 * ```
 */
export class TradingEndpoint extends BaseEndpoint {
  constructor(httpClient: HttpClient) {
    super(httpClient)
  }

  /**
   * Get trading pairs information
   *
   * @param symbols - Array of trading pair symbols (optional, returns all if not provided)
   * @param options - Pagination options
   * @returns Promise resolving to trading pairs data
   *
   * @example
   * ```typescript
   * // Get specific trading pairs
   * const pairs = await client.trading.getTradingPairs(['BTC-USD', 'ETH-USD'])
   *
   * // Get all trading pairs
   * const allPairs = await client.trading.getTradingPairs()
   *
   * // Get with pagination
   * const paginatedPairs = await client.trading.getTradingPairs(undefined, { limit: 10 })
   * ```
   */
  async getTradingPairs(
    symbols?: Symbol[],
    options: PaginationOptions = {},
  ): Promise<PaginatedResponse<TradingPair>> {
    let path = '/api/v1/crypto/trading/trading_pairs/'

    if (symbols && symbols.length > 0) {
      const queryString = this.buildMultiValueQueryString('symbol', symbols)
      path += queryString

      // Add pagination parameters if provided
      if (options.cursor || options.limit) {
        const separator = path.includes('?') ? '&' : '?'
        const paginationQuery = this.buildQueryString({
          cursor: options.cursor,
          limit: options.limit,
        })
        if (paginationQuery) {
          path += separator + paginationQuery.substring(1) // Remove leading '?'
        }
      }
    } else {
      const queryString = this.buildQueryString({
        cursor: options.cursor,
        limit: options.limit,
      })
      path += queryString
    }

    const response = await this.httpClient.get<PaginatedResponse<TradingPair>>(path)
    return response.data
  }

  /**
   * Get crypto holdings for the account
   *
   * @param assetCodes - Array of asset codes (optional, returns all if not provided)
   * @param options - Pagination options
   * @returns Promise resolving to holdings data
   *
   * @example
   * ```typescript
   * // Get specific holdings
   * const holdings = await client.trading.getHoldings(['BTC', 'ETH'])
   *
   * // Get all holdings
   * const allHoldings = await client.trading.getHoldings()
   *
   * // Check specific asset balance
   * const btcHoldings = await client.trading.getHoldings(['BTC'])
   * if (btcHoldings.results.length > 0) {
   *   console.log('BTC balance:', btcHoldings.results[0].quantity)
   * }
   * ```
   */
  async getHoldings(
    assetCodes?: AssetCode[],
    options: PaginationOptions = {},
  ): Promise<PaginatedResponse<CryptoHolding>> {
    let path = '/api/v1/crypto/trading/holdings/'

    if (assetCodes && assetCodes.length > 0) {
      const queryString = this.buildMultiValueQueryString('asset_code', assetCodes)
      path += queryString

      // Add pagination parameters if provided
      if (options.cursor || options.limit) {
        const separator = path.includes('?') ? '&' : '?'
        const paginationQuery = this.buildQueryString({
          cursor: options.cursor,
          limit: options.limit,
        })
        if (paginationQuery) {
          path += separator + paginationQuery.substring(1) // Remove leading '?'
        }
      }
    } else {
      const queryString = this.buildQueryString({
        cursor: options.cursor,
        limit: options.limit,
      })
      path += queryString
    }

    const response = await this.httpClient.get<PaginatedResponse<CryptoHolding>>(path)
    return response.data
  }

  /**
   * Get orders with optional filtering
   *
   * @param filters - Order filters
   * @param options - Pagination options
   * @returns Promise resolving to filtered orders
   *
   * @example
   * ```typescript
   * // Get all orders
   * const orders = await client.trading.getOrders()
   *
   * // Get open orders
   * const openOrders = await client.trading.getOrders({ state: 'open' })
   *
   * // Get orders for specific symbol
   * const btcOrders = await client.trading.getOrders({ symbol: 'BTC-USD' })
   *
   * // Get recent orders
   * const recent = await client.trading.getOrders({
   *   created_at_start: '2023-01-01T00:00:00Z'
   * })
   * ```
   */
  async getOrders(
    filters: OrderFilters = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResponse<Order>> {
    const queryParams = {
      ...filters,
      cursor: options.cursor,
      limit: options.limit,
    }

    const queryString = this.buildQueryString(queryParams)
    const path = `/api/v1/crypto/trading/orders/${queryString}`

    const response = await this.httpClient.get<PaginatedResponse<Order>>(path)
    return response.data
  }

  /**
   * Get a specific order by ID
   *
   * @param orderId - Order ID
   * @returns Promise resolving to order details
   *
   * @example
   * ```typescript
   * const order = await client.trading.getOrder('order-id')
   * console.log('Order state:', order.state)
   * console.log('Filled quantity:', order.filled_asset_quantity)
   * ```
   */
  async getOrder(orderId: string): Promise<Order> {
    if (!orderId || typeof orderId !== 'string') {
      throw new ValidationError('Order ID is required and must be a string')
    }

    const path = `/api/v1/crypto/trading/orders/${orderId}/`
    const response = await this.httpClient.get<Order>(path)
    return response.data
  }

  /**
   * Place a new order
   *
   * @param request - Order creation request
   * @returns Promise resolving to created order
   *
   * @example
   * ```typescript
   * // Place a market buy order
   * const order = await client.trading.placeOrder({
   *   symbol: 'BTC-USD',
   *   client_order_id: crypto.randomUUID(),
   *   side: 'buy',
   *   type: 'market',
   *   market_order_config: {
   *     asset_quantity: '0.001'
   *   }
   * })
   * ```
   */
  async placeOrder(request: CreateOrderRequest): Promise<Order> {
    this.validateOrderRequest(request)

    const path = '/api/v1/crypto/trading/orders/'
    const response = await this.httpClient.post<Order>(path, request)
    return response.data
  }

  /**
   * Cancel an open order
   *
   * @param orderId - Order ID to cancel
   * @returns Promise resolving to cancellation response
   *
   * @example
   * ```typescript
   * const result = await client.trading.cancelOrder('order-id')
   * console.log('Cancellation message:', result.message)
   * ```
   */
  async cancelOrder(orderId: string): Promise<OrderCancellationResponse> {
    if (!orderId || typeof orderId !== 'string') {
      throw new ValidationError('Order ID is required and must be a string')
    }

    const path = `/api/v1/crypto/trading/orders/${orderId}/cancel/`
    const response = await this.httpClient.post<string>(path)

    // Parse the response message
    return {
      message: response.data,
      order_id: orderId,
      cancelled_at: new Date().toISOString(),
    }
  }

  /**
   * Place a market buy order (convenience method)
   *
   * @param options - Market buy order options
   * @returns Promise resolving to created order
   */
  async placeMarketBuyOrder(options: {
    symbol: Symbol
    assetQuantity?: string
    quoteAmount?: string
    clientOrderId?: string
  }): Promise<Order> {
    if (!options.assetQuantity && !options.quoteAmount) {
      throw new ValidationError('Either assetQuantity or quoteAmount must be provided')
    }

    if (options.assetQuantity && options.quoteAmount) {
      throw new ValidationError('Cannot specify both assetQuantity and quoteAmount')
    }

    const order: CreateOrderRequest = {
      symbol: options.symbol,
      client_order_id: options.clientOrderId || globalThis.crypto.randomUUID(),
      side: 'buy',
      type: 'market',
      market_order_config: {
        asset_quantity: options.assetQuantity,
        quote_amount: options.quoteAmount,
      },
    }

    return this.placeOrder(order)
  }

  /**
   * Place a market sell order (convenience method)
   *
   * @param options - Market sell order options
   * @returns Promise resolving to created order
   */
  async placeMarketSellOrder(options: {
    symbol: Symbol
    assetQuantity?: string
    quoteAmount?: string
    clientOrderId?: string
  }): Promise<Order> {
    if (!options.assetQuantity && !options.quoteAmount) {
      throw new ValidationError('Either assetQuantity or quoteAmount must be provided')
    }

    if (options.assetQuantity && options.quoteAmount) {
      throw new ValidationError('Cannot specify both assetQuantity and quoteAmount')
    }

    const order: CreateOrderRequest = {
      symbol: options.symbol,
      client_order_id: options.clientOrderId || globalThis.crypto.randomUUID(),
      side: 'sell',
      type: 'market',
      market_order_config: {
        asset_quantity: options.assetQuantity,
        quote_amount: options.quoteAmount,
      },
    }

    return this.placeOrder(order)
  }

  /**
   * Place a limit buy order (convenience method)
   *
   * @param options - Limit buy order options
   * @returns Promise resolving to created order
   */
  async placeLimitBuyOrder(options: {
    symbol: Symbol
    limitPrice: string
    assetQuantity?: string
    quoteAmount?: string
    timeInForce?: 'gtc' | 'ioc' | 'fok'
    clientOrderId?: string
  }): Promise<Order> {
    if (!options.assetQuantity && !options.quoteAmount) {
      throw new ValidationError('Either assetQuantity or quoteAmount must be provided')
    }

    if (options.assetQuantity && options.quoteAmount) {
      throw new ValidationError('Cannot specify both assetQuantity and quoteAmount')
    }

    const order: CreateOrderRequest = {
      symbol: options.symbol,
      client_order_id: options.clientOrderId || globalThis.crypto.randomUUID(),
      side: 'buy',
      type: 'limit',
      limit_order_config: {
        asset_quantity: options.assetQuantity,
        quote_amount: options.quoteAmount,
        limit_price: options.limitPrice,
        time_in_force: options.timeInForce || 'gtc',
      },
    }

    return this.placeOrder(order)
  }

  /**
   * Place a limit sell order (convenience method)
   *
   * @param options - Limit sell order options
   * @returns Promise resolving to created order
   */
  async placeLimitSellOrder(options: {
    symbol: Symbol
    limitPrice: string
    assetQuantity?: string
    quoteAmount?: string
    timeInForce?: 'gtc' | 'ioc' | 'fok'
    clientOrderId?: string
  }): Promise<Order> {
    if (!options.assetQuantity && !options.quoteAmount) {
      throw new ValidationError('Either assetQuantity or quoteAmount must be provided')
    }

    if (options.assetQuantity && options.quoteAmount) {
      throw new ValidationError('Cannot specify both assetQuantity and quoteAmount')
    }

    const order: CreateOrderRequest = {
      symbol: options.symbol,
      client_order_id: options.clientOrderId || globalThis.crypto.randomUUID(),
      side: 'sell',
      type: 'limit',
      limit_order_config: {
        asset_quantity: options.assetQuantity,
        quote_amount: options.quoteAmount,
        limit_price: options.limitPrice,
        time_in_force: options.timeInForce || 'gtc',
      },
    }

    return this.placeOrder(order)
  }

  /**
   * Get open orders
   *
   * @param symbol - Optional symbol filter
   * @returns Promise resolving to open orders
   */
  async getOpenOrders(symbol?: Symbol): Promise<Order[]> {
    const filters: OrderFilters = { state: 'open' }
    if (symbol) {
      filters.symbol = symbol
    }

    const response = await this.getOrders(filters)
    return response.results
  }

  /**
   * Get portfolio summary
   *
   * @returns Promise resolving to portfolio summary
   */
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const holdingsResponse = await this.getHoldings()
    const holdings = holdingsResponse.results

    let totalCryptoValue = 0
    let cashBalance = 0

    for (const holding of holdings) {
      if (holding.market_value) {
        totalCryptoValue += parseFloat(holding.market_value)
      }

      // Treat USD/USDC holdings as cash
      if (['USD', 'USDC', 'USDT'].includes(holding.asset_code)) {
        cashBalance += parseFloat(holding.quantity)
      }
    }

    const totalValue = totalCryptoValue + cashBalance

    return {
      total_value: totalValue.toString(),
      cash_balance: cashBalance.toString(),
      crypto_value: totalCryptoValue.toString(),
      currency: 'USD',
      holdings,
      updated_at: new Date().toISOString(),
    }
  }

  /**
   * Check if sufficient balance exists for an order
   *
   * @param symbol - Trading pair symbol
   * @param side - Order side
   * @param quantity - Quantity to check
   * @returns Promise resolving to boolean indicating sufficient balance
   */
  async hasSufficientBalance(symbol: Symbol, side: 'buy' | 'sell', quantity: string): Promise<boolean> {
    const [baseAsset, quoteAsset] = symbol.split('-')
    const requiredAsset = side === 'buy' ? quoteAsset : baseAsset

    const holdings = await this.getHoldings([requiredAsset])
    if (holdings.results.length === 0) {
      return false
    }

    const availableQuantity = parseFloat(holdings.results[0].available_quantity)
    const requiredQuantity = parseFloat(quantity)

    return availableQuantity >= requiredQuantity
  }

  /**
   * Validate order request parameters
   */
  private validateOrderRequest(request: CreateOrderRequest): void {
    if (!request.symbol || typeof request.symbol !== 'string') {
      throw new ValidationError('Symbol is required and must be a string')
    }

    if (!request.client_order_id || typeof request.client_order_id !== 'string') {
      throw new ValidationError('Client order ID is required and must be a string')
    }

    if (!['buy', 'sell'].includes(request.side)) {
      throw new ValidationError('Side must be "buy" or "sell"')
    }

    if (!['limit', 'market', 'stop_limit', 'stop_loss'].includes(request.type)) {
      throw new ValidationError('Type must be "limit", "market", "stop_limit", or "stop_loss"')
    }

    // Validate order configuration based on type
    const configCount = [
      request.market_order_config,
      request.limit_order_config,
      request.stop_loss_order_config,
      request.stop_limit_order_config,
    ].filter((config) => config !== undefined).length

    if (configCount !== 1) {
      throw new ValidationError('Exactly one order configuration must be provided')
    }

    // Validate specific order type configurations
    if (request.type === 'market' && !request.market_order_config) {
      throw new ValidationError('Market order configuration is required for market orders')
    }

    if (request.type === 'limit' && !request.limit_order_config) {
      throw new ValidationError('Limit order configuration is required for limit orders')
    }

    if (request.type === 'stop_loss' && !request.stop_loss_order_config) {
      throw new ValidationError('Stop loss order configuration is required for stop loss orders')
    }

    if (request.type === 'stop_limit' && !request.stop_limit_order_config) {
      throw new ValidationError('Stop limit order configuration is required for stop limit orders')
    }
  }
}
