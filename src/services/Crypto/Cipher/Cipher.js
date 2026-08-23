// keySize is in bytes: 16 => AES-128, 32 => AES-256.
// V1/V2 must keep keySize 16 so already-stored data stays decryptable.
// V4 shares V3's KDF parameters; it marks the envelope record format, not a new KDF.
const V1 = { iterations: 10000, keySize: 16 }
const V2 = { ...V1, iterations: 600000 }
const V3 = { ...V2, keySize: 32 }
const V4 = { ...V3 }

const CURRENT_ENCRYPTION_VERSION = 4
const ENVELOPE_ENCRYPTION_VERSION = 4
const ENCRYPTION_VERSIONS = { 1: V1, 2: V2, 3: V3, 4: V4 }

const getVersionConfig = (version) => {
  const config = ENCRYPTION_VERSIONS[version]
  if (!config) throw new Error(`Unknown encryption version: ${version}`)
  return config
}

const IVSIZE = 12
const SALTSIZE = 16
const DEKSIZE = 32

const PASSKEY_KDF = 'HKDF-SHA256'

const contentAad = (field) => `mojito/v4/content/${field}`
const wrapperAad = (wrapperId) => `mojito/v4/dek/${wrapperId}`
const htlsAad = (hash) => `mojito/v4/htls/${hash}`
const PASSKEY_KEK_INFO = 'mojito/v1/passkey-kek'

const hexToBytes = (hexString) => {
  const pairs = hexString?.match(/.{1,2}/g)
  if (!pairs) return new Uint8Array()
  return Uint8Array.from(pairs.map((byte) => parseInt(byte, 16)))
}

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
  const { iterations, keySize } = getVersionConfig(version)
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
    keySize * 8,
  )
  const key = [...new Uint8Array(derivedBits)]

  return {
    key,
    salt: currentSalt,
  }
}

const generateIV = async () => crypto.getRandomValues(new Uint8Array(IVSIZE))

const gcmParams = (iv, aad) =>
  aad
    ? { name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(aad) }
    : { name: 'AES-GCM', iv }

const encryptAES = async ({ data, key, aad }) => {
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
    gcmParams(iv, aad),
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

const decryptAES = async ({ data, key, iv, tag, aad }) => {
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
      gcmParams(binaryStringToBytes(iv), aad),
      cryptoKey,
      combined,
    )
    return hexToBytes(new TextDecoder().decode(decrypted))
  } catch {
    throw new Error('Incorrect password')
  }
}

const generateDek = async () => [
  ...crypto.getRandomValues(new Uint8Array(DEKSIZE)),
]

const isKeyBytes = (key) =>
  (ArrayBuffer.isView(key) || Array.isArray(key)) &&
  key.length === DEKSIZE &&
  Array.prototype.every.call(
    key,
    (byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255,
  )

const assertKeySize = (key, message) => {
  if (!isKeyBytes(key)) throw new Error(message)
}

const deriveKekFromPrf = async (prfOutput) => {
  assertKeySize(prfOutput, 'Invalid PRF output')

  const ikm = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(prfOutput),
    'HKDF',
    false,
    ['deriveBits'],
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(),
      info: new TextEncoder().encode(PASSKEY_KEK_INFO),
    },
    ikm,
    DEKSIZE * 8,
  )

  return [...new Uint8Array(derivedBits)]
}

const wrapDek = async ({ dek, wrappingKey, aad }) => {
  assertKeySize(dek, 'Invalid data encryption key')
  assertKeySize(wrappingKey, 'Invalid wrapping key')
  return encryptAES({ data: new Uint8Array(dek), key: wrappingKey, aad })
}

const unwrapDek = async ({ data, iv, tag, wrappingKey, aad }) => {
  assertKeySize(wrappingKey, 'Invalid wrapping key')
  if (!data || !iv || !tag) throw new Error('Missing key wrapper')

  const dek = await decryptAES({ data, iv, tag, key: wrappingKey, aad })
  assertKeySize(dek, 'Invalid data encryption key')
  return [...dek]
}

export {
  IVSIZE,
  DEKSIZE,
  PASSKEY_KDF,
  contentAad,
  wrapperAad,
  htlsAad,
  CURRENT_ENCRYPTION_VERSION,
  ENVELOPE_ENCRYPTION_VERSION,
  ENCRYPTION_VERSIONS,
  generateDek,
  wrapDek,
  unwrapDek,
  deriveKekFromPrf,
  getVersionConfig,
  generateSalt,
  generatePBKDF2Key,
  generateIV,
  encryptAES,
  decryptAES,
  hexToBytes,
}
