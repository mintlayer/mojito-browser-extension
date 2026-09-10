import { webcrypto } from 'node:crypto'
import {
  isSupported,
  enrollPasskeyCredential,
  unwrapPasswordWithPasskey,
  unlockPasswordWithPasskey,
} from './Passkey'

// jsdom has no WebAuthn implementation and its crypto object may lack
// `subtle`, so both are stubbed below. The navigator.credentials mocks hand
// back REAL WebCrypto bytes for the PRF secret, so the AES-GCM wrap/unwrap
// layer under test runs for real end to end.

const PASSWORD = 'hunter2'
const CREDENTIAL_ID = new Uint8Array([1, 2, 3])

let originalCryptoDescriptor
let originalPublicKeyCredential
let prfSecret // ArrayBuffer shared by the create/get credential mocks
let mockUVPAA
let mockCreate
let mockGet

const base64ToBytes = (base64) =>
  Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))

const installPublicKeyCredential = (uvpaa) => {
  // The real WebAuthn API is a constructor with a static method, and the
  // source checks `typeof window.PublicKeyCredential === 'function'`.
  const publicKeyCredential = jest.fn()
  publicKeyCredential.userVerifyingPlatformAuthenticatorAvailable = uvpaa
  Object.defineProperty(window, 'PublicKeyCredential', {
    value: publicKeyCredential,
    configurable: true,
  })
}

const removePublicKeyCredential = () => {
  delete window.PublicKeyCredential
}

const newCredential = (first) => ({
  rawId: CREDENTIAL_ID.slice().buffer,
  getClientExtensionResults: () => ({
    prf: { enabled: true, results: { first } },
  }),
})

beforeAll(() => {
  originalCryptoDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'crypto',
  )
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      configurable: true,
    })
  }

  originalPublicKeyCredential = window.PublicKeyCredential
  mockUVPAA = jest.fn().mockResolvedValue(true)
  installPublicKeyCredential(mockUVPAA)

  prfSecret = webcrypto.getRandomValues(new Uint8Array(32)).buffer

  mockCreate = jest.fn(async () => newCredential(prfSecret))
  mockGet = jest.fn(async () => newCredential(prfSecret))

  Object.defineProperty(window.navigator, 'credentials', {
    value: { create: mockCreate, get: mockGet },
    configurable: true,
  })
})

afterEach(() => {
  // Keep tests independent: restore the default PRF secret in case a test
  // simulated an authenticator whose secret changed between enroll/unlock,
  // and drop calls queued by previous tests.
  prfSecret = webcrypto.getRandomValues(new Uint8Array(32)).buffer
  mockUVPAA.mockClear()
  mockCreate.mockClear()
  mockGet.mockClear()
})

afterAll(() => {
  if (originalCryptoDescriptor) {
    Object.defineProperty(globalThis, 'crypto', originalCryptoDescriptor)
  }
  delete window.navigator.credentials
  if (originalPublicKeyCredential) {
    window.PublicKeyCredential = originalPublicKeyCredential
  } else {
    removePublicKeyCredential()
  }
})

test('Passkey - isSupported is true when a platform authenticator is available', async () => {
  await expect(isSupported()).resolves.toBe(true)
  expect(mockUVPAA).toHaveBeenCalled()
})

test('Passkey - isSupported is false when PublicKeyCredential is missing', () => {
  removePublicKeyCredential()

  expect(isSupported()).toBe(false)

  installPublicKeyCredential(mockUVPAA)
})

test('Passkey - isSupported is false when userVerifyingPlatformAuthenticatorAvailable is missing', () => {
  Object.defineProperty(window, 'PublicKeyCredential', {
    value: jest.fn(),
    configurable: true,
  })

  expect(isSupported()).toBe(false)

  installPublicKeyCredential(mockUVPAA)
})

test('Passkey - isSupported resolves false when no platform authenticator is available', async () => {
  mockUVPAA.mockResolvedValueOnce(false)

  await expect(isSupported()).resolves.toBe(false)
})

test('Passkey - enrollPasskeyCredential returns a blob of four base64 fields', async () => {
  const blob = await enrollPasskeyCredential(PASSWORD)

  expect(blob).toHaveProperty('credentialId', expect.any(String))
  expect(blob).toHaveProperty('salt', expect.any(String))
  expect(blob).toHaveProperty('iv', expect.any(String))
  expect(blob).toHaveProperty('ciphertext', expect.any(String))

  // atob sanity: salt is 32 PRF bytes, iv is a 12-byte AES-GCM iv, and the
  // ciphertext wraps the non-empty password.
  expect(atob(blob.credentialId).length).toBe(CREDENTIAL_ID.length)
  expect(atob(blob.salt).length).toBe(32)
  expect(atob(blob.iv).length).toBe(12)
  expect(atob(blob.ciphertext).length).toBeGreaterThan(0)
})

test('Passkey - enrollPasskeyCredential evaluates prf with the enrolled salt', async () => {
  const blob = await enrollPasskeyCredential(PASSWORD)

  expect(mockCreate).toHaveBeenCalledTimes(1)
  const { publicKey } = mockCreate.mock.calls[0][0]
  const evalFirst = publicKey.extensions.prf.eval.first

  expect(new Uint8Array(evalFirst).length).toBe(32)
  expect(Array.from(new Uint8Array(evalFirst))).toStrictEqual(
    Array.from(base64ToBytes(blob.salt)),
  )
})

test('Passkey - enroll then unwrap returns the wrapped password', async () => {
  const blob = await enrollPasskeyCredential(PASSWORD)

  await expect(unwrapPasswordWithPasskey(blob)).resolves.toBe(PASSWORD)

  // The unlock assertion must have requested the same salt and credential id
  // that were enrolled.
  expect(mockGet).toHaveBeenCalledTimes(1)
  const { publicKey } = mockGet.mock.calls[0][0]
  expect(
    Array.from(new Uint8Array(publicKey.extensions.prf.eval.first)),
  ).toStrictEqual(Array.from(base64ToBytes(blob.salt)))
  expect(
    Array.from(new Uint8Array(publicKey.allowCredentials[0].id)),
  ).toStrictEqual(Array.from(base64ToBytes(blob.credentialId)))
})

test('Passkey - round-trip works with unicode passwords', async () => {
  const password = 'pässwörd-ключ-鍵 🔑'
  const blob = await enrollPasskeyCredential(password)

  await expect(unwrapPasswordWithPasskey(blob)).resolves.toBe(password)
})

test('Passkey - unwrap rejects when the PRF secret differs from the enrolled one', async () => {
  const blob = await enrollPasskeyCredential(PASSWORD)

  // Simulate an authenticator returning a different secret on unlock:
  // AES-GCM must fail rather than return a wrong password.
  prfSecret = webcrypto.getRandomValues(new Uint8Array(32)).buffer

  await expect(unwrapPasswordWithPasskey(blob)).rejects.toThrow()
})

test('Passkey - unwrap rejects with PASSKEY_BLOB_INVALID for an incomplete blob', async () => {
  const blob = await enrollPasskeyCredential(PASSWORD)

  await expect(unwrapPasswordWithPasskey(null)).rejects.toThrow(
    'PASSKEY_BLOB_INVALID',
  )
  await expect(unwrapPasswordWithPasskey({})).rejects.toThrow(
    'PASSKEY_BLOB_INVALID',
  )
  await expect(
    unwrapPasswordWithPasskey({ ...blob, credentialId: undefined }),
  ).rejects.toThrow('PASSKEY_BLOB_INVALID')
  await expect(
    unwrapPasswordWithPasskey({ ...blob, salt: '' }),
  ).rejects.toThrow('PASSKEY_BLOB_INVALID')
  await expect(
    unwrapPasswordWithPasskey({ ...blob, iv: null }),
  ).rejects.toThrow('PASSKEY_BLOB_INVALID')
  await expect(
    unwrapPasswordWithPasskey({ ...blob, ciphertext: undefined }),
  ).rejects.toThrow('PASSKEY_BLOB_INVALID')
})

test('Passkey - enroll and unwrap reject with PASSKEY_UNSUPPORTED when unsupported', async () => {
  removePublicKeyCredential()

  await expect(enrollPasskeyCredential(PASSWORD)).rejects.toThrow(
    'PASSKEY_UNSUPPORTED',
  )
  await expect(unwrapPasswordWithPasskey(null)).rejects.toThrow(
    'PASSKEY_UNSUPPORTED',
  )

  installPublicKeyCredential(mockUVPAA)
})

test('Passkey - unlockPasswordWithPasskey aliases unwrapPasswordWithPasskey', async () => {
  const blob = await enrollPasskeyCredential(PASSWORD)

  await expect(unlockPasswordWithPasskey(blob)).resolves.toBe(PASSWORD)
  await expect(unlockPasswordWithPasskey(null)).rejects.toThrow(
    'PASSKEY_BLOB_INVALID',
  )
})

test('Passkey - enroll rejects with PRF_NOT_SUPPORTED when creation lacks prf results', async () => {
  mockCreate.mockImplementationOnce(async () => ({
    rawId: CREDENTIAL_ID.slice().buffer,
    getClientExtensionResults: () => ({}),
  }))

  await expect(enrollPasskeyCredential(PASSWORD)).rejects.toThrow(
    'PRF_NOT_SUPPORTED',
  )
})

test('Passkey - unwrap rejects with PRF_NOT_SUPPORTED when get lacks prf results', async () => {
  const blob = await enrollPasskeyCredential(PASSWORD)

  mockGet.mockImplementationOnce(async () => ({
    rawId: CREDENTIAL_ID.slice().buffer,
    getClientExtensionResults: () => ({}),
  }))

  await expect(unwrapPasswordWithPasskey(blob)).rejects.toThrow(
    'PRF_NOT_SUPPORTED',
  )
})

test('Passkey - unwrap rejects with PRF_CREDENTIAL_MISMATCH when rawId differs', async () => {
  const blob = await enrollPasskeyCredential(PASSWORD)

  mockGet.mockImplementationOnce(async () => ({
    rawId: new Uint8Array([9, 9, 9]).buffer,
    getClientExtensionResults: () => ({
      prf: { enabled: true, results: { first: prfSecret } },
    }),
  }))

  await expect(unwrapPasswordWithPasskey(blob)).rejects.toThrow(
    'PRF_CREDENTIAL_MISMATCH',
  )
})
