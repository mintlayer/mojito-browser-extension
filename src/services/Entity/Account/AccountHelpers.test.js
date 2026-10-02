import loadAccountSubRoutines from './loadWorkers'
import {
  getEncryptedPrivateKeys,
  getEncryptedHtlsSecret,
} from './AccountHelpers'

jest.mock('./loadWorkers', () => {
  const subroutines = {
    generateSeed: jest.fn(),
    generateEncryptionKey: jest.fn(),
    encryptSeed: jest.fn(),
  }
  const loadAccountSubRoutines = jest.fn(async () => subroutines)
  return { __esModule: true, default: loadAccountSubRoutines }
})

jest.mock('@Cryptos', () => ({
  ML: {
    getPrivateKeyFromMnemonic: jest.fn(() => 'private-key'),
  },
}))

jest.mock('@Constants', () => ({
  AppInfo: {
    NETWORK_TYPES: { TESTNET: 'testnet', MAINNET: 'mainnet' },
  },
}))

const PASSWORD = 'pass'
const MNEMONIC = 'test mnemonic'
const SECRET = 'htls secret'

const getSubRoutines = async () => {
  const subRoutines = await loadAccountSubRoutines()
  subRoutines.generateSeed.mockResolvedValue('seed')
  subRoutines.generateEncryptionKey.mockResolvedValue({
    key: 'key',
    salt: 'salt',
  })
  subRoutines.encryptSeed.mockResolvedValue({
    encryptedData: 'encrypted',
    iv: 'iv',
    tag: 'tag',
  })
  return subRoutines
}

// Regression tests for the persistence safety contract: a failed encrypt job
// (worker error payload, incomplete payload or rejection) must reject so that
// undefined ciphertext can never be persisted.
describe('AccountHelpers cipher payload contract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getEncryptedPrivateKeys returns encrypted payloads on success', async () => {
    const { encryptSeed } = await getSubRoutines()

    const result = await getEncryptedPrivateKeys(PASSWORD, undefined, MNEMONIC)

    expect(result.salt).toBe('salt')
    expect(result.encryptedMlTestnetPrivateKey).toBe('encrypted')
    expect(result.encryptedMlMainnetPrivateKey).toBe('encrypted')
    expect(result.btcEncryptedSeed).toBe('encrypted')
    expect(encryptSeed).toHaveBeenCalledTimes(3)
  })

  test('getEncryptedPrivateKeys rejects when a worker error payload is resolved', async () => {
    const { encryptSeed } = await getSubRoutines()
    encryptSeed.mockResolvedValue({ error: 'job failed' })

    await expect(
      getEncryptedPrivateKeys(PASSWORD, undefined, MNEMONIC),
    ).rejects.toThrow('job failed')
  })

  test('getEncryptedPrivateKeys rejects on an incomplete cipher payload', async () => {
    const { encryptSeed } = await getSubRoutines()
    encryptSeed.mockResolvedValue({ encryptedData: 'encrypted' })

    await expect(
      getEncryptedPrivateKeys(PASSWORD, undefined, MNEMONIC),
    ).rejects.toThrow('Encryption returned an incomplete cipher payload')
  })

  test('getEncryptedPrivateKeys propagates worker rejections', async () => {
    const { encryptSeed } = await getSubRoutines()
    encryptSeed.mockRejectedValue(new Error('worker crashed'))

    await expect(
      getEncryptedPrivateKeys(PASSWORD, undefined, MNEMONIC),
    ).rejects.toThrow('worker crashed')
  })

  test('getEncryptedHtlsSecret rejects when a worker error payload is resolved', async () => {
    const { encryptSeed } = await getSubRoutines()
    encryptSeed.mockResolvedValue({ error: 'job failed' })

    await expect(
      getEncryptedHtlsSecret(PASSWORD, 'salt', SECRET, 1),
    ).rejects.toThrow('job failed')
  })

  test('getEncryptedHtlsSecret rejects on an incomplete cipher payload', async () => {
    const { encryptSeed } = await getSubRoutines()
    encryptSeed.mockResolvedValue({ encryptedData: 'encrypted', iv: 'iv' })

    await expect(
      getEncryptedHtlsSecret(PASSWORD, 'salt', SECRET, 1),
    ).rejects.toThrow('Encryption returned an incomplete cipher payload')
  })

  test('getEncryptedHtlsSecret returns the encrypted secret on success', async () => {
    await getSubRoutines()

    const result = await getEncryptedHtlsSecret(PASSWORD, 'salt', SECRET, 1)

    expect(result).toEqual({
      encryptedHtlsSecret: 'encrypted',
      htlsIv: 'iv',
      htlsTag: 'tag',
    })
  })
})
