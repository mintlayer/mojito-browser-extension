import { ML, Cipher, BTC } from '@Cryptos'
import { AppInfo } from '@Constants'
import initWasm from 'src/tests/helpers/initWasm'
import {
  getEnvelopeEncryptedPrivateKeys,
  getEncryptedHtlsSecret,
} from './AccountHelpers'

const MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
const PASSWORD = 'MyStr0ng!Pass'

beforeAll(() => initWasm())

const unwrapWith = (envelope, wrappingKey) =>
  Cipher.unwrapDek({
    data: envelope.wrappedDek.password.encryptedData,
    iv: envelope.wrappedDek.password.iv,
    tag: envelope.wrappedDek.password.tag,
    wrappingKey,
    aad: Cipher.wrapperAad('password'),
  })

const decryptWith = (data, iv, tag, key, field) =>
  Cipher.decryptAES({
    data,
    iv,
    tag,
    key,
    aad: field ? Cipher.contentAad(field) : undefined,
  })

const deriveWrappingKey = (
  salt,
  version = Cipher.ENVELOPE_ENCRYPTION_VERSION,
) => Cipher.generatePBKDF2Key({ password: PASSWORD, salt, version })

test('AccountHelpers - envelope has the v4 shape', async () => {
  const envelope = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    undefined,
    MNEMONIC,
  )

  expect(envelope.encryptionVersion).toBe(Cipher.ENVELOPE_ENCRYPTION_VERSION)
  expect(envelope.salt).toMatch(/^[0-9a-f]{32}$/)

  expect(Object.keys(envelope.wrappedDek)).toStrictEqual([
    'password',
    'passkeys',
  ])
  expect(envelope.wrappedDek.passkeys).toStrictEqual([])
  expect(Object.keys(envelope.wrappedDek.password)).toStrictEqual([
    'encryptedData',
    'iv',
    'tag',
  ])
  expect(envelope.wrappedDek.password.iv.length).toBe(Cipher.IVSIZE)
  expect(envelope.wrappedDek.password.tag.length).toBe(16)

  const blobs = [
    'btcEncryptedSeed',
    'encryptedMlTestnetPrivateKey',
    'encryptedMlMainnetPrivateKey',
    'btcIv',
    'mlTestnetPrivKeyIv',
    'mlMainnetPrivKeyIv',
    'btcTag',
    'mlTestnetPrivKeyTag',
    'mlMainnetPrivKeyTag',
  ]
  blobs.forEach((field) => expect(typeof envelope[field]).toBe('string'))
})

test('AccountHelpers - the DEK decrypts every stored blob', async () => {
  const envelope = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    undefined,
    MNEMONIC,
  )

  const { key: wrappingKey } = await deriveWrappingKey(envelope.salt)
  const dek = await unwrapWith(envelope, wrappingKey)

  expect(dek.length).toBe(Cipher.DEKSIZE)

  const seed = await decryptWith(
    envelope.btcEncryptedSeed,
    envelope.btcIv,
    envelope.btcTag,
    dek,
    'btcEncryptedSeed',
  )
  const testnetKey = await decryptWith(
    envelope.encryptedMlTestnetPrivateKey,
    envelope.mlTestnetPrivKeyIv,
    envelope.mlTestnetPrivKeyTag,
    dek,
    'encryptedMlTestnetPrivateKey',
  )
  const mainnetKey = await decryptWith(
    envelope.encryptedMlMainnetPrivateKey,
    envelope.mlMainnetPrivKeyIv,
    envelope.mlMainnetPrivKeyTag,
    dek,
    'encryptedMlMainnetPrivateKey',
  )

  const expectedSeed = await BTC.getSeedFromMnemonic(MNEMONIC)
  const expectedTestnetKey = ML.getPrivateKeyFromMnemonic(
    MNEMONIC,
    AppInfo.NETWORK_TYPES.TESTNET,
  )
  const expectedMainnetKey = ML.getPrivateKeyFromMnemonic(
    MNEMONIC,
    AppInfo.NETWORK_TYPES.MAINNET,
  )

  expect(Buffer.from(seed)).toStrictEqual(Buffer.from(expectedSeed))
  expect(Buffer.from(testnetKey)).toStrictEqual(Buffer.from(expectedTestnetKey))
  expect(Buffer.from(mainnetKey)).toStrictEqual(Buffer.from(expectedMainnetKey))
})

test('AccountHelpers - blobs are not readable with the password key', async () => {
  const envelope = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    undefined,
    MNEMONIC,
  )

  const { key: wrappingKey } = await deriveWrappingKey(envelope.salt)

  await expect(
    decryptWith(
      envelope.btcEncryptedSeed,
      envelope.btcIv,
      envelope.btcTag,
      wrappingKey,
    ),
  ).rejects.toThrow('Incorrect password')
})

test('AccountHelpers - a wrong password cannot unwrap the DEK', async () => {
  const envelope = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    undefined,
    MNEMONIC,
  )

  const { key: wrongKey } = await Cipher.generatePBKDF2Key({
    password: 'WrongPass',
    salt: envelope.salt,
    version: Cipher.ENVELOPE_ENCRYPTION_VERSION,
  })

  await expect(unwrapWith(envelope, wrongKey)).rejects.toThrow(
    'Incorrect password',
  )
})

test('AccountHelpers - the wrapping key is derived at v4, not a legacy version', async () => {
  const envelope = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    undefined,
    MNEMONIC,
  )

  const { key: legacyKey } = await deriveWrappingKey(envelope.salt, 1)
  expect(legacyKey.length).toBe(16)

  await expect(unwrapWith(envelope, legacyKey)).rejects.toThrow(
    'Invalid wrapping key',
  )

  const { key: v4Key } = await deriveWrappingKey(envelope.salt)
  await expect(unwrapWith(envelope, v4Key)).resolves.toHaveLength(
    Cipher.DEKSIZE,
  )
})

test('AccountHelpers - reuses a provided salt and generates one otherwise', async () => {
  const providedSalt = await Cipher.generateSalt(16)

  const withSalt = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    providedSalt,
    MNEMONIC,
  )
  const withoutSalt = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    undefined,
    MNEMONIC,
  )

  expect(withSalt.salt).toBe(providedSalt)
  expect(withoutSalt.salt).not.toBe(providedSalt)
  expect(withoutSalt.salt).toMatch(/^[0-9a-f]{32}$/)
})

test('AccountHelpers - every call uses a fresh DEK', async () => {
  const salt = await Cipher.generateSalt(16)

  const first = await getEnvelopeEncryptedPrivateKeys(PASSWORD, salt, MNEMONIC)
  const second = await getEnvelopeEncryptedPrivateKeys(PASSWORD, salt, MNEMONIC)

  const { key: wrappingKey } = await deriveWrappingKey(salt)
  const firstDek = await unwrapWith(first, wrappingKey)
  const secondDek = await unwrapWith(second, wrappingKey)

  expect(firstDek).not.toStrictEqual(secondDek)
  expect(first.btcEncryptedSeed).not.toBe(second.btcEncryptedSeed)

  const firstSeed = await decryptWith(
    first.btcEncryptedSeed,
    first.btcIv,
    first.btcTag,
    firstDek,
    'btcEncryptedSeed',
  )
  const secondSeed = await decryptWith(
    second.btcEncryptedSeed,
    second.btcIv,
    second.btcTag,
    secondDek,
    'btcEncryptedSeed',
  )

  expect(Buffer.from(firstSeed)).toStrictEqual(Buffer.from(secondSeed))
})

test('AccountHelpers - one DEK is shared by all three blobs', async () => {
  const envelope = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    undefined,
    MNEMONIC,
  )

  const ivs = [
    envelope.btcIv,
    envelope.mlTestnetPrivKeyIv,
    envelope.mlMainnetPrivKeyIv,
  ]
  expect(new Set(ivs).size).toBe(3)

  const { key: wrappingKey } = await deriveWrappingKey(envelope.salt)
  const dek = await unwrapWith(envelope, wrappingKey)

  await expect(
    decryptWith(
      envelope.encryptedMlTestnetPrivateKey,
      envelope.mlTestnetPrivKeyIv,
      envelope.mlTestnetPrivKeyTag,
      dek,
      'encryptedMlTestnetPrivateKey',
    ),
  ).resolves.toBeDefined()
})

test('AccountHelpers - stores distinct testnet and mainnet mintlayer keys', async () => {
  const envelope = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    undefined,
    MNEMONIC,
  )

  const { key: wrappingKey } = await deriveWrappingKey(envelope.salt)
  const dek = await unwrapWith(envelope, wrappingKey)

  const testnetKey = await decryptWith(
    envelope.encryptedMlTestnetPrivateKey,
    envelope.mlTestnetPrivKeyIv,
    envelope.mlTestnetPrivKeyTag,
    dek,
    'encryptedMlTestnetPrivateKey',
  )
  const mainnetKey = await decryptWith(
    envelope.encryptedMlMainnetPrivateKey,
    envelope.mlMainnetPrivKeyIv,
    envelope.mlMainnetPrivKeyTag,
    dek,
    'encryptedMlMainnetPrivateKey',
  )

  expect(testnetKey.length).toBeGreaterThan(0)
  expect(Buffer.from(testnetKey)).not.toStrictEqual(Buffer.from(mainnetKey))
})

test('AccountHelpers - the envelope survives a JSON round trip', async () => {
  const envelope = await getEnvelopeEncryptedPrivateKeys(
    PASSWORD,
    undefined,
    MNEMONIC,
  )
  const restored = JSON.parse(JSON.stringify(envelope))

  const { key: wrappingKey } = await deriveWrappingKey(restored.salt)
  const dek = await unwrapWith(restored, wrappingKey)

  const seed = await decryptWith(
    restored.btcEncryptedSeed,
    restored.btcIv,
    restored.btcTag,
    dek,
    'btcEncryptedSeed',
  )
  const expectedSeed = await BTC.getSeedFromMnemonic(MNEMONIC)

  expect(Buffer.from(seed)).toStrictEqual(Buffer.from(expectedSeed))
})

test('AccountHelpers - HTLS secret is encrypted with the key it is given', async () => {
  const key = await Cipher.generateDek()
  const secret = 'htls-secret-value'

  const first = await getEncryptedHtlsSecret(key, secret)
  const second = await getEncryptedHtlsSecret(key, secret)

  expect(first.htlsIv).not.toBe(second.htlsIv)
  expect(first.encryptedHtlsSecret).not.toBe(second.encryptedHtlsSecret)

  const decrypted = await decryptWith(
    first.encryptedHtlsSecret,
    first.htlsIv,
    first.htlsTag,
    key,
  )

  expect(Buffer.from(decrypted).toString()).toBe(secret)
})

test('AccountHelpers - an HTLS secret cannot be read with another key', async () => {
  const key = await Cipher.generateDek()
  const otherKey = await Cipher.generateDek()

  const encrypted = await getEncryptedHtlsSecret(key, 'htls-secret-value')

  await expect(
    decryptWith(
      encrypted.encryptedHtlsSecret,
      encrypted.htlsIv,
      encrypted.htlsTag,
      otherKey,
    ),
  ).rejects.toThrow('Incorrect password')
})
