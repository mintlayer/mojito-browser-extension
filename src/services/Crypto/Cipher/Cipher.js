const DEFAULT_ITERATIONS = 600000
const LEGACY_ITERATIONS = 10000
const KEYSIZE = 16
const IVSIZE = 12
const SALTSIZE = 16

const hexToBytes = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

const generateSalt = async (bytesAmount) => {
  const bytes = new Uint8Array(bytesAmount)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const generatePBKDF2Key = async ({
  password,
  salt,
  iterations = DEFAULT_ITERATIONS,
}) => {
  const currentSalt = salt || (await generateSalt(SALTSIZE))
  const encoder = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(currentSalt),
      iterations,
      hash: 'SHA-512',
    },
    baseKey,
    KEYSIZE * 8,
  )
  const key = [...new Uint8Array(derivedBits)]

  return {
    key,
    salt: currentSalt,
  }
}

const generateIV = async () => crypto.getRandomValues(new Uint8Array(IVSIZE))

const binaryStringToBytes = (str) =>
  new Uint8Array([...str].map((c) => c.charCodeAt(0)))

const bytesToBinaryString = (bytes) => String.fromCharCode(...bytes)

const encryptAES = async ({ data, key }) => {
  const iv = await generateIV()
  const hex = Buffer.from(data).toString('hex')

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(key),
    'AES-GCM',
    false,
    ['encrypt'],
  )

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    new TextEncoder().encode(hex),
  )

  const result = new Uint8Array(encrypted)
  return {
    encryptedData: bytesToBinaryString(result.slice(0, -16)),
    iv: bytesToBinaryString(iv),
    tag: bytesToBinaryString(result.slice(-16)),
  }
}

const decryptAES = async ({ data, key, iv, tag }) => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(key),
    'AES-GCM',
    false,
    ['decrypt'],
  )

  const dataBytes = binaryStringToBytes(data)
  const tagBytes = binaryStringToBytes(tag)
  const combined = new Uint8Array(dataBytes.length + tagBytes.length)
  combined.set(dataBytes)
  combined.set(tagBytes, dataBytes.length)

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: binaryStringToBytes(iv) },
      cryptoKey,
      combined,
    )
    return hexToBytes(new TextDecoder().decode(decrypted))
  } catch {
    throw new Error('Incorrect password')
  }
}

export {
  IVSIZE,
  DEFAULT_ITERATIONS,
  LEGACY_ITERATIONS,
  generateSalt,
  generatePBKDF2Key,
  generateIV,
  encryptAES,
  decryptAES,
  hexToBytes,
}
