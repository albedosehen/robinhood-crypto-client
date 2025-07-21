# Getting Started Guide

This guide will walk you through setting up and using the Robinhood Crypto Client from installation to making your first API calls.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Getting API Credentials](#getting-api-credentials)
- [Environment Setup](#environment-setup)
- [Your First API Call](#your-first-api-call)
- [Basic Operations](#basic-operations)
- [Testing Your Setup](#testing-your-setup)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have:

### System Requirements

- **Deno v2.0+** - [Install Deno](https://deno.land/manual/getting_started/installation)
- **Active Robinhood Account** with crypto trading enabled
- **Basic TypeScript/JavaScript knowledge**

### Verify Deno Installation

```bash
deno --version
# Should output Deno version 2.0+ with TypeScript and V8 versions
```

### Account Requirements

- **Robinhood account** with verified identity
- **Crypto trading enabled** in your account
- **API access** (available for eligible accounts)

## Installation

The Robinhood Crypto Client is available on JSR (JavaScript Registry). No package managers or build tools required with Deno!

### Method 1: Direct Import (Recommended)

```typescript
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'
```

### Method 2: Add to Import Map

Add to your `deno.json` file:

```json
{
  "imports": {
    "@robinhood/crypto": "jsr:@albedosehen/robinhood-crypto-client"
  }
}
```

Then import in your code:

```typescript
import { CryptoClient } from '@robinhood/crypto'
```

### Method 3: Version-specific Import

```typescript
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client@^0.0.1'
```

## Getting API Credentials

⚠️ **Important**: You'll need API credentials from Robinhood to use this client.

### Step 1: Access Robinhood Developer Portal

1. Log into your Robinhood account
2. Navigate to the Developer Portal (or API settings)
3. Apply for API access if not already granted

### Step 2: Create API Application

1. Click "Create Application" or "New API Key"
2. Provide application details:
   - **Name**: Your application name (e.g., "My Trading Bot")
   - **Description**: Brief description of your use case
   - **Permissions**: Select required permissions (typically includes crypto trading)

### Step 3: Generate Credentials

After approval, you'll receive:

- **API Key**: Public identifier for your application
- **Private Key**: Used for request signing (keep this secure!)

The private key will be provided in PEM format. You'll need to convert it to Base64 for the client.

### Step 4: Convert Private Key

If your private key is in PEM format, convert it to Base64:

```typescript
// Example conversion (adjust based on your key format)
const pemKey = `-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END PRIVATE KEY-----`

// Remove headers and whitespace, then use the Base64 content
const base64Key = pemKey
  .replace('-----BEGIN PRIVATE KEY-----', '')
  .replace('-----END PRIVATE KEY-----', '')
  .replace(/\s/g, '')
```

## Environment Setup

### Setting Environment Variables

Create a `.env` file in your project root (recommended) or set system environment variables:

```bash
# .env file
RH_CRYPTO_API_KEY=your_api_key_here
RH_CRYPTO_SECRET_KEY=your_base64_encoded_private_key_here
```

### Loading Environment Variables with Deno

```typescript
// Load environment variables from .env file
import 'jsr:@std/dotenv/load'

// Or load manually
import { load } from 'jsr:@std/dotenv'
const env = await load()
```

### Alternative: Direct Configuration

If you prefer not to use environment variables:

```typescript
const client = new CryptoClient({
  apiKey: 'your_api_key_here',
  secretKey: 'your_base64_encoded_private_key_here'
})
```

⚠️ **Security Note**: Never hardcode credentials in production code. Always use environment variables or secure credential management.

## Your First API Call

Let's create a simple script to test your setup and make your first API call.

### Create `first-test.ts`

```typescript
#!/usr/bin/env deno run --allow-net --allow-env

import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'

async function main() {
  try {
    console.log('🚀 Initializing Robinhood Crypto Client...')
    
    // Initialize client (loads from environment variables)
    const client = new CryptoClient({
      debug: true // Enable debug logging for initial testing
    })
    
    console.log('✅ Client initialized successfully')
    console.log('📡 Testing API connectivity...')
    
    // Test all endpoints
    const status = await client.testClientConnections()
    
    console.log('\n📊 Endpoint Status:')
    console.log(`Account: ${status.endpoints.account ? '✅' : '❌'}`)
    console.log(`Market Data: ${status.endpoints.marketData ? '✅' : '❌'}`)
    console.log(`Trading: ${status.endpoints.trading ? '✅' : '❌'}`)
    
    if (status.latency) {
      console.log('\n⏱️  Response Times:')
      console.log(`Account: ${status.latency.account}ms`)
      console.log(`Market Data: ${status.latency.marketData}ms`)
      console.log(`Trading: ${status.latency.trading}ms`)
    }
    
    console.log('\n🎉 Setup test completed successfully!')
    
  } catch (error) {
    console.error('❌ Setup test failed:')
    console.error(error.message)
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Troubleshooting Tips:')
      console.log('- Check your API key and secret key')
      console.log('- Ensure keys are properly formatted')
      console.log('- Verify your account has API access enabled')
    }
  }
}

if (import.meta.main) {
  main()
}
```

### Run Your First Test

```bash
deno run --allow-net --allow-env first-test.ts
```

Expected output:

```text
🚀 Initializing Robinhood Crypto Client...
✅ Client initialized successfully
📡 Testing API connectivity...

📊 Endpoint Status:
Account: ✅
Market Data: ✅
Trading: ✅

⏱️  Response Times:
Account: 156ms
Market Data: 142ms
Trading: 178ms

🎉 Setup test completed successfully!
```

## Basic Operations

Once your setup test passes, try these basic operations:

### Get Account Information

```typescript
// get-account.ts
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'

const client = new CryptoClient()

// Get account details
const account = await client.account.getAccountDetails()
console.log('Account Number:', account.account_number)
console.log('Status:', account.status)
console.log('Buying Power:', account.buying_power, account.buying_power_currency)

// Check if account is ready for trading
const isActive = await client.account.isAccountActive()
console.log('Ready for trading:', isActive)
```

### Get Market Data

```typescript
// get-prices.ts
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'

const client = new CryptoClient()

// Get current prices for major cryptocurrencies
const symbols = ['BTC-USD', 'ETH-USD', 'ADA-USD']
const quotes = await client.marketData.getBestBidAsk(symbols)

console.log('Current Prices:')
for (const quote of quotes.results) {
  console.log(`${quote.symbol}: $${quote.mid_price}`)
}

// Get detailed price estimate
const estimate = await client.marketData.getEstimatedPrice({
  symbol: 'BTC-USD',
  side: 'ask', // Price for buying
  quantities: ['0.001', '0.01']
})

console.log('\nBuy Price Estimates:')
for (const est of estimate.results) {
  console.log(`${est.quantity} BTC: $${est.price}`)
}
```

### Check Your Holdings

```typescript
// get-holdings.ts
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'

const client = new CryptoClient()

// Get all your crypto holdings
const holdings = await client.trading.getHoldings()

console.log('Your Crypto Holdings:')
if (holdings.results.length === 0) {
  console.log('No crypto holdings found')
} else {
  for (const holding of holdings.results) {
    if (parseFloat(holding.quantity) > 0) {
      console.log(`${holding.asset_code}: ${holding.quantity}`)
      if (holding.market_value) {
        console.log(`  Market Value: $${holding.market_value}`)
      }
    }
  }
}

// Get portfolio summary
const portfolio = await client.trading.getPortfolioSummary()
console.log('\nPortfolio Summary:')
console.log(`Total Value: $${portfolio.total_value}`)
console.log(`Cash: $${portfolio.cash_balance}`)
console.log(`Crypto: $${portfolio.crypto_value}`)
```

## Testing Your Setup

### Create a Comprehensive Test Script

```typescript
// setup-validation.ts
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'

async function validateSetup() {
  const tests = []
  
  try {
    const client = new CryptoClient()
    
    // Test 1: Client initialization
    tests.push({ name: 'Client Initialization', status: '✅' })
    
    // Test 2: Connectivity
    const status = await client.testClientConnections()
    tests.push({ 
      name: 'API Connectivity', 
      status: status.endpoints.account && status.endpoints.marketData ? '✅' : '❌',
      details: `Account: ${status.endpoints.account}, Market: ${status.endpoints.marketData}, Trading: ${status.endpoints.trading}`
    })
    
    // Test 3: Account access
    try {
      await client.account.getAccountDetails()
      tests.push({ name: 'Account Access', status: '✅' })
    } catch (error) {
      tests.push({ name: 'Account Access', status: '❌', error: error.message })
    }
    
    // Test 4: Market data access
    try {
      await client.marketData.getBestBidAsk(['BTC-USD'])
      tests.push({ name: 'Market Data Access', status: '✅' })
    } catch (error) {
      tests.push({ name: 'Market Data Access', status: '❌', error: error.message })
    }
    
    // Test 5: Trading endpoint access
    try {
      await client.trading.getTradingPairs(['BTC-USD'])
      tests.push({ name: 'Trading Data Access', status: '✅' })
    } catch (error) {
      tests.push({ name: 'Trading Data Access', status: '❌', error: error.message })
    }
    
    // Test 6: Rate limiting
    const rateLimitStatus = client.getRateLimiterStatus()
    tests.push({ 
      name: 'Rate Limiting', 
      status: '✅',
      details: `${rateLimitStatus.remainingRequests} requests remaining`
    })
    
  } catch (error) {
    tests.push({ name: 'Client Initialization', status: '❌', error: error.message })
  }
  
  // Print results
  console.log('🔍 Setup Validation Results')
  console.log('=' .repeat(40))
  
  for (const test of tests) {
    console.log(`${test.status} ${test.name}`)
    if (test.details) {
      console.log(`   ${test.details}`)
    }
    if (test.error) {
      console.log(`   Error: ${test.error}`)
    }
  }
  
  const passed = tests.filter(t => t.status === '✅').length
  const total = tests.length
  
  console.log(`\nResults: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your setup is ready.')
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.')
  }
}

if (import.meta.main) {
  validateSetup()
}
```

Run the validation:

```bash
deno run --allow-net --allow-env setup-validation.ts
```

## Common Patterns

### Safe API Calls with Error Handling

```typescript
import { 
  AuthenticationError, 
  RateLimitError, 
  ValidationError 
} from 'jsr:@albedosehen/robinhood-crypto-client'

async function safeApiCall() {
  const client = new CryptoClient()
  
  try {
    const account = await client.account.getAccountDetails()
    console.log('Success:', account.account_number)
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.log('Authentication failed - check your credentials')
    } else if (error instanceof RateLimitError) {
      console.log(`Rate limited - wait ${error.retryAfter} seconds`)
    } else if (error instanceof ValidationError) {
      console.log('Invalid request:', error.message)
    } else {
      console.log('Unexpected error:', error.message)
    }
  }
}
```

### Configuration for Different Environments

```typescript
// config.ts
export function createClientConfig(environment: 'development' | 'production') {
  const baseConfig = {
    apiKey: Deno.env.get('RH_CRYPTO_API_KEY')!,
    secretKey: Deno.env.get('RH_CRYPTO_SECRET_KEY')!
  }
  
  if (environment === 'development') {
    return {
      ...baseConfig,
      debug: true,
      timeout: 60000,
      rateLimit: {
        maxRequests: 50, // Conservative for development
        burstCapacity: 100,
        windowMs: 60000
      }
    }
  }
  
  return {
    ...baseConfig,
    debug: false,
    timeout: 30000
    // Use default rate limits for production
  }
}

// Usage
const client = new CryptoClient(createClientConfig('development'))
```

### Monitoring and Logging

```typescript
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'

function createMonitoredClient() {
  const client = new CryptoClient({ debug: true })
  
  // Log rate limit status before important operations
  const logRateLimit = () => {
    const status = client.getRateLimiterStatus()
    console.log(`Rate limit: ${status.remainingRequests} requests remaining`)
  }
  
  return { client, logRateLimit }
}

const { client, logRateLimit } = createMonitoredClient()

// Use before making API calls
logRateLimit()
const account = await client.account.getAccountDetails()
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Errors

**Problem**: `AuthenticationError: Invalid signature` or similar

**Solutions**:

- Verify your API key is correct
- Ensure private key is properly Base64 encoded
- Check that your account has API access enabled
- Verify system time is accurate (signatures are time-sensitive)

```typescript
// Test your credentials
const client = new CryptoClient({
  apiKey: 'test-key',
  secretKey: 'test-secret',
  debug: true // Enable to see detailed error messages
})
```

#### 2. Rate Limiting Issues

**Problem**: `RateLimitError: Too many requests`

**Solutions**:

- Implement retry logic with exponential backoff
- Reduce request frequency
- Use batch operations when possible

```typescript
async function retryableRequest<T>(operation: () => Promise<T>): Promise<T> {
  const maxRetries = 3
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof RateLimitError && attempt < maxRetries) {
        const delay = (error.retryAfter || 2 ** attempt) * 1000
        console.log(`Rate limited, waiting ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  
  throw new Error('Max retries exceeded')
}
```

#### 3. Network Connectivity Issues

**Problem**: `NetworkError: Connection timeout` or similar

**Solutions**:

- Check internet connection
- Verify firewall settings
- Try increasing timeout settings

```typescript
const client = new CryptoClient({
  timeout: 60000, // Increase timeout to 60 seconds
  debug: true
})
```

#### 4. Permission Errors

**Problem**: Access denied to certain endpoints

**Solutions**:

- Verify your account has the required permissions
- Check if your API application has the correct scopes
- Ensure your account is in good standing

### Debug Mode

Enable debug mode to see detailed request/response information:

```typescript
const client = new CryptoClient({
  debug: true // Enables detailed logging
})
```

### Environment Variable Issues

If environment variables aren't loading:

```typescript
// Manual verification
console.log('API Key:', Deno.env.get('RH_CRYPTO_API_KEY') ? 'Present' : 'Missing')
console.log('Secret Key:', Deno.env.get('RH_CRYPTO_SECRET_KEY') ? 'Present' : 'Missing')

// Load from specific file
import { load } from 'jsr:@std/dotenv'
const env = await load({ envPath: '.env.local' })
```

### Testing with Minimal Examples

Create minimal test cases to isolate issues:

```typescript
// minimal-test.ts
import { CryptoClient } from 'jsr:@albedosehen/robinhood-crypto-client'

try {
  const client = new CryptoClient()
  console.log('✅ Client created')
  
  const config = client.getConfiguration()
  console.log('✅ Configuration loaded')
  
  const baseUrl = client.getBaseUrl()
  console.log('✅ Base URL:', baseUrl)
  
} catch (error) {
  console.error('❌ Error:', error.message)
}
```

## Next Steps

Congratulations! You now have a working Robinhood Crypto Client setup. Here's what you can explore next:

### 1. Read More Documentation

- **[Usage Examples](examples.md)** - Comprehensive examples for all features
- **[API Reference](api-reference.md)** - Complete method documentation
- **[Advanced Topics](advanced.md)** - Rate limiting, authentication, error handling

### 2. Build Your First Application

Start with simple use cases:

- **Portfolio tracker** - Monitor your holdings and values
- **Price alerts** - Get notified when prices reach targets
- **Dollar-cost averaging** - Automate regular purchases

### 3. Production Considerations

Before deploying to production:

- Implement proper error handling and retry logic
- Set up monitoring and alerting
- Use secure credential management
- Test thoroughly with small amounts
- Implement proper logging and audit trails

### 4. Community and Support

- **GitHub Issues** - Report bugs and request features
- **Documentation** - Contribute to documentation improvements
- **Examples** - Share your use cases and examples

### 5. Security Best Practices

- Never commit credentials to version control
- Use environment variables or secure vaults
- Implement proper access controls
- Regularly rotate API keys
- Monitor API usage for anomalies

Happy trading! 🚀
