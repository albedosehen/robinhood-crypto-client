# API Reference

Complete reference documentation for the Robinhood Crypto Client API. This document provides detailed information about all classes, methods, types, and configuration options.

## Table of Contents

- [CryptoClient](#cryptoclient)
- [Account Endpoint](#account-endpoint)
- [Market Data Endpoint](#market-data-endpoint)
- [Trading Endpoint](#trading-endpoint)
- [Error Classes](#error-classes)
- [Configuration](#configuration)

## CryptoClient

The main client class that provides access to all Robinhood Crypto API endpoints.

### Constructor

```typescript
new CryptoClient(config?: Partial<CryptoClientConfig>)
```

**Parameters:**

- `config` - Optional configuration object. If not provided, loads from environment variables.

**Example:**

```typescript
const client = new CryptoClient({
  apiKey: 'your-api-key',
  secretKey: 'your-secret-key',
  debug: true
})
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `account` | `AccountEndpoint` | Account operations endpoint |
| `marketData` | `MarketDataEndpoint` | Market data operations endpoint |
| `trading` | `TradingEndpoint` | Trading operations endpoint |

### Methods

#### testClientConnections()

Tests connectivity to all API endpoints and returns status information.

```typescript
testClientConnections(): Promise<EndpointStatus>
```

**Returns:** `Promise<EndpointStatus>`

**Example:**

```typescript
const status = await client.testClientConnections()
console.log('Account endpoint:', status.endpoints.account)
console.log('Latency:', status.latency?.account, 'ms')
```

#### getRateLimiterStatus()

Returns current rate limiting status information.

```typescript
getRateLimiterStatus(): RateLimiterStatus
```

**Returns:** `RateLimiterStatus`

#### resetRateLimiter()

Resets the rate limiter state (useful for testing).

```typescript
resetRateLimiter(): void
```

#### getConfiguration()

Returns sanitized configuration object (credentials are masked).

```typescript
getConfiguration(): Record<string, unknown>
```

**Returns:** `Record<string, unknown>`

#### isDebugEnabled()

Checks if debug mode is enabled.

```typescript
isDebugEnabled(): boolean
```

**Returns:** `boolean`

#### getBaseUrl()

Returns the base URL being used for API requests.

```typescript
getBaseUrl(): string
```

**Returns:** `string`

---

## Account Endpoint

Accessed via `client.account`. Provides methods for account information and management.

### getAccountDetails()

Retrieves basic account details for the authenticated user.

```typescript
getAccountDetails(): Promise<AccountDetails>
```

**Returns:** `Promise<AccountDetails>`

**Example:**

```typescript
const account = await client.account.getAccountDetails()
console.log('Account number:', account.account_number)
console.log('Status:', account.status)
console.log('Buying power:', account.buying_power)
```

### getAccountSummary()

Retrieves comprehensive account summary with metadata.

```typescript
getAccountSummary(): Promise<AccountSummary>
```

**Returns:** `Promise<AccountSummary>`

### getAccountBalance()

Retrieves account balance information including total value breakdown.

```typescript
getAccountBalance(): Promise<AccountBalance>
```

**Returns:** `Promise<AccountBalance>`

**Example:**

```typescript
const balance = await client.account.getAccountBalance()
console.log('Total value:', balance.total_value)
console.log('Cash balance:', balance.cash_balance)
console.log('Crypto value:', balance.crypto_value)
```

### getAccountPermissions()

Retrieves account permissions and trading capabilities.

```typescript
getAccountPermissions(): Promise<AccountPermissions>
```

**Returns:** `Promise<AccountPermissions>`

### getAccountActivity()

Retrieves paginated account activity history.

```typescript
getAccountActivity(options?: PaginationOptions): Promise<PaginatedResponse<AccountActivity>>
```

**Parameters:**

- `options` - Optional pagination options

**Returns:** `Promise<PaginatedResponse<AccountActivity>>`

### getAllAccountActivity()

Retrieves all account activity across all pages.

```typescript
getAllAccountActivity(options?: PaginationOptions): Promise<AccountActivity[]>
```

**Parameters:**

- `options` - Optional pagination options for initial request

**Returns:** `Promise<AccountActivity[]>`

### isAccountActive()

Checks if the account is active and ready for trading.

```typescript
isAccountActive(): Promise<boolean>
```

**Returns:** `Promise<boolean>`

### getAccountStatus()

Returns the current account status string.

```typescript
getAccountStatus(): Promise<string>
```

**Returns:** `Promise<string>`

### getBuyingPower()

Retrieves available buying power amount and currency.

```typescript
getBuyingPower(): Promise<{ amount: string; currency: string }>
```

**Returns:** `Promise<{ amount: string; currency: string }>`

---

## Market Data Endpoint

Accessed via `client.marketData`. Provides methods for real-time and historical market data.

### getBestBidAsk()

Retrieves best bid and ask prices for specified trading pairs.

```typescript
getBestBidAsk(symbols?: Symbol[]): Promise<{ results: BestBidAsk[] }>
```

**Parameters:**

- `symbols` - Optional array of trading pair symbols. If not provided, returns all available pairs.

**Returns:** `Promise<{ results: BestBidAsk[] }>`

**Example:**

```typescript
// Get specific symbols
const quotes = await client.marketData.getBestBidAsk(['BTC-USD', 'ETH-USD'])

// Get all symbols
const allQuotes = await client.marketData.getBestBidAsk()
```

### getEstimatedPrice()

Retrieves estimated execution price for a specific order configuration.

```typescript
getEstimatedPrice(request: EstimatePriceRequest): Promise<EstimatedPriceResponse>
```

**Parameters:**

- `request` - Price estimation request parameters

**Returns:** `Promise<EstimatedPriceResponse>`

**Example:**

```typescript
const estimate = await client.marketData.getEstimatedPrice({
  symbol: 'BTC-USD',
  side: 'ask', // Use 'ask' for buy orders, 'bid' for sell orders
  quantities: ['0.1', '1.0', '5.0']
})
```

### getCurrentPrice()

Retrieves current market price (mid price) for a single symbol.

```typescript
getCurrentPrice(symbol: Symbol): Promise<string>
```

**Parameters:**

- `symbol` - Trading pair symbol (e.g., 'BTC-USD')

**Returns:** `Promise<string>`

**Example:**

```typescript
const btcPrice = await client.marketData.getCurrentPrice('BTC-USD')
console.log('Current BTC price:', btcPrice)
```

### getCurrentPrices()

Retrieves current market prices for multiple symbols.

```typescript
getCurrentPrices(symbols: Symbol[]): Promise<Record<Symbol, string>>
```

**Parameters:**

- `symbols` - Array of trading pair symbols

**Returns:** `Promise<Record<Symbol, string>>`

**Example:**

```typescript
const prices = await client.marketData.getCurrentPrices(['BTC-USD', 'ETH-USD'])
console.log('BTC:', prices['BTC-USD'])
console.log('ETH:', prices['ETH-USD'])
```

### getSpread()

Calculates bid-ask spread information for a symbol.

```typescript
getSpread(symbol: Symbol): Promise<{ symbol: Symbol; spread: string; spreadPercent: string }>
```

**Parameters:**

- `symbol` - Trading pair symbol

**Returns:** `Promise<{ symbol: Symbol; spread: string; spreadPercent: string }>`

### isSymbolTrading()

Checks if a symbol is actively trading (has valid bid/ask).

```typescript
isSymbolTrading(symbol: Symbol): Promise<boolean>
```

**Parameters:**

- `symbol` - Trading pair symbol

**Returns:** `Promise<boolean>`

### getAvailableSymbols()

Retrieves all available trading symbols.

```typescript
getAvailableSymbols(): Promise<Symbol[]>
```

**Returns:** `Promise<Symbol[]>`

### validateSymbol()

Validates symbol format and throws error if invalid.

```typescript
validateSymbol(symbol: Symbol): void
```

**Parameters:**

- `symbol` - Symbol to validate

**Throws:** `ValidationError` if symbol format is invalid

---

## Trading Endpoint

Accessed via `client.trading`. Provides methods for trading operations, order management, and portfolio tracking.

### getTradingPairs()

Retrieves trading pairs information with optional filtering and pagination.

```typescript
getTradingPairs(symbols?: Symbol[], options?: PaginationOptions): Promise<PaginatedResponse<TradingPair>>
```

**Parameters:**

- `symbols` - Optional array of trading pair symbols
- `options` - Optional pagination options

**Returns:** `Promise<PaginatedResponse<TradingPair>>`

**Example:**

```typescript
// Get specific trading pairs
const pairs = await client.trading.getTradingPairs(['BTC-USD', 'ETH-USD'])

// Get all trading pairs with pagination
const allPairs = await client.trading.getTradingPairs(undefined, { limit: 50 })
```

### getHoldings()

Retrieves crypto holdings for the account.

```typescript
getHoldings(assetCodes?: AssetCode[], options?: PaginationOptions): Promise<PaginatedResponse<CryptoHolding>>
```

**Parameters:**

- `assetCodes` - Optional array of asset codes (e.g., ['BTC', 'ETH'])
- `options` - Optional pagination options

**Returns:** `Promise<PaginatedResponse<CryptoHolding>>`

**Example:**

```typescript
// Get specific holdings
const holdings = await client.trading.getHoldings(['BTC', 'ETH'])

// Get all holdings
const allHoldings = await client.trading.getHoldings()
```

### getOrders()

Retrieves orders with optional filtering and pagination.

```typescript
getOrders(filters?: OrderFilters, options?: PaginationOptions): Promise<PaginatedResponse<Order>>
```

**Parameters:**

- `filters` - Optional order filters
- `options` - Optional pagination options

**Returns:** `Promise<PaginatedResponse<Order>>`

**Example:**

```typescript
// Get all orders
const orders = await client.trading.getOrders()

// Get open orders
const openOrders = await client.trading.getOrders({ state: 'open' })

// Get orders for specific symbol
const btcOrders = await client.trading.getOrders({ symbol: 'BTC-USD' })
```

### getOrder()

Retrieves a specific order by ID.

```typescript
getOrder(orderId: string): Promise<Order>
```

**Parameters:**

- `orderId` - Order ID string

**Returns:** `Promise<Order>`

**Example:**

```typescript
const order = await client.trading.getOrder('order-id-here')
console.log('Order state:', order.state)
console.log('Filled quantity:', order.filled_asset_quantity)
```

### placeOrder()

Places a new order with the specified configuration.

```typescript
placeOrder(request: CreateOrderRequest): Promise<Order>
```

**Parameters:**

- `request` - Complete order creation request

**Returns:** `Promise<Order>`

**Example:**

```typescript
const order = await client.trading.placeOrder({
  symbol: 'BTC-USD',
  client_order_id: crypto.randomUUID(),
  side: 'buy',
  type: 'market',
  market_order_config: {
    asset_quantity: '0.001'
  }
})
```

### cancelOrder()

Cancels an open order.

```typescript
cancelOrder(orderId: string): Promise<OrderCancellationResponse>
```

**Parameters:**

- `orderId` - Order ID to cancel

**Returns:** `Promise<OrderCancellationResponse>`

### placeMarketBuyOrder()

Convenience method for placing market buy orders.

```typescript
placeMarketBuyOrder(options: {
  symbol: Symbol
  assetQuantity?: string
  quoteAmount?: string
  clientOrderId?: string
}): Promise<Order>
```

**Parameters:**

- `options.symbol` - Trading pair symbol
- `options.assetQuantity` - Amount of crypto to buy (either this or quoteAmount)
- `options.quoteAmount` - Dollar amount to spend (either this or assetQuantity)
- `options.clientOrderId` - Optional client order ID

**Returns:** `Promise<Order>`

**Example:**

```typescript
// Buy specific amount of crypto
const order1 = await client.trading.placeMarketBuyOrder({
  symbol: 'BTC-USD',
  assetQuantity: '0.001'
})

// Spend specific dollar amount
const order2 = await client.trading.placeMarketBuyOrder({
  symbol: 'ETH-USD',
  quoteAmount: '100.00'
})
```

### placeMarketSellOrder()

Convenience method for placing market sell orders.

```typescript
placeMarketSellOrder(options: {
  symbol: Symbol
  assetQuantity?: string
  quoteAmount?: string
  clientOrderId?: string
}): Promise<Order>
```

**Parameters:**

- `options.symbol` - Trading pair symbol
- `options.assetQuantity` - Amount of crypto to sell (either this or quoteAmount)
- `options.quoteAmount` - Dollar value to sell (either this or assetQuantity)
- `options.clientOrderId` - Optional client order ID

**Returns:** `Promise<Order>`

### placeLimitBuyOrder()

Convenience method for placing limit buy orders.

```typescript
placeLimitBuyOrder(options: {
  symbol: Symbol
  limitPrice: string
  assetQuantity?: string
  quoteAmount?: string
  timeInForce?: 'gtc' | 'ioc' | 'fok'
  clientOrderId?: string
}): Promise<Order>
```

**Parameters:**

- `options.symbol` - Trading pair symbol
- `options.limitPrice` - Limit price for the order
- `options.assetQuantity` - Amount of crypto to buy (either this or quoteAmount)
- `options.quoteAmount` - Dollar amount to spend (either this or assetQuantity)
- `options.timeInForce` - Time in force (default: 'gtc')
- `options.clientOrderId` - Optional client order ID

**Returns:** `Promise<Order>`

### placeLimitSellOrder()

Convenience method for placing limit sell orders.

```typescript
placeLimitSellOrder(options: {
  symbol: Symbol
  limitPrice: string
  assetQuantity?: string
  quoteAmount?: string
  timeInForce?: 'gtc' | 'ioc' | 'fok'
  clientOrderId?: string
}): Promise<Order>
```

**Parameters:**

- Similar to `placeLimitBuyOrder` but for sell orders

**Returns:** `Promise<Order>`

### getOpenOrders()

Convenience method to get all open orders, optionally filtered by symbol.

```typescript
getOpenOrders(symbol?: Symbol): Promise<Order[]>
```

**Parameters:**

- `symbol` - Optional symbol filter

**Returns:** `Promise<Order[]>`

### getPortfolioSummary()

Retrieves comprehensive portfolio summary including holdings and values.

```typescript
getPortfolioSummary(): Promise<PortfolioSummary>
```

**Returns:** `Promise<PortfolioSummary>`

### hasSufficientBalance()

Checks if account has sufficient balance for a potential order.

```typescript
hasSufficientBalance(symbol: Symbol, side: 'buy' | 'sell', quantity: string): Promise<boolean>
```

**Parameters:**

- `symbol` - Trading pair symbol
- `side` - Order side ('buy' or 'sell')
- `quantity` - Quantity to check

**Returns:** `Promise<boolean>`

---

## Error Classes

### RobinhoodError

Base error class for all Robinhood-related errors.

```typescript
class RobinhoodError extends Error {
  constructor(message: string, cause?: Error)
}
```

### AuthenticationError

Thrown when API authentication fails.

```typescript
class AuthenticationError extends RobinhoodError {
  constructor(message: string, cause?: Error)
}
```

**Common causes:**

- Invalid API key
- Invalid secret key
- Malformed signatures
- Expired timestamps

### RateLimitError

Thrown when API rate limits are exceeded.

```typescript
class RateLimitError extends RobinhoodError {
  retryAfter?: number
  
  constructor(message: string, retryAfter?: number, cause?: Error)
}
```

**Properties:**

- `retryAfter` - Recommended seconds to wait before retrying

### ValidationError

Thrown when request parameters are invalid.

```typescript
class ValidationError extends RobinhoodError {
  constructor(message: string, cause?: Error)
}
```

### NetworkError

Thrown when network connectivity issues occur.

```typescript
class NetworkError extends RobinhoodError {
  constructor(message: string, cause?: Error)
}
```

### ApiError

Thrown when the API returns an error response.

```typescript
class ApiError extends RobinhoodError {
  code?: string
  
  constructor(message: string, code?: string, cause?: Error)
}
```

**Properties:**

- `code` - API error code if available

---

## Configuration

### Environment Variables

The client automatically loads configuration from environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `RH_CRYPTO_API_KEY` | Your Robinhood API key | Yes |
| `RH_CRYPTO_SECRET_KEY` | Base64-encoded private key | Yes |

### Default Configuration

```typescript
const defaultConfig: CryptoClientConfig = {
  baseUrl: 'https://api.robinhood.com',
  timeout: 30000,
  debug: false,
  rateLimit: {
    maxRequests: 100,
    burstCapacity: 300,
    windowMs: 60000
  }
}
```

### Rate Limiting

The client implements token bucket rate limiting with the following defaults:

- **Max Requests**: 100 per minute
- **Burst Capacity**: 300 requests
- **Window Size**: 60 seconds

### Authentication

All requests are authenticated using Ed25519 digital signatures with the following process:

1. Generate timestamp (Unix timestamp in seconds)
2. Create message: `{api_key}{timestamp}{path}{method}{body}`
3. Sign message with Ed25519 private key
4. Encode signature as Base64
5. Add headers: `x-api-key`, `x-signature`, `x-timestamp`

### Security Considerations

- **Never log private keys** or expose them in error messages
- **Validate timestamps** within 30-second window to prevent replay attacks
- **Use HTTPS** for all API communications
- **Rotate API keys** regularly per security best practices
