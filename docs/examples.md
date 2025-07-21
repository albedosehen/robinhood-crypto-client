# Usage Examples

This guide provides comprehensive examples for using the Robinhood Crypto Client. All examples assume you have properly configured your API credentials.

## Table of Contents

- [Setup and Authentication](#setup-and-authentication)
- [Account Operations](#account-operations)
- [Market Data Operations](#market-data-operations)
- [Trading Operations](#trading-operations)
- [Error Handling](#error-handling)
- [Pagination](#pagination)
- [Rate Limiting](#rate-limiting)
- [Advanced Usage Patterns](#advanced-usage-patterns)

## Setup and Authentication

### Basic Client Setup

```typescript
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'

// Method 1: Explicit credentials
const client = new CryptoClient({
  apiKey: 'your-api-key',
  secretKey: 'your-base64-encoded-private-key'
})

// Method 2: Environment variables (recommended)
// Set RH_CRYPTO_API_KEY and RH_CRYPTO_SECRET_KEY
const client = new CryptoClient()

// Method 3: Custom configuration
const client = new CryptoClient({
  apiKey: Deno.env.get('RH_CRYPTO_API_KEY')!,
  secretKey: Deno.env.get('RH_CRYPTO_SECRET_KEY')!,
  baseUrl: 'https://api.robinhood.com',
  timeout: 30000,
  debug: true,
  rateLimit: {
    maxRequests: 100,
    burstCapacity: 300,
    windowMs: 60000
  }
})
```

### Testing Connectivity

```typescript
// Test all endpoints
const status = await client.testClientConnections()
console.log('Endpoint Status:')
console.log('- Account:', status.endpoints.account ? '✅' : '❌')
console.log('- Market Data:', status.endpoints.marketData ? '✅' : '❌')
console.log('- Trading:', status.endpoints.trading ? '✅' : '❌')

if (status.latency) {
  console.log('Latency:')
  console.log('- Account:', status.latency.account, 'ms')
  console.log('- Market Data:', status.latency.marketData, 'ms')
  console.log('- Trading:', status.latency.trading, 'ms')
}
```

## Account Operations

### Getting Account Information

```typescript
// Get basic account details
const account = await client.account.getAccountDetails()
console.log('Account Number:', account.account_number)
console.log('Status:', account.status)
console.log('Buying Power:', account.buying_power, account.buying_power_currency)

// Get account summary with metadata
const summary = await client.account.getAccountSummary()
console.log('Account Summary:', summary.account)
console.log('Last Updated:', summary.updated_at)

// Get account balance breakdown
const balance = await client.account.getAccountBalance()
console.log('Total Value:', balance.total_value, balance.currency)
console.log('Cash Balance:', balance.cash_balance, balance.currency)
console.log('Crypto Value:', balance.crypto_value, balance.currency)
```

### Account Status and Permissions

```typescript
// Check if account is active
const isActive = await client.account.isAccountActive()
console.log('Account Active:', isActive)

// Get account status
const status = await client.account.getAccountStatus()
console.log('Account Status:', status)

// Get buying power
const buyingPower = await client.account.getBuyingPower()
console.log('Available to spend:', buyingPower.amount, buyingPower.currency)

// Get account permissions
const permissions = await client.account.getAccountPermissions()
console.log('Trading Enabled:', permissions.trading_enabled)
console.log('Market Data Enabled:', permissions.market_data_enabled)
console.log('Account Access Enabled:', permissions.account_access_enabled)

if (permissions.limits) {
  console.log('Max Order Value:', permissions.limits.max_order_value)
  console.log('Max Daily Volume:', permissions.limits.max_daily_volume)
}
```

## Market Data Operations

### Getting Real-time Quotes

```typescript
// Get quotes for specific symbols
const quotes = await client.marketData.getBestBidAsk(['BTC-USD', 'ETH-USD', 'ADA-USD'])
for (const quote of quotes.results) {
  console.log(`${quote.symbol}:`)
  console.log(`  Bid: $${quote.bid_price}`)
  console.log(`  Ask: $${quote.ask_price}`)
  console.log(`  Mid: $${quote.mid_price}`)
  console.log(`  Spread: $${(parseFloat(quote.ask_price) - parseFloat(quote.bid_price)).toFixed(2)}`)
}

// Get all available quotes
const allQuotes = await client.marketData.getBestBidAsk()
console.log(`Retrieved quotes for ${allQuotes.results.length} trading pairs`)
```

### Price Estimation and Analysis

```typescript
// Get estimated price for buying different amounts
const buyEstimate = await client.marketData.getEstimatedPrice({
  symbol: 'BTC-USD',
  side: 'ask', // Use 'ask' for buy orders
  quantities: ['0.001', '0.01', '0.1', '1.0']
})

console.log('Buy Price Estimates for BTC-USD:')
for (const estimate of buyEstimate.results) {
  console.log(`${estimate.quantity} BTC: $${estimate.price}`)
}

// Get estimated price for selling
const sellEstimate = await client.marketData.getEstimatedPrice({
  symbol: 'ETH-USD',
  side: 'bid', // Use 'bid' for sell orders
  quantities: ['1', '10', '50']
})

console.log('Sell Price Estimates for ETH-USD:')
for (const estimate of sellEstimate.results) {
  console.log(`${estimate.quantity} ETH: $${estimate.price}`)
}
```

### Current Prices and Spreads

```typescript
// Get current price for a single symbol
const btcPrice = await client.marketData.getCurrentPrice('BTC-USD')
console.log('Current BTC Price:', btcPrice)

// Get current prices for multiple symbols
const prices = await client.marketData.getCurrentPrices(['BTC-USD', 'ETH-USD', 'SOL-USD'])
for (const [symbol, price] of Object.entries(prices)) {
  console.log(`${symbol}: $${price}`)
}

// Analyze bid-ask spread
const spread = await client.marketData.getSpread('BTC-USD')
console.log(`${spread.symbol} Spread:`)
console.log(`  Absolute: $${spread.spread}`)
console.log(`  Percentage: ${spread.spreadPercent}%`)

// Check if a symbol is actively trading
const isTrading = await client.marketData.isSymbolTrading('BTC-USD')
console.log('BTC-USD is trading:', isTrading)

// Get all available trading symbols
const symbols = await client.marketData.getAvailableSymbols()
console.log(`Available symbols: ${symbols.join(', ')}`)
```

## Trading Operations

### Getting Trading Information

```typescript
// Get trading pairs information
const pairs = await client.trading.getTradingPairs(['BTC-USD', 'ETH-USD'])
for (const pair of pairs.results) {
  console.log(`${pair.symbol}:`)
  console.log(`  Min Order Size: ${pair.min_order_size}`)
  console.log(`  Max Order Size: ${pair.max_order_size}`)
  console.log(`  Base Increment: ${pair.base_increment}`)
  console.log(`  Quote Increment: ${pair.quote_increment}`)
}

// Get all trading pairs with pagination
const allPairs = await client.trading.getTradingPairs(undefined, { limit: 50 })
console.log(`Retrieved ${allPairs.results.length} trading pairs`)
if (allPairs.next) {
  console.log('More pages available')
}
```

### Managing Holdings

```typescript
// Get specific holdings
const holdings = await client.trading.getHoldings(['BTC', 'ETH', 'USD'])
for (const holding of holdings.results) {
  console.log(`${holding.asset_code}:`)
  console.log(`  Quantity: ${holding.quantity}`)
  console.log(`  Available: ${holding.available_quantity}`)
  if (holding.market_value) {
    console.log(`  Market Value: $${holding.market_value}`)
  }
  if (holding.cost_basis) {
    console.log(`  Cost Basis: $${holding.cost_basis}`)
  }
}

// Get all holdings
const allHoldings = await client.trading.getHoldings()
console.log(`Total holdings: ${allHoldings.results.length}`)

// Get portfolio summary
const portfolio = await client.trading.getPortfolioSummary()
console.log('Portfolio Summary:')
console.log(`  Total Value: $${portfolio.total_value}`)
console.log(`  Cash Balance: $${portfolio.cash_balance}`)
console.log(`  Crypto Value: $${portfolio.crypto_value}`)
console.log(`  Last Updated: ${portfolio.updated_at}`)
```

### Placing Orders

```typescript
// Market buy order (buy specific amount of crypto)
const marketBuy = await client.trading.placeMarketBuyOrder({
  symbol: 'BTC-USD',
  assetQuantity: '0.001' // Buy 0.001 BTC
})
console.log('Market buy order placed:', marketBuy.id)
console.log('Order state:', marketBuy.state)

// Market buy order (spend specific dollar amount)
const marketBuyDollar = await client.trading.placeMarketBuyOrder({
  symbol: 'ETH-USD',
  quoteAmount: '100.00' // Spend $100 on ETH
})
console.log('Dollar-based market buy order placed:', marketBuyDollar.id)

// Market sell order
const marketSell = await client.trading.placeMarketSellOrder({
  symbol: 'BTC-USD',
  assetQuantity: '0.0005' // Sell 0.0005 BTC
})
console.log('Market sell order placed:', marketSell.id)

// Limit buy order
const limitBuy = await client.trading.placeLimitBuyOrder({
  symbol: 'BTC-USD',
  limitPrice: '45000.00',
  assetQuantity: '0.001',
  timeInForce: 'gtc' // Good Till Cancelled
})
console.log('Limit buy order placed:', limitBuy.id)

// Limit sell order
const limitSell = await client.trading.placeLimitSellOrder({
  symbol: 'ETH-USD',
  limitPrice: '3200.00',
  assetQuantity: '0.5',
  timeInForce: 'ioc' // Immediate Or Cancel
})
console.log('Limit sell order placed:', limitSell.id)
```

### Managing Orders

```typescript
// Get all orders
const orders = await client.trading.getOrders()
console.log(`Total orders: ${orders.results.length}`)

// Get orders with filters
const openOrders = await client.trading.getOrders({ state: 'open' })
console.log(`Open orders: ${openOrders.results.length}`)

const btcOrders = await client.trading.getOrders({ symbol: 'BTC-USD' })
console.log(`BTC orders: ${btcOrders.results.length}`)

const recentOrders = await client.trading.getOrders({
  created_at_start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
})
console.log(`Orders from last 24h: ${recentOrders.results.length}`)

// Get specific order details
const order = await client.trading.getOrder('order-id-here')
console.log('Order Details:')
console.log(`  Symbol: ${order.symbol}`)
console.log(`  Side: ${order.side}`)
console.log(`  Type: ${order.type}`)
console.log(`  State: ${order.state}`)
console.log(`  Quantity: ${order.asset_quantity}`)
console.log(`  Filled: ${order.filled_asset_quantity}`)

// Get open orders (convenience method)
const currentlyOpen = await client.trading.getOpenOrders('BTC-USD')
console.log(`Open BTC orders: ${currentlyOpen.length}`)

// Cancel an order
const cancellation = await client.trading.cancelOrder('order-id-here')
console.log('Order cancelled:', cancellation.message)
console.log('Cancelled at:', cancellation.cancelled_at)
```

### Balance Validation

```typescript
// Check if you have sufficient balance before placing an order
const hasBuyingPower = await client.trading.hasSufficientBalance('BTC-USD', 'buy', '50000.00')
console.log('Can afford $50k BTC purchase:', hasBuyingPower)

const hasBTC = await client.trading.hasSufficientBalance('BTC-USD', 'sell', '0.1')
console.log('Can sell 0.1 BTC:', hasBTC)
```

## Error Handling

### Comprehensive Error Handling

```typescript
import { 
  AuthenticationError, 
  RateLimitError, 
  ValidationError, 
  NetworkError,
  ApiError,
  RobinhoodError
} from 'jsr:@albedosehen/robinhood-crypto-client'

async function handleApiCall() {
  try {
    const account = await client.account.getAccountDetails()
    console.log('Account retrieved successfully:', account.account_number)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('❌ Authentication failed:')
      console.error('  - Check your API key and secret key')
      console.error('  - Ensure keys are properly base64 encoded')
      console.error('  - Verify account has API access enabled')
    } else if (error instanceof RateLimitError) {
      console.error('⏳ Rate limit exceeded:')
      console.error(`  - Retry after: ${error.retryAfter} seconds`)
      console.error('  - Consider implementing exponential backoff')
      
      // Wait and retry
      if (error.retryAfter) {
        console.log(`Waiting ${error.retryAfter} seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000))
        // Retry the operation
      }
    } else if (error instanceof ValidationError) {
      console.error('⚠️ Invalid request parameters:')
      console.error(`  - ${error.message}`)
      console.error('  - Check API documentation for correct format')
    } else if (error instanceof NetworkError) {
      console.error('🌐 Network connectivity issue:')
      console.error(`  - ${error.message}`)
      console.error('  - Check internet connection')
      console.error('  - API may be temporarily unavailable')
    } else if (error instanceof ApiError) {
      console.error('🚨 API error:')
      console.error(`  - Code: ${error.code}`)
      console.error(`  - Message: ${error.message}`)
      console.error('  - Check API status and documentation')
    } else if (error instanceof RobinhoodError) {
      console.error('💥 General Robinhood error:')
      console.error(`  - ${error.message}`)
    } else {
      console.error('❓ Unexpected error:')
      console.error(error)
    }
  }
}
```

### Retry Logic with Error Handling

```typescript
async function retryableApiCall<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof RateLimitError && attempt < maxRetries) {
        const delay = error.retryAfter ? error.retryAfter * 1000 : baseDelay * Math.pow(2, attempt - 1)
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      if (error instanceof NetworkError && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`Network error. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // Don't retry authentication, validation, or API errors
      throw error
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Usage
const account = await retryableApiCall(() => client.account.getAccountDetails())
```

## Pagination

### Handling Paginated Responses

```typescript
// Get first page with specific limit
const firstPage = await client.trading.getHoldings(undefined, { limit: 10 })
console.log(`Page 1: ${firstPage.results.length} holdings`)

// Get next page if available
if (firstPage.next) {
  // Extract cursor from next URL
  const nextUrl = new URL(firstPage.next)
  const cursor = nextUrl.searchParams.get('cursor')
  
  const secondPage = await client.trading.getHoldings(undefined, { 
    cursor: cursor!,
    limit: 10 
  })
  console.log(`Page 2: ${secondPage.results.length} holdings`)
}

// Get all holdings using manual pagination
async function getAllHoldings() {
  const allHoldings = []
  let cursor: string | undefined
  
  do {
    const page = await client.trading.getHoldings(undefined, { 
      cursor,
      limit: 50 
    })
    
    allHoldings.push(...page.results)
    
    // Extract cursor for next page
    if (page.next) {
      const nextUrl = new URL(page.next)
      cursor = nextUrl.searchParams.get('cursor') || undefined
    } else {
      cursor = undefined
    }
    
    console.log(`Retrieved ${page.results.length} holdings, total: ${allHoldings.length}`)
  } while (cursor)
  
  return allHoldings
}

const allHoldings = await getAllHoldings()
console.log(`Total holdings retrieved: ${allHoldings.length}`)
```

### Using Built-in Pagination Helper

```typescript
// Some endpoints provide convenience methods for getting all pages
const allActivity = await client.account.getAllAccountActivity({ limit: 100 })
console.log(`All activity entries: ${allActivity.length}`)
```

## Rate Limiting

### Monitoring Rate Limit Status

```typescript
// Check current rate limiter status
const status = client.getRateLimiterStatus()
console.log('Rate Limiter Status:')
console.log(`  Remaining Requests: ${status.remainingRequests}`)
console.log(`  Reset Time: ${new Date(status.resetTime).toLocaleString()}`)
console.log(`  Window: ${status.windowMs}ms`)

// Make multiple requests while monitoring rate limits
for (let i = 0; i < 10; i++) {
  const beforeStatus = client.getRateLimiterStatus()
  console.log(`Request ${i + 1}: ${beforeStatus.remainingRequests} requests remaining`)
  
  try {
    await client.marketData.getCurrentPrice('BTC-USD')
    console.log(`✅ Request ${i + 1} successful`)
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.log(`⏳ Rate limited on request ${i + 1}`)
      break
    }
  }
}
```

### Custom Rate Limiting Configuration

```typescript
// Client with custom rate limiting
const customClient = new CryptoClient({
  apiKey: 'your-key',
  secretKey: 'your-secret',
  rateLimit: {
    maxRequests: 50,     // Lower limit for conservative usage
    burstCapacity: 100,  // Smaller burst capacity
    windowMs: 60000      // 1-minute window
  }
})

// Reset rate limiter (useful for testing)
customClient.resetRateLimiter()
console.log('Rate limiter reset')
```

## Advanced Usage Patterns

### Batch Operations

```typescript
// Get multiple quotes efficiently
const symbols = ['BTC-USD', 'ETH-USD', 'ADA-USD', 'SOL-USD', 'DOT-USD']
const quotes = await client.marketData.getBestBidAsk(symbols)

const priceMap = new Map()
for (const quote of quotes.results) {
  priceMap.set(quote.symbol, parseFloat(quote.mid_price))
}

console.log('Current Prices:')
for (const [symbol, price] of priceMap) {
  console.log(`  ${symbol}: $${price.toLocaleString()}`)
}
```

### Portfolio Monitoring

```typescript
async function monitorPortfolio() {
  const portfolio = await client.trading.getPortfolioSummary()
  const totalValue = parseFloat(portfolio.total_value)
  
  console.log(`📊 Portfolio Value: $${totalValue.toLocaleString()}`)
  
  // Get detailed breakdown
  for (const holding of portfolio.holdings) {
    if (parseFloat(holding.quantity) > 0) {
      const value = holding.market_value ? parseFloat(holding.market_value) : 0
      const percentage = totalValue > 0 ? (value / totalValue * 100).toFixed(2) : '0.00'
      
      console.log(`  ${holding.asset_code}: ${holding.quantity} (${percentage}% - $${value.toLocaleString()})`)
    }
  }
  
  // Check for any open orders
  const openOrders = await client.trading.getOpenOrders()
  if (openOrders.length > 0) {
    console.log(`\n📋 Open Orders: ${openOrders.length}`)
    for (const order of openOrders) {
      console.log(`  ${order.side.toUpperCase()} ${order.asset_quantity} ${order.symbol} at ${order.type}`)
    }
  }
}

// Monitor portfolio every 30 seconds
setInterval(monitorPortfolio, 30000)
```

### Price Alert System

```typescript
async function priceAlert(symbol: string, targetPrice: number, condition: 'above' | 'below') {
  console.log(`🔔 Setting price alert: ${symbol} ${condition} $${targetPrice}`)
  
  const checkPrice = async () => {
    try {
      const currentPrice = parseFloat(await client.marketData.getCurrentPrice(symbol))
      console.log(`Current ${symbol}: $${currentPrice}`)
      
      const triggered = condition === 'above' ? currentPrice >= targetPrice : currentPrice <= targetPrice
      
      if (triggered) {
        console.log(`🚨 ALERT: ${symbol} is ${condition} $${targetPrice}! Current: $${currentPrice}`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error checking price:', error instanceof Error ? error.message : error)
      return false
    }
  }
  
  // Check every 60 seconds
  const interval = setInterval(async () => {
    const triggered = await checkPrice()
    if (triggered) {
      clearInterval(interval)
    }
  }, 60000)
  
  // Initial check
  await checkPrice()
}

// Set alerts
await priceAlert('BTC-USD', 50000, 'above')
await priceAlert('ETH-USD', 3000, 'below')
```

### Automated Dollar-Cost Averaging

```typescript
async function dollarCostAverage(symbol: string, dollarAmount: string, intervalHours: number) {
  console.log(`💰 Starting DCA: $${dollarAmount} of ${symbol} every ${intervalHours} hours`)
  
  const executePurchase = async () => {
    try {
      // Check account balance first
      const buyingPower = await client.account.getBuyingPower()
      const availableFunds = parseFloat(buyingPower.amount)
      const purchaseAmount = parseFloat(dollarAmount)
      
      if (availableFunds < purchaseAmount) {
        console.log(`❌ Insufficient funds: $${availableFunds} available, $${purchaseAmount} needed`)
        return
      }
      
      // Get current price for logging
      const currentPrice = await client.marketData.getCurrentPrice(symbol)
      console.log(`Current ${symbol}: $${currentPrice}`)
      
      // Place market buy order
      const order = await client.trading.placeMarketBuyOrder({
        symbol,
        quoteAmount: dollarAmount
      })
      
      console.log(`✅ DCA purchase: $${dollarAmount} of ${symbol} (Order: ${order.id})`)
      
      // Wait for order to fill and get details
      setTimeout(async () => {
        try {
          const orderDetails = await client.trading.getOrder(order.id)
          if (orderDetails.state === 'filled') {
            console.log(`📈 Order filled: ${orderDetails.filled_asset_quantity} ${symbol.split('-')[0]}`)
          }
        } catch (error) {
          console.error('Error checking order status:', error)
        }
      }, 5000)
      
    } catch (error) {
      console.error('DCA purchase failed:', error instanceof Error ? error.message : error)
    }
  }
  
  // Execute immediately
  await executePurchase()
  
  // Schedule recurring purchases
  const intervalMs = intervalHours * 60 * 60 * 1000
  setInterval(executePurchase, intervalMs)
}

// Start DCA: $50 of BTC every 24 hours
await dollarCostAverage('BTC-USD', '50.00', 24)
```

### Market Analysis

```typescript
async function analyzeMarket(symbols: string[]) {
  console.log('📊 Market Analysis')
  console.log('='.repeat(50))
  
  for (const symbol of symbols) {
    try {
      // Get current quote
      const quotes = await client.marketData.getBestBidAsk([symbol])
      const quote = quotes.results[0]
      
      // Get spread analysis
      const spread = await client.marketData.getSpread(symbol)
      
      // Get estimated prices for different quantities
      const buyEstimate = await client.marketData.getEstimatedPrice({
        symbol,
        side: 'ask',
        quantities: ['0.1', '1.0']
      })
      
      const sellEstimate = await client.marketData.getEstimatedPrice({
        symbol,
        side: 'bid',
        quantities: ['0.1', '1.0']
      })
      
      console.log(`\n${symbol}:`)
      console.log(`  Current Price: $${quote.mid_price}`)
      console.log(`  Bid/Ask: $${quote.bid_price} / $${quote.ask_price}`)
      console.log(`  Spread: $${spread.spread} (${spread.spreadPercent}%)`)
      
      console.log('  Buy Estimates:')
      for (const estimate of buyEstimate.results) {
        console.log(`    ${estimate.quantity}: $${estimate.price}`)
      }
      
      console.log('  Sell Estimates:')
      for (const estimate of sellEstimate.results) {
        console.log(`    ${estimate.quantity}: $${estimate.price}`)
      }
      
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error instanceof Error ? error.message : error)
    }
  }
}

// Analyze major cryptocurrencies
await analyzeMarket(['BTC-USD', 'ETH-USD', 'ADA-USD', 'SOL-USD'])
```

This comprehensive examples documentation covers all the major features and usage patterns of the Robinhood Crypto Client, providing developers with practical, copy-paste examples for every capability.
