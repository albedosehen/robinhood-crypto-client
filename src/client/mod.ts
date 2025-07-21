/**
 * Client module exports for the Robinhood Crypto Client
 * @module
 */

export { CryptoClient } from './crypto.ts'

export {
  base64ToUint8Array,
  createSignatureMessage,
  getCurrentTimestamp,
  importEd25519PrivateKey,
  isTimestampValid,
  sanitizeErrorMessage,
  signMessage,
  uint8ArrayToBase64,
  validateApiKey,
} from './crypto-helpers.ts'

export {
  HttpClient,
  type HttpClientConfig,
  type HttpResponse,
  type RequestInterceptor,
  type ResponseInterceptor,
} from './httpClient.ts'
