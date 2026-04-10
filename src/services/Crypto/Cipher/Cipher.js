const V1 = { iterations: 10000 }
const V2 = { ...V1, iterations: 600000 }

const CURRENT_ENCRYPTION_VERSION = 2
const ENCRYPTION_VERSIONS = { 1: V1, 2: V2 }

const getVersionConfig = (version) => {
  const config = ENCRYPTION_VERSIONS[version]
  if (!config) throw new Error(`Unknown encryption version: ${version}`)
  return config
}

const KEYSIZE = 16
const IVSIZE = 12
const SALTSIZE = 16

const hexToBytes = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

const binaryStringToBytes = (str) =>
  new Uint8Array([...str].map((c) => c.charCodeAt(0)))

const bytesToBinaryString = (bytes) => String.fromCharCode(...bytes)

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
  version = CURRENT_ENCRYPTION_VERSION,
}) => {
  const { iterations } = getVersionConfig(version)
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
  CURRENT_ENCRYPTION_VERSION,
  ENCRYPTION_VERSIONS,
  getVersionConfig,
  generateSalt,
  generatePBKDF2Key,
  generateIV,
  encryptAES,
  decryptAES,
  hexToBytes,
}
