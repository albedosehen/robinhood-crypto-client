/**
 * Cryptographic helper functions for Ed25519 signing
 * @module
 */

import { SignatureError } from '../errors/mod.ts'

/**
 * Convert a base64 string to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    // Remove any whitespace and validate base64 format
    const cleanBase64 = base64.replace(/\s/g, '')
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      throw new Error('Invalid base64 format')
    }

    const binaryString = globalThis.atob(cleanBase64)
    const bytes = new Uint8Array(binaryString.length)

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return bytes
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new SignatureError(`Failed to decode base64 string: ${message}`)
  }
}

/**
 * Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  try {
    let binaryString = ''
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i])
    }
    return globalThis.btoa(binaryString)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new SignatureError(`Failed to encode to base64: ${message}`)
  }
}

/**
 * Import Ed25519 private key from base64-encoded seed
 */
export async function importEd25519PrivateKey(base64Seed: string): Promise<CryptoKey> {
  try {
    const seed = base64ToUint8Array(base64Seed)

    // Ed25519 seed should be 32 bytes
    if (seed.length !== 32) {
      throw new Error(`Invalid Ed25519 seed length: expected 32 bytes, got ${seed.length}`)
    }

    const privateKey = await globalThis.crypto.subtle.importKey(
      'raw',
      seed,
      'Ed25519',
      false, // extractable
      ['sign'],
    )

    return privateKey
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new SignatureError(`Failed to import Ed25519 private key: ${message}`)
  }
}

/**
 * Sign a message with Ed25519 private key
 */
export async function signMessage(privateKey: CryptoKey, message: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const messageBytes = encoder.encode(message)

    const signature = await globalThis.crypto.subtle.sign(
      'Ed25519',
      privateKey,
      messageBytes,
    )

    return uint8ArrayToBase64(new Uint8Array(signature))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new SignatureError(`Failed to sign message: ${message}`)
  }
}

/**
 * Generate current Unix timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Validate timestamp is within acceptable range (30 seconds)
 */
export function isTimestampValid(timestamp: number, maxAgeSeconds = 30): boolean {
  const now = getCurrentTimestamp()
  const age = now - timestamp
  return age >= 0 && age <= maxAgeSeconds
}

/**
 * Create the message to sign for API authentication
 * Format: {api_key}{timestamp}{path}{method}{body}
 */
export function createSignatureMessage({
  apiKey,
  timestamp,
  path,
  method,
  body = '',
}: {
  apiKey: string
  timestamp: number
  path: string
  method: string
  body?: string
}): string {
  // Ensure consistent formatting
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const normalizedMethod = method.toUpperCase()
  const normalizedBody = typeof body === 'string' ? body : JSON.stringify(body)

  return `${apiKey}${timestamp}${normalizedPath}${normalizedMethod}${normalizedBody}`
}

/**
 * Validate API key format (should start with 'rh-api-' for newer keys)
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }

  // Support both old format and new format (rh-api-{uuid})
  const newFormatRegex = /^rh-api-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const oldFormatRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  return newFormatRegex.test(apiKey) || oldFormatRegex.test(apiKey)
}

/**
 * Sanitize error messages to prevent key leakage
 */
export function sanitizeErrorMessage(message: string, sensitiveData: string[]): string {
  let sanitized = message

  for (const sensitive of sensitiveData) {
    if (sensitive && sensitive.trim().length > 0) {
      if (sensitive.length <= 4) {
        // Short strings get replaced with just "***"
        sanitized = sanitized.replace(new RegExp(sensitive, 'g'), '***')
      } else {
        // Longer strings: first 2 chars + "***" + last 2 chars
        const masked = sensitive.substring(0, 2) + '***' + sensitive.substring(sensitive.length - 2)
        sanitized = sanitized.replace(new RegExp(sensitive, 'g'), masked)
      }
    }
  }

  return sanitized
}
