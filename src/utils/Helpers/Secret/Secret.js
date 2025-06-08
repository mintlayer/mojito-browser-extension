import { createHash } from 'crypto-browserify'

/**
 * Generate a cryptographically secure random secret
 * @returns {Uint8Array} 32-byte random secret
 */
export const generateSecret = () => {
  return crypto.getRandomValues(new Uint8Array(32))
}

/**
 * Generate secret hash using SHA256 + RIPEMD160 (same as GenerateSecret component)
 * @param {Uint8Array} secret - The secret to hash
 * @returns {Uint8Array} The hashed secret
 */
export const generateSecretHash = (secret) => {
  const sha256 = createHash('sha256').update(secret).digest()
  const ripemd160 = createHash('ripemd160').update(sha256).digest()
  return ripemd160
}

/**
 * Convert secret to hex string
 * @param {Uint8Array} secret - The secret to convert
 * @returns {string} Hex representation of the secret
 */
export const secretToHex = (secret) => {
  return Buffer.from(secret).toString('hex')
}

/**
 * Convert hex string to secret
 * @param {string} hexString - Hex string to convert
 * @returns {Uint8Array} The secret as Uint8Array
 */
export const hexToSecret = (hexString) => {
  return new Uint8Array(Buffer.from(hexString, 'hex'))
}

/**
 * Validate if a hex string is a valid secret format
 * @param {string} hexString - Hex string to validate
 * @returns {boolean} True if valid secret format
 */
export const validateSecretHex = (hexString) => {
  if (!hexString || typeof hexString !== 'string') {
    return false
  }

  // Remove any whitespace
  const cleanHex = hexString.trim()

  // Check if it's valid hex and correct length (64 characters for 32 bytes)
  const hexRegex = /^[0-9a-fA-F]{64}$/
  return hexRegex.test(cleanHex)
}

/**
 * Generate a complete secret object with secret, hash, and hex representations
 * @returns {Object} Object containing secret, hash, and hex representations
 */
export const generateSecretObject = () => {
  const secret = generateSecret()
  const secretHash = generateSecretHash(secret)

  return {
    secret,
    secretHash,
    secretHex: secretToHex(secret),
    secretHashHex: secretToHex(secretHash),
  }
}

/**
 * Create secret object from existing hex string
 * @param {string} secretHex - Hex string of the secret
 * @returns {Object|null} Object containing secret, hash, and hex representations, or null if invalid
 */
export const createSecretObjectFromHex = (secretHex) => {
  if (!validateSecretHex(secretHex)) {
    return null
  }

  const secret = hexToSecret(secretHex)
  const secretHash = generateSecretHash(secret)

  return {
    secret,
    secretHash,
    secretHex: secretHex.toLowerCase(),
    secretHashHex: secretToHex(secretHash),
  }
}
