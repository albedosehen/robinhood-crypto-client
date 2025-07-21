# Robinhood Crypto Client

[![Build Status](https://img.shields.io/badge/Build-passing-brightgreen.svg)](https://github.com/albedosehen/robinhood-crypto-client) [![Deno Version](https://img.shields.io/badge/Deno-v2.4.1-green)](https://deno.land/) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![JSR](https://jsr.io/badges/@albedosehen/robinhood-crypto-client)](https://jsr.io/@albedosehen/robinhood-crypto-client)

A comprehensive, production-ready TypeScript client library for the Robinhood Crypto API. Built with Deno and designed for security, reliability, and ease of use.

## ✨ Features

### 🔐 **Authentication & Security**

- **Ed25519 digital signatures** using Deno's Web Crypto API
- **Automatic request signing** with message integrity validation
- **Secure credential management** with environment variable support
- **Sanitized error handling** to prevent key leakage

### 🚦 **Rate Limiting & Reliability**

- **Token bucket rate limiting** (100 requests/minute, 300 burst capacity)
- **Exponential backoff** with jitter for failed requests
- **Automatic retry logic** with configurable policies
- **Connection pooling** via Deno's native fetch

### 📊 **Complete API Coverage**

- **Account Management** - Details, balance, permissions, status
- **Market Data** - Real-time quotes, estimated prices, spreads
- **Trading Operations** - Orders (market/limit), holdings, cancellation
- **Portfolio Management** - Summary, balance tracking, holdings

### 🛠️ **Developer Experience**

- **Full TypeScript support** with strict type checking
- **Comprehensive error handling** with detailed error codes
- **Pagination support** for large data sets
- **Debug logging** for development and troubleshooting
- **185+ unit and integration tests** with excellent coverage

## 🚀 Quick Start

### Installation

```bash
# Using Deno
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'

# Or add to deno.json imports
{
  "imports": {
    "@robinhood/crypto": "jsr:@albedosehen/robinhood-crypto-client"
  }
}
```

### Basic Usage

```typescript
import { CryptoClient } from '@robinhood/crypto'

// Initialize client with credentials
const client = new CryptoClient({
  apiKey: Deno.env.get('RH_CRYPTO_API_KEY')!,
  secretKey: Deno.env.get('RH_CRYPTO_SECRET_KEY')!
})

// Test connectivity
const status = await client.testClientConnections()
console.log('Available endpoints:', status.endpoints)

// Get account information
const account = await client.account.getAccountDetails()
console.log('Account status:', account.status)
console.log('Buying power:', account.buying_power, account.buying_power_currency)

// Get real-time market data
const quotes = await client.marketData.getBestBidAsk(['BTC-USD', 'ETH-USD'])
for (const quote of quotes.results) {
  console.log(`${quote.symbol}: $${quote.mid_price}`)
}

// Get your crypto holdings
const holdings = await client.trading.getHoldings()
for (const holding of holdings.results) {
  console.log(`${holding.asset_code}: ${holding.quantity}`)
}
```

## Crypto Client

### Client Initialization

```typescript
const client = new CryptoClient({
  apiKey: 'your-api-key',           // Required: Your Robinhood API key
  secretKey: 'your-secret-key',     // Required: Base64-encoded private key
  baseUrl: 'https://api.robinhood.com', // Optional: API base URL
  timeout: 30000,                   // Optional: Request timeout (ms)
  debug: false,                     // Optional: Enable debug logging
  rateLimit: {                      // Optional: Rate limiting config
    maxRequests: 100,               // Requests per minute
    burstCapacity: 300,             // Burst allowance
    windowMs: 60000                 // Rate limit window
  }
})
```

### Environment Variables

Set your credentials using environment variables:

```bash
export RH_CRYPTO_API_KEY="your-api-key"
export RH_CRYPTO_SECRET_KEY="your-base64-encoded-private-key"
```

Then initialize without explicit credentials:

```typescript
const client = new CryptoClient() // Automatically loads from env vars
```

## 🔧 API Reference

### Account Operations

```typescript
// Get account details
const account = await client.account.getAccountDetails()

// Get account summary with metadata
const summary = await client.account.getAccountSummary()

// Check account status
const isActive = await client.account.isAccountActive()

// Get buying power
const buyingPower = await client.account.getBuyingPower()
```

### Market Data Operations

```typescript
// Get best bid/ask prices
const quotes = await client.marketData.getBestBidAsk(['BTC-USD'])

// Get estimated execution price
const estimate = await client.marketData.getEstimatedPrice({
  symbol: 'BTC-USD',
  side: 'ask',      // 'bid' for sell, 'ask' for buy
  quantities: ['0.1', '1.0']
})

// Get current market price
const btcPrice = await client.marketData.getCurrentPrice('BTC-USD')

// Get bid-ask spread
const spread = await client.marketData.getSpread('BTC-USD')
```

### Trading Operations

```typescript
// Get trading pairs
const pairs = await client.trading.getTradingPairs(['BTC-USD'])

// Get your holdings
const holdings = await client.trading.getHoldings(['BTC', 'ETH'])

// Place a market buy order
const order = await client.trading.placeMarketBuyOrder({
  symbol: 'BTC-USD',
  assetQuantity: '0.001'  // Buy 0.001 BTC
})

// Place a limit sell order
const limitOrder = await client.trading.placeLimitSellOrder({
  symbol: 'ETH-USD',
  limitPrice: '3000.00',
  assetQuantity: '1.0'
})

// Get order status
const orderDetails = await client.trading.getOrder(order.id)

// Cancel an order
const cancellation = await client.trading.cancelOrder(order.id)

// Get open orders
const openOrders = await client.trading.getOpenOrders()

// Get portfolio summary
const portfolio = await client.trading.getPortfolioSummary()
```

## 🛡️ Error Handling

The client provides comprehensive error handling with specific error types:

```typescript
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NetworkError,
  ApiError
} from '@robinhood/crypto'

try {
  const account = await client.account.getAccountDetails()
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('Invalid credentials:', error.message)
  } else if (error instanceof RateLimitError) {
    console.log('Rate limit exceeded, retry after:', error.retryAfter)
  } else if (error instanceof ValidationError) {
    console.log('Invalid request parameters:', error.message)
  } else if (error instanceof NetworkError) {
    console.log('Network connectivity issue:', error.message)
  } else if (error instanceof ApiError) {
    console.log('API error:', error.code, error.message)
  }
}
```

## ⚙️ Configuration

### Rate Limiting

The client includes intelligent rate limiting to prevent API throttling:

```typescript
const client = new CryptoClient({
  apiKey: 'your-key',
  secretKey: 'your-secret',
  rateLimit: {
    maxRequests: 100,     // Requests per minute (default: 100)
    burstCapacity: 300,   // Burst allowance (default: 300)
    windowMs: 60000       // Rate window in ms (default: 60000)
  }
})

// Check rate limiter status
const status = client.getRateLimiterStatus()
console.log('Remaining requests:', status.remainingRequests)
console.log('Reset time:', status.resetTime)

// Reset rate limiter (useful for testing)
client.resetRateLimiter()
```

### Debug Mode

Enable debug logging to monitor API interactions:

```typescript
const client = new CryptoClient({
  apiKey: 'your-key',
  secretKey: 'your-secret',
  debug: true  // Enables detailed logging
})

// Check if debug mode is enabled
const debugEnabled = client.isDebugEnabled()
```

## Documentation

- **[Getting Started Guide](docs/getting-started.md)** - Step-by-step setup instructions
- **[Usage Examples](docs/examples.md)** - Practical code examples
- **[API Reference](docs/api-reference.md)** - Complete method documentation
- **[Advanced Topics](docs/advanced.md)** - Authentication, rate limiting, error handling
- **[Architecture](docs/architecture/core.md)** - Technical implementation details

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
deno task test

# Run with coverage
deno task test:coverage

# Run unit tests only
deno task test:unit

# Run integration tests
deno task test:integration

# Run tests in watch mode
deno task test:watch
```

## 🔒 Security Considerations

### Credential Management

- **Never log or expose private keys** in production code
- **Use environment variables** for credential storage
- **Rotate API keys regularly** as per security best practices
- **Monitor API usage** for unauthorized access

### Request Security

- All requests are **signed with Ed25519 signatures**
- **Timestamp validation** prevents replay attacks (30-second window)
- **Message integrity** is validated on every request
- **Error messages are sanitized** to prevent key leakage

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/albedosehen/robinhood-crypto-client.git
cd robinhood-crypto-client

# Run tests
deno task test

# Format code
deno fmt

# Lint code
deno lint
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Need Help?

- **Documentation**: Check the [docs](docs/) directory for detailed guides
- **Issues**: Report bugs and feature requests on [GitHub Issues](https://github.com/albedosehen/robinhood-crypto-client/issues)

---

## ⚠️ Disclaimer ⚠️

This client library is provided as-is for educational and development purposes. You assume all risks associated with using this library, including any financial risks related to trading operations. Always test thoroughly in a sandbox environment before using with real funds.
