# Robinhood Crypto Client

**A client library for the Robinhood Crypto API, providing access to trading, market data, and account management functionalities.**

## Basic Setup

```typescript
import { CryptoClient} from "jsr:@albedosehen/robinhood-crypto-client"

// Create the client
const client = new CryptoClient({
  apiKey: Deno.env.get('RH_CRYPTO_API_KEY') || '',
  secretKey: Deno.env.get('RH_CRYPTO_SECRET_KEY') || ''
})

// Test the connection
const enabled = await client.testClientConnections()

console.log('Enabled endpoints:', enabled)
// Output: { endpoints: { account: true, marketData: true, trading: false } }
```

## Support

This client is provided as-is. For support, please open an issue on GitHub. You assume all risks associated with using this library, including any financial risks related to trading operations.

---

## Contributing & Development

Contributions are welcome! If you find a bug or have a feature request, please open an issue on GitHub. Pull requests are also welcome!

### License

MIT License - see [LICENSE](LICENSE) for details.

---

[![Build Status](https://img.shields.io/badge/Build-passing-brightgreen.svg)](https://github.com/albedosehen/stoat) [![Deno Version](https://img.shields.io/badge/Deno-v2.4.1-green)](https://deno.land/x/stoat@v1.0.0) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
