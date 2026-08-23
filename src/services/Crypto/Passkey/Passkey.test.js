import {
  FIREFOX_RP_ID,
  isSupported,
  getRpId,
  toBase64Url,
  fromBase64Url,
  createCredential,
  getPrfOutput,
  enroll,
} from './Passkey'

const CREDENTIAL_ID = new Uint8Array([1, 2, 3, 4])
const PRF_OUTPUT = new Uint8Array(32).fill(7)

const setUserAgent = (value) =>
  Object.defineProperty(navigator, 'userAgent', {
    configurable: true,
    value,
  })

const mockCredentials = ({ create, get }) => {
  Object.defineProperty(navigator, 'credentials', {
    configurable: true,
    value: { create, get },
  })
}

const credentialWith = (extensionResults) => ({
  rawId: CREDENTIAL_ID.buffer,
  getClientExtensionResults: () => extensionResults,
})

beforeEach(() => {
  setUserAgent('Chrome')
  global.PublicKeyCredential = function PublicKeyCredential() {}
})

afterEach(() => {
  delete global.PublicKeyCredential
})

test('Passkey - base64url round trips without padding characters', () => {
  const bytes = new Uint8Array([251, 255, 190, 0, 1])
  const encoded = toBase64Url(bytes)

  expect(encoded).not.toMatch(/[+/=]/)
  expect(fromBase64Url(encoded)).toStrictEqual(bytes)
})

test('Passkey - support detection needs both the interface and the API', () => {
  mockCredentials({ create: jest.fn(), get: jest.fn() })
  expect(isSupported()).toBe(true)

  mockCredentials({ create: undefined, get: jest.fn() })
  expect(isSupported()).toBe(false)

  mockCredentials({ create: jest.fn(), get: jest.fn() })
  delete global.PublicKeyCredential
  expect(isSupported()).toBe(false)
})

test('Passkey - the RP id is omitted on Chrome and a domain on Firefox', () => {
  expect(getRpId()).toBeUndefined()

  setUserAgent('Mozilla/5.0 Firefox/150.0')
  expect(getRpId()).toBe(FIREFOX_RP_ID)
})

test('Passkey - creation asks for a discoverable credential and user verification', async () => {
  const create = jest.fn(async () =>
    credentialWith({ prf: { enabled: true }, credProps: { rk: true } }),
  )
  mockCredentials({ create, get: jest.fn() })

  const credentialId = await createCredential('Savings')

  expect(credentialId).toBe(toBase64Url(CREDENTIAL_ID))

  const { publicKey } = create.mock.calls[0][0]

  expect(publicKey.rp.id).toBeUndefined()
  expect(publicKey.authenticatorSelection).toStrictEqual({
    residentKey: 'required',
    requireResidentKey: true,
    userVerification: 'required',
  })
  expect(publicKey.attestation).toBe('none')
  expect(publicKey.extensions.prf).toStrictEqual({})
  expect(publicKey.challenge.length).toBe(32)
  expect(publicKey.user.name).toBe('Savings')
})

test('Passkey - creation sends the RP id on Firefox', async () => {
  setUserAgent('Mozilla/5.0 Firefox/150.0')
  const create = jest.fn(async () => credentialWith({ prf: { enabled: true } }))
  mockCredentials({ create, get: jest.fn() })

  await createCredential('Savings')

  expect(create.mock.calls[0][0].publicKey.rp.id).toBe(FIREFOX_RP_ID)
})

test('Passkey - an authenticator without PRF is refused', async () => {
  mockCredentials({
    create: jest.fn(async () => credentialWith({})),
    get: jest.fn(),
  })

  await expect(createCredential('Savings')).rejects.toThrow(
    'This authenticator cannot protect a wallet',
  )

  mockCredentials({
    create: jest.fn(async () => credentialWith({ prf: { enabled: false } })),
    get: jest.fn(),
  })

  await expect(createCredential('Savings')).rejects.toThrow(
    'This authenticator cannot protect a wallet',
  )
})

test('Passkey - a cancelled creation is refused', async () => {
  mockCredentials({ create: jest.fn(async () => null), get: jest.fn() })

  await expect(createCredential('Savings')).rejects.toThrow(
    'Passkey creation was cancelled',
  )
})

test('Passkey - the assertion evaluates PRF with the stored salt', async () => {
  const get = jest.fn(async () => ({
    rawId: CREDENTIAL_ID.buffer,
    getClientExtensionResults: () => ({
      prf: { results: { first: PRF_OUTPUT } },
    }),
  }))
  mockCredentials({ create: jest.fn(), get })

  const credentialId = toBase64Url(CREDENTIAL_ID)
  const prfSalt = toBase64Url(new Uint8Array(32).fill(9))

  const result = await getPrfOutput([{ credentialId, prfSalt }])

  expect(result).toStrictEqual({ credentialId, prfOutput: [...PRF_OUTPUT] })

  const { publicKey } = get.mock.calls[0][0]

  expect(publicKey.userVerification).toBe('required')
  expect(publicKey.allowCredentials[0].id).toStrictEqual(CREDENTIAL_ID)
  expect(publicKey.extensions.prf.evalByCredential[credentialId]).toStrictEqual(
    { first: new Uint8Array(32).fill(9) },
  )
})

test('Passkey - every enrolled credential is offered with its own salt', async () => {
  const secondId = new Uint8Array([9, 9, 9])
  const get = jest.fn(async () => ({
    rawId: secondId.buffer,
    getClientExtensionResults: () => ({
      prf: { results: { first: PRF_OUTPUT } },
    }),
  }))
  mockCredentials({ create: jest.fn(), get })

  const first = {
    credentialId: toBase64Url(CREDENTIAL_ID),
    prfSalt: toBase64Url(new Uint8Array(32).fill(1)),
  }
  const second = {
    credentialId: toBase64Url(secondId),
    prfSalt: toBase64Url(new Uint8Array(32).fill(2)),
  }

  const result = await getPrfOutput([first, second])

  expect(result.credentialId).toBe(second.credentialId)

  const { publicKey } = get.mock.calls[0][0]

  expect(publicKey.allowCredentials).toHaveLength(2)
  expect(Object.keys(publicKey.extensions.prf.evalByCredential)).toStrictEqual([
    first.credentialId,
    second.credentialId,
  ])
  expect(
    publicKey.extensions.prf.evalByCredential[second.credentialId].first,
  ).toStrictEqual(new Uint8Array(32).fill(2))
})

test('Passkey - an empty credential list is refused before any ceremony', async () => {
  const get = jest.fn()
  mockCredentials({ create: jest.fn(), get })

  await expect(getPrfOutput([])).rejects.toThrow('No passkey is enrolled')
  expect(get).not.toHaveBeenCalled()
})

test('Passkey - a missing PRF result fails closed', async () => {
  mockCredentials({
    create: jest.fn(),
    get: jest.fn(async () => ({
      rawId: CREDENTIAL_ID.buffer,
      getClientExtensionResults: () => ({}),
    })),
  })

  await expect(
    getPrfOutput([{ credentialId: 'AQID', prfSalt: 'AQID' }]),
  ).rejects.toThrow('This authenticator did not return a key')
})

test('Passkey - a cancelled assertion is refused', async () => {
  mockCredentials({ create: jest.fn(), get: jest.fn(async () => null) })

  await expect(
    getPrfOutput([{ credentialId: 'AQID', prfSalt: 'AQID' }]),
  ).rejects.toThrow('Passkey verification was cancelled')
})

test('Passkey - enrolment follows creation with an assertion for the first PRF output', async () => {
  const create = jest.fn(async () => credentialWith({ prf: { enabled: true } }))
  const get = jest.fn(async () => ({
    rawId: CREDENTIAL_ID.buffer,
    getClientExtensionResults: () => ({
      prf: { results: { first: PRF_OUTPUT } },
    }),
  }))
  mockCredentials({ create, get })

  const result = await enroll('Savings')

  expect(create).toHaveBeenCalledTimes(1)
  expect(get).toHaveBeenCalledTimes(1)
  expect(result.credentialId).toBe(toBase64Url(CREDENTIAL_ID))
  expect(result.prfOutput).toStrictEqual([...PRF_OUTPUT])
  expect(fromBase64Url(result.prfSalt).length).toBe(32)
})

test('Passkey - every enrolment generates a fresh salt', async () => {
  mockCredentials({
    create: jest.fn(async () => credentialWith({ prf: { enabled: true } })),
    get: jest.fn(async () => ({
      rawId: CREDENTIAL_ID.buffer,
      getClientExtensionResults: () => ({
        prf: { results: { first: PRF_OUTPUT } },
      }),
    })),
  })

  const first = await enroll('Savings')
  const second = await enroll('Savings')

  expect(first.prfSalt).not.toBe(second.prfSalt)
})

test('Passkey - the assertion sends the RP id on Firefox', async () => {
  setUserAgent('Mozilla/5.0 Firefox/150.0')
  const get = jest.fn(async () => ({
    rawId: CREDENTIAL_ID.buffer,
    getClientExtensionResults: () => ({
      prf: { results: { first: PRF_OUTPUT } },
    }),
  }))
  mockCredentials({ create: jest.fn(), get })

  await getPrfOutput([{ credentialId: 'AQID', prfSalt: 'AQID' }])

  expect(get.mock.calls[0][0].publicKey.rpId).toBe(FIREFOX_RP_ID)
})

test('Passkey - base64url encoding matches the values a stored record holds', () => {
  const bytes = new Uint8Array([251, 255, 190, 0, 1, 2])

  expect(toBase64Url(bytes)).toBe('-_--AAEC')
  expect(fromBase64Url('-_--AAEC')).toStrictEqual(bytes)
  expect(toBase64Url(new Uint8Array([1]))).toBe('AQ')
  expect(fromBase64Url('AQ')).toStrictEqual(new Uint8Array([1]))
})
