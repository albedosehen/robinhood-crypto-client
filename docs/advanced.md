# Advanced Topics

This guide covers advanced features, internals, and best practices for the Robinhood Crypto Client. Intended for developers who need deep understanding of authentication, rate limiting, error handling, and performance optimization.

## Table of Contents

- [Authentication Deep Dive](#authentication-deep-dive)
- [Rate Limiting Internals](#rate-limiting-internals)
- [Error Handling Strategies](#error-handling-strategies)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)
- [Monitoring and Observability](#monitoring-and-observability)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Authentication Deep Dive

The Robinhood Crypto Client uses Ed25519 digital signatures for request authentication, providing strong cryptographic security.

### Ed25519 Signature Process

#### 1. Message Construction

Every API request creates a signature message in this exact format:

```text
{api_key}{timestamp}{path}{method}{body}
```

**Components:**

- `api_key`: Your public API key
- `timestamp`: Unix timestamp in seconds (integer)
- `path`: Request path including query parameters
- `method`: HTTP method (GET, POST, etc.)
- `body`: JSON request body (empty string for GET requests)

**Example:**

```text
robinhood-api-key1640995200/api/v1/crypto/trading/accounts/GET
```

#### 2. Signature Generation

The client uses the Ed25519 private key to sign the message. This is done using the Web Crypto API in modern browsers or Deno.

```typescript
async function signMessage(message: string, privateKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const messageBytes = encoder.encode(message)
  
  const signature = await crypto.subtle.sign(
    'Ed25519',
    privateKey,
    messageBytes
  )
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}
```

#### 3. Request Headers

The client adds these authentication headers to every request:

```json
{
  "x-api-key": "your-api-key",
  "x-signature": "base64-encoded-signature",
  "x-timestamp": "1640995200"
}
```

### Private Key Handling

#### Key Format Requirements

- **Algorithm**: Ed25519
- **Format**: Base64-encoded seed (32 bytes)
- **Encoding**: Standard Base64 (not URL-safe)

#### Converting from PEM Format

If you receive a PEM-formatted private key:

```typescript
function pemToBase64Seed(pemKey: string): string {
  // Remove PEM headers and whitespace
  const base64Der = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')
  
  // Parse DER format to extract the 32-byte seed
  const derBytes = Uint8Array.from(atob(base64Der), c => c.charCodeAt(0))
  
  // Ed25519 private key DER has the seed at bytes 16-47
  const seed = derBytes.slice(16, 48)
  
  return btoa(String.fromCharCode(...seed))
}
```

#### Security Considerations

Never expose the raw private key in logs or error messages. Always use secure storage mechanisms like environment variables or secure vaults.

```typescript
class SecureKeyManager {
  private privateKey: CryptoKey | null = null
  
  async loadFromEnvironment(): Promise<void> {
    const secretKey = Deno.env.get('RH_CRYPTO_SECRET_KEY')
    if (!secretKey) {
      throw new Error('RH_CRYPTO_SECRET_KEY not found')
    }
    
    try {
      // Convert Base64 to raw bytes
      const keyBytes = Uint8Array.from(atob(secretKey), c => c.charCodeAt(0))
      
      // Import as CryptoKey (never expose raw bytes)
      this.privateKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        'Ed25519',
        false,
        ['sign']
      )
    } catch (error) {
      throw new Error('Invalid private key format')
    }
  }
  
  // Never expose the raw key
  async sign(message: string): Promise<string> {
    if (!this.privateKey) {
      throw new Error('Private key not loaded')
    }
    
    const encoder = new TextEncoder()
    const signature = await crypto.subtle.sign(
      'Ed25519',
      this.privateKey,
      encoder.encode(message)
    )
    
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
  }
}
```

### Timestamp Validation

#### Server-Side Validation

Robinhood validates timestamps within a **30-second window**:

```typescript
const now = Math.floor(Date.now() / 1000)
const requestTimestamp = parseInt(timestampHeader)

if (Math.abs(now - requestTimestamp) > 30) {
  throw new Error('Request timestamp outside valid window')
}
```

#### Client-Side Best Practices

Use a fresh timestamp for each request to avoid clock skew issues. Implement a tolerance for minor clock differences.

```typescript
class TimestampManager {
  private static readonly CLOCK_SKEW_TOLERANCE = 5 // seconds
  
  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000)
  }
  
  static isTimestampValid(timestamp: number): boolean {
    const now = this.getCurrentTimestamp()
    const age = now - timestamp
    return age >= 0 && age <= (30 - this.CLOCK_SKEW_TOLERANCE)
  }
  
  // Ensure fresh timestamp for each request
  static getFreshTimestamp(): number {
    return this.getCurrentTimestamp()
  }
}
```

## Rate Limiting Internals

The client implements a **token bucket algorithm** with exponential backoff for robust rate limiting.

### Token Bucket

#### Core Algorithm

```typescript
class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number // tokens per second
  
  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity
    this.refillRate = refillRate
    this.tokens = capacity
    this.lastRefill = Date.now()
  }
  
  private refill(): void {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    
    const tokensToAdd = elapsed * this.refillRate
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
  
  consume(tokens: number = 1): boolean {
    this.refill()
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }
    
    return false
  }
  
  getStatus(): { remainingTokens: number; resetTime: number } {
    this.refill()
    
    const timeToFull = (this.capacity - this.tokens) / this.refillRate * 1000
    
    return {
      remainingTokens: Math.floor(this.tokens),
      resetTime: Date.now() + timeToFull
    }
  }
}
```

#### Default Configuration

Set the default rate limit configuration for the client:

```typescript
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,     // Maximum requests per minute
  burstCapacity: 300,   // Burst allowance
  windowMs: 60000       // 1-minute window
}

const tokensPerSecond = maxRequests / (windowMs / 1000) // 100/60 = 1.67 tokens/sec
const bucketCapacity = burstCapacity // 300 tokens
```

### Advanced Rate Limiting Strategies

#### Per-Endpoint Rate Limiting

You can implement different rate limits for different API endpoints based on their usage patterns. This allows more conservative limits for critical operations like trading, while allowing higher limits for read-only data.

```typescript
class PerEndpointRateLimiter {
  private buckets = new Map<string, TokenBucket>()
  
  private getBucket(endpoint: string): TokenBucket {
    if (!this.buckets.has(endpoint)) {
      const config = this.getEndpointConfig(endpoint)
      this.buckets.set(endpoint, new TokenBucket(config.capacity, config.rate))
    }
    
    return this.buckets.get(endpoint)!
  }
  
  private getEndpointConfig(endpoint: string): { capacity: number; rate: number } {
    if (endpoint.includes('/trading/orders')) {
      return { capacity: 50, rate: 0.5 }
    } else if (endpoint.includes('/marketdata/')) {
      return { capacity: 200, rate: 2.0 }
    } else {
      return { capacity: 100, rate: 1.0 }
    }
  }
  
  async checkRateLimit(endpoint: string): Promise<void> {
    const bucket = this.getBucket(endpoint)
    
    if (!bucket.consume()) {
      const status = bucket.getStatus()
      const retryAfter = Math.ceil((status.resetTime - Date.now()) / 1000)
      throw new RateLimitError(`Rate limit exceeded for ${endpoint}`, retryAfter)
    }
  }
}
```

#### Adaptive Rate Limiting

Adaptive rate limiting adjusts the request rate based on the success rate of previous requests. This allows the client to dynamically adapt to changing network conditions or API limits.

```typescript
class AdaptiveRateLimiter {
  private successRate = 1.0
  private adjustmentFactor = 1.0
  
  onSuccess(): void {
    this.successRate = this.successRate * 0.95 + 0.05 // Exponential moving average
    
    if (this.successRate > 0.95) {
      this.adjustmentFactor = Math.min(2.0, this.adjustmentFactor * 1.1)
    }
  }
  
  onError(error: Error): void {
    if (error instanceof RateLimitError) {
      this.successRate = this.successRate * 0.95 + 0.0
      this.adjustmentFactor = Math.max(0.1, this.adjustmentFactor * 0.5)
    }
  }
  
  getAdjustedRate(baseRate: number): number {
    return baseRate * this.adjustmentFactor
  }
}
```

### Exponential Backoff Implementation

The client uses an exponential backoff strategy to handle rate limit errors and transient failures. This helps avoid being throttled by the service during failures.

```typescript
class ExponentialBackoff {
  private readonly baseDelay: number
  private readonly maxDelay: number
  private readonly maxRetries: number
  private readonly jitterFactor: number
  
  constructor(options: {
    baseDelay?: number
    maxDelay?: number
    maxRetries?: number
    jitterFactor?: number
  } = {}) {
    this.baseDelay = options.baseDelay ?? 1000
    this.maxDelay = options.maxDelay ?? 60000
    this.maxRetries = options.maxRetries ?? 5
    this.jitterFactor = options.jitterFactor ?? 0.1
  }
  
  calculateDelay(attempt: number): number {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt)
    const clampedDelay = Math.min(exponentialDelay, this.maxDelay)
    
    // Add jitter to prevent thundering herd
    const jitter = clampedDelay * this.jitterFactor * Math.random()
    
    return clampedDelay + jitter
  }
  
  async executeWithBackoff<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: Error) => boolean = () => true
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (!shouldRetry(lastError) || attempt === this.maxRetries - 1) {
          throw lastError
        }
        
        const delay = this.calculateDelay(attempt)
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message)
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
  }
}
```

## Error Handling Strategies

Error handling is up to you. Here are how it is implemented in this client.

### Error Classification and Response

Classify errors based on their type and severity to determine the appropriate response action. This allows for more granular error handling strategies.

```typescript
class ErrorClassifier {
  static classifyError(error: unknown): {
    type: 'retryable' | 'non-retryable' | 'rate-limit'
    severity: 'low' | 'medium' | 'high'
    action: 'retry' | 'abort' | 'escalate'
  } {
    if (error instanceof RateLimitError) {
      return { type: 'rate-limit', severity: 'medium', action: 'retry' }
    }
    
    if (error instanceof NetworkError) {
      return { type: 'retryable', severity: 'medium', action: 'retry' }
    }
    
    if (error instanceof AuthenticationError) {
      return { type: 'non-retryable', severity: 'high', action: 'escalate' }
    }
    
    if (error instanceof ValidationError) {
      return { type: 'non-retryable', severity: 'low', action: 'abort' }
    }
    
    return { type: 'retryable', severity: 'medium', action: 'retry' }
  }
}
```

### Circuit Breaker Pattern

The circuit breaker pattern prevents the client from making requests to an endpoint that is known to be failing, allowing it to recover gracefully.

```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private failureCount = 0
  private lastFailureTime = 0
  private readonly failureThreshold: number
  private readonly timeoutDuration: number
  
  constructor(failureThreshold = 5, timeoutDuration = 60000) {
    this.failureThreshold = failureThreshold
    this.timeoutDuration = timeoutDuration
  }
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.timeoutDuration) {
        throw new Error('Circuit breaker is open')
      }
      this.state = 'half-open'
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0
    this.state = 'closed'
  }
  
  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open'
    }
  }
}
```

### Comprehensive Error Recovery

The error recovery manager combines exponential backoff and circuit breaker patterns to handle errors effectively. It retries operations based on error classification and context.

```typescript
class ErrorRecoveryManager {
  private readonly backoff = new ExponentialBackoff()
  private readonly circuitBreaker = new CircuitBreaker()
  
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: { endpoint: string; critical: boolean }
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return this.backoff.executeWithBackoff(
        operation,
        (error) => this.shouldRetry(error, context)
      )
    })
  }
  
  private shouldRetry(error: Error, context: { endpoint: string; critical: boolean }): boolean {
    const classification = ErrorClassifier.classifyError(error)
    
    // Never retry authentication errors
    if (error instanceof AuthenticationError) {
      return false
    }
    
    // Always retry rate limits (with backoff)
    if (error instanceof RateLimitError) {
      return true
    }
    
    // Retry network errors for critical operations
    if (error instanceof NetworkError && context.critical) {
      return true
    }
    
    // Don't retry validation errors
    if (error instanceof ValidationError) {
      return false
    }
    
    return classification.type === 'retryable'
  }
}
```

## Performance Optimization

Performance optimization is crucial for building a responsive and efficient client. Here are some advanced techniques to improve performance.

### Connection Pooling and Reuse

```typescript
class ConnectionManager {
  private static instance: ConnectionManager
  private connectionPool = new Map<string, Connection>()
  
  static getInstance(): ConnectionManager {
    if (!this.instance) {
      this.instance = new ConnectionManager()
    }
    return this.instance
  }
  
  async getConnection(baseUrl: string): Promise<Connection> {
    const existing = this.connectionPool.get(baseUrl)
    if (existing && existing.isAlive()) {
      return existing
    }
    
    const connection = new Connection(baseUrl)
    await connection.initialize()
    this.connectionPool.set(baseUrl, connection)
    return connection
  }
}
```

### Request Batching

```typescript
class RequestBatcher {
  private pendingRequests = new Map<string, Promise<any>>()
  
  async batchRequest<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // Deduplicate identical requests
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }
    
    const promise = operation().finally(() => {
      this.pendingRequests.delete(key)
    })
    
    this.pendingRequests.set(key, promise)
    return promise
  }
  
  // Batch multiple symbol requests
  async batchMarketData(symbols: string[]): Promise<Map<string, any>> {
    const MAX_BATCH_SIZE = 50
    const results = new Map()
    
    for (let i = 0; i < symbols.length; i += MAX_BATCH_SIZE) {
      const batch = symbols.slice(i, i + MAX_BATCH_SIZE)
      const batchResults = await this.batchRequest(
        `market-data-${batch.join(',')}`,
        () => this.fetchMarketDataBatch(batch)
      )
      
      for (const [symbol, data] of batchResults.entries()) {
        results.set(symbol, data)
      }
    }
    
    return results
  }
}
```

### Caching Strategies

```typescript
class ResponseCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  
  set(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    })
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  // Smart caching based on endpoint type
  getCacheTTL(endpoint: string): number {
    if (endpoint.includes('/marketdata/')) {
      return 5000 // 5 seconds for market data
    } else if (endpoint.includes('/trading/pairs')) {
      return 300000 // 5 minutes for trading pairs
    } else if (endpoint.includes('/account/')) {
      return 30000 // 30 seconds for account data
    }
    return 0 // No caching by default
  }
}
```

## Security Best Practices

### Credential Security

```typescript
class SecureCredentialManager {
  private credentials: Map<string, string> = new Map()
  
  // Load from secure sources only
  async loadCredentials(): Promise<void> {
    // Method 1: Environment variables
    const apiKey = Deno.env.get('RH_CRYPTO_API_KEY')
    const secretKey = Deno.env.get('RH_CRYPTO_SECRET_KEY')
    
    if (apiKey && secretKey) {
      this.setCredentials(apiKey, secretKey)
      return
    }
    
    // Method 2: Secure file (with proper permissions)
    try {
      const credFile = await Deno.readTextFile('.credentials')
      const creds = JSON.parse(credFile)
      this.setCredentials(creds.apiKey, creds.secretKey)
    } catch {
      throw new Error('No credentials found')
    }
  }
  
  private setCredentials(apiKey: string, secretKey: string): void {
    // Validate format before storing
    if (!this.validateCredentials(apiKey, secretKey)) {
      throw new Error('Invalid credential format')
    }
    
    this.credentials.set('apiKey', apiKey)
    this.credentials.set('secretKey', secretKey)
  }
  
  private validateCredentials(apiKey: string, secretKey: string): boolean {
    // API key format validation
    if (!/^[a-zA-Z0-9]{32,}$/.test(apiKey)) {
      return false
    }
    
    // Secret key should be valid Base64
    try {
      const decoded = atob(secretKey)
      return decoded.length === 32 // Ed25519 seed is 32 bytes
    } catch {
      return false
    }
  }
  
  // Never log or expose credentials
  getCredentials(): { apiKey: string; secretKey: string } | null {
    const apiKey = this.credentials.get('apiKey')
    const secretKey = this.credentials.get('secretKey')
    
    if (!apiKey || !secretKey) {
      return null
    }
    
    return { apiKey, secretKey }
  }
  
  // Secure cleanup
  destroy(): void {
    this.credentials.clear()
  }
}
```

### Request Integrity

```typescript
class RequestIntegrityManager {
  // Validate request before signing
  validateRequest(request: RequestOptions): void {
    // Check for suspicious patterns
    if (this.containsSuspiciousContent(request)) {
      throw new SecurityError('Request contains suspicious content')
    }
    
    // Validate parameter formats
    this.validateParameters(request)
    
    // Check for replay attack indicators
    this.checkReplayAttack(request)
  }
  
  private containsSuspiciousContent(request: RequestOptions): boolean {
    const suspicious = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /eval\(/i
    ]
    
    const requestStr = JSON.stringify(request)
    return suspicious.some(pattern => pattern.test(requestStr))
  }
  
  private validateParameters(request: RequestOptions): void {
    if (request.body) {
      // Validate JSON structure
      try {
        JSON.parse(JSON.stringify(request.body))
      } catch {
        throw new ValidationError('Invalid request body format')
      }
    }
    
    // Validate path
    if (!/^\/api\/v\d+\//.test(request.path)) {
      throw new ValidationError('Invalid API path format')
    }
  }
  
  private checkReplayAttack(request: RequestOptions): void {
    const timestamp = Math.floor(Date.now() / 1000)
    
    // Requests must be recent
    if (request.timestamp && Math.abs(timestamp - request.timestamp) > 30) {
      throw new SecurityError('Request timestamp too old')
    }
  }
}
```

## Monitoring and Observability

### Metrics Collection

```typescript
class MetricsCollector {
  private metrics = new Map<string, number>()
  private timings = new Map<string, number[]>()
  
  incrementCounter(metric: string, value = 1): void {
    this.metrics.set(metric, (this.metrics.get(metric) || 0) + value)
  }
  
  recordTiming(metric: string, durationMs: number): void {
    if (!this.timings.has(metric)) {
      this.timings.set(metric, [])
    }
    this.timings.get(metric)!.push(durationMs)
  }
  
  recordAPICall(endpoint: string, method: string, statusCode: number, durationMs: number): void {
    this.incrementCounter(`api.calls.total`)
    this.incrementCounter(`api.calls.${method.toLowerCase()}`)
    this.incrementCounter(`api.calls.status.${statusCode}`)
    this.recordTiming(`api.duration.${endpoint}`, durationMs)
    
    if (statusCode >= 400) {
      this.incrementCounter(`api.errors.total`)
      this.incrementCounter(`api.errors.${endpoint}`)
    }
  }
  
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    
    // Copy counters
    for (const [key, value] of this.metrics) {
      result[key] = value
    }
    
    // Calculate timing percentiles
    for (const [key, values] of this.timings) {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b)
        result[`${key}.p50`] = this.percentile(sorted, 0.5)
        result[`${key}.p95`] = this.percentile(sorted, 0.95)
        result[`${key}.p99`] = this.percentile(sorted, 0.99)
        result[`${key}.avg`] = values.reduce((a, b) => a + b, 0) / values.length
      }
    }
    
    return result
  }
  
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[index]
  }
}
```

### Health Monitoring

```typescript
class HealthMonitor {
  private readonly metrics = new MetricsCollector()
  private readonly alertThresholds = {
    errorRate: 0.05, // 5% error rate
    avgLatency: 5000, // 5 second average latency
    p99Latency: 10000 // 10 second 99th percentile
  }
  
  async checkHealth(): Promise<HealthStatus> {
    const metrics = this.metrics.getMetrics()
    const issues: string[] = []
    
    // Check error rate
    const totalCalls = metrics['api.calls.total'] || 0
    const totalErrors = metrics['api.errors.total'] || 0
    const errorRate = totalCalls > 0 ? totalErrors / totalCalls : 0
    
    if (errorRate > this.alertThresholds.errorRate) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`)
    }
    
    // Check latency
    const avgLatency = metrics['api.duration.avg'] || 0
    const p99Latency = metrics['api.duration.p99'] || 0
    
    if (avgLatency > this.alertThresholds.avgLatency) {
      issues.push(`High average latency: ${avgLatency}ms`)
    }
    
    if (p99Latency > this.alertThresholds.p99Latency) {
      issues.push(`High P99 latency: ${p99Latency}ms`)
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : 'degraded',
      issues,
      metrics: {
        errorRate: errorRate * 100,
        avgLatency,
        p99Latency,
        totalCalls,
        totalErrors
      }
    }
  }
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  issues: string[]
  metrics: Record<string, number>
}
```

## Production Deployment

### Production Configuration

```typescript
class ProductionConfig {
  static createProductionClient(): CryptoClient {
    return new CryptoClient({
      // Load from secure credential store
      apiKey: this.getSecureCredential('RH_CRYPTO_API_KEY'),
      secretKey: this.getSecureCredential('RH_CRYPTO_SECRET_KEY'),
      
      // Production settings
      debug: false,
      timeout: 30000,
      
      // Conservative rate limiting
      rateLimit: {
        maxRequests: 80, // 20% buffer below API limit
        burstCapacity: 200,
        windowMs: 60000
      }
    })
  }
  
  private static getSecureCredential(key: string): string {
    const value = Deno.env.get(key)
    if (!value) {
      throw new Error(`Required credential ${key} not found`)
    }
    return value
  }
}
```

### Deployment Checklist

#### Pre-Deployment

- [ ] **Credentials secured** in environment variables or secure vault
- [ ] **Rate limiting tested** under expected load
- [ ] **Error handling validated** with comprehensive test scenarios
- [ ] **Monitoring configured** with appropriate alerts
- [ ] **Logging implemented** with sensitive data sanitization
- [ ] **Health checks enabled** for service monitoring

#### Post-Deployment

- [ ] **Monitor error rates** and latency metrics
- [ ] **Verify rate limiting** is working correctly
- [ ] **Test failover scenarios** and error recovery
- [ ] **Validate security** with penetration testing
- [ ] **Document runbooks** for common operational tasks

## Troubleshooting

### Performance Issues

#### High Latency

**Symptoms**: Slow API responses, timeouts

**Diagnosis**:

```typescript
// Monitor request timing
const start = performance.now()
try {
  const result = await client.account.getAccountDetails()
  const duration = performance.now() - start
  console.log(`Request took ${duration}ms`)
} catch (error) {
  console.log(`Request failed after ${performance.now() - start}ms`)
}
```

**Solutions**:

- Increase timeout settings
- Implement connection pooling
- Use request caching for static data
- Monitor network connectivity

#### Rate Limiting Issues

**Symptoms**: Frequent `RateLimitError` exceptions

**Diagnosis**:

```typescript
const status = client.getRateLimiterStatus()
console.log('Rate limit status:', status)

// Monitor over time
setInterval(() => {
  const current = client.getRateLimiterStatus()
  console.log(`Remaining: ${current.remainingRequests}`)
}, 5000)
```

**Solutions**:

- Reduce request frequency
- Implement request batching
- Use exponential backoff
- Consider per-endpoint rate limiting

### Security Issues

#### Authentication Failures

**Symptoms**: `AuthenticationError` on all requests

**Diagnosis**:

```typescript
// Validate credential format
const config = client.getConfiguration()
console.log('API Key format:', /^[a-zA-Z0-9]{32,}$/.test(config.apiKey))

// Test timestamp accuracy
const timestamp = Math.floor(Date.now() / 1000)
console.log('System time:', new Date(timestamp * 1000).toISOString())
```

**Solutions**:

- Verify API key and secret key format
- Check system clock synchronization
- Ensure account has API access enabled
- Validate private key conversion from PEM

#### Signature Validation Errors

**Symptoms**: Intermittent authentication failures

**Diagnosis**:

```typescript
// Enable debug mode to see signature details
const debugClient = new CryptoClient({ debug: true })
```

**Solutions**:

- Verify Ed25519 key format is correct
- Check for clock skew between client and server
- Ensure request body is properly formatted
- Validate URL encoding and special characters

This advanced documentation provides deep insights into the Robinhood Crypto Client's internals, enabling developers to optimize performance, implement robust error handling, and deploy secure, production-ready applications.
