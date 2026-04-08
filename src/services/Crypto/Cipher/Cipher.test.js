import {
  generateSalt,
  generatePBKDF2Key,
  generateIV,
  encryptAES,
  decryptAES,
  hexToBytes,
  IVSIZE,
  CURRENT_ENCRYPTION_VERSION,
  ENCRYPTION_VERSIONS,
  getVersionConfig,
} from './Cipher'

test('Cipher - HEX to Bytes', () => {
  const hex = '6162636465' //abcde
  const bytes = new Uint8Array([97, 98, 99, 100, 101])

  expect(hexToBytes(hex)).toStrictEqual(bytes)
  expect(Buffer.from(bytes).toString('hex')).toBe(hex)
})

test('Cipher - generateSalt returns correct length hex string', async () => {
  const salt1 = await generateSalt(1)
  const salt2 = await generateSalt(2)
  const salt16 = await generateSalt(16)

  expect(hexToBytes(salt1).length).toBe(1)
  expect(hexToBytes(salt2).length).toBe(2)
  expect(hexToBytes(salt16).length).toBe(16)

  expect(typeof salt1).toBe('string')
  expect(salt1).toMatch(/^[0-9a-f]+$/)
  expect(salt1.length).toBe(2)
  expect(salt2.length).toBe(4)
  expect(salt16.length).toBe(32)
})

test('Cipher - generateSalt uses crypto.getRandomValues', async () => {
  const originalGetRandomValues = crypto.getRandomValues.bind(crypto)
  const mockGetRandomValues = jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = 0xab
    return arr
  })
  crypto.getRandomValues = mockGetRandomValues

  const salt = await generateSalt(3)

  expect(mockGetRandomValues).toHaveBeenCalled()
  expect(salt).toBe('ababab')

  crypto.getRandomValues = originalGetRandomValues
})

test('Cipher - generatePBKDF2Key deterministic with same salt', async () => {
  const password = 'test'

  const { key: key1, salt: salt1 } = await generatePBKDF2Key({ password })

  const { key: key2, salt: salt2 } = await generatePBKDF2Key({
    password,
    salt: salt1,
  })

  expect(key1).toStrictEqual(key2)
  expect(salt1).toStrictEqual(salt2)
})

test('Cipher - generatePBKDF2Key returns correct key length', async () => {
  const { key } = await generatePBKDF2Key({
    password: 'test',
    salt: 'a1b2c3d4',
  })

  expect(Array.isArray(key)).toBe(true)
  expect(key.length).toBe(16)
  key.forEach((byte) => {
    expect(byte).toBeGreaterThanOrEqual(0)
    expect(byte).toBeLessThanOrEqual(255)
  })
})

test('Cipher - generatePBKDF2Key uses provided salt', async () => {
  const salt = 'deadbeef'
  const { salt: returnedSalt } = await generatePBKDF2Key({
    password: 'test',
    salt,
  })

  expect(returnedSalt).toBe(salt)
})

test('Cipher - generatePBKDF2Key generates salt when not provided', async () => {
  const { salt } = await generatePBKDF2Key({ password: 'test' })

  expect(typeof salt).toBe('string')
  expect(salt).toMatch(/^[0-9a-f]+$/)
  expect(salt.length).toBe(32)
})

test('Cipher - generatePBKDF2Key different passwords produce different keys', async () => {
  const salt = 'fixedsalt'
  const { key: key1 } = await generatePBKDF2Key({
    password: 'password1',
    salt,
  })
  const { key: key2 } = await generatePBKDF2Key({
    password: 'password2',
    salt,
  })

  expect(key1).not.toStrictEqual(key2)
})

test('Cipher - generatePBKDF2Key respects iterations parameter', async () => {
  const salt = 'fixedsalt'
  const password = 'test'

  const { key: keyDefault } = await generatePBKDF2Key({ password, salt })
  const { key: keyLegacy } = await generatePBKDF2Key({
    password,
    salt,
    version: 1,
  })

  expect(keyDefault).not.toStrictEqual(keyLegacy)
})

test('Cipher - generatePBKDF2Key known value verification', async () => {
  const { key } = await generatePBKDF2Key({
    password: 'testpassword',
    salt: '0123456789abcdef0123456789abcdef',
    version: 1,
  })

  expect(key.length).toBe(16)

  const { key: key2 } = await generatePBKDF2Key({
    password: 'testpassword',
    salt: '0123456789abcdef0123456789abcdef',
    version: 1,
  })
  expect(key).toStrictEqual(key2)
})

test('Cipher - generateIV returns Uint8Array of correct size', async () => {
  const iv = await generateIV()

  expect(iv).toBeInstanceOf(Uint8Array)
  expect(iv.length).toBe(IVSIZE)
  expect(iv.length).toBe(12)
})

test('Cipher - generateIV uses crypto.getRandomValues', async () => {
  const originalGetRandomValues = crypto.getRandomValues.bind(crypto)
  const mockGetRandomValues = jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = 0x42
    return arr
  })
  crypto.getRandomValues = mockGetRandomValues

  const iv = await generateIV()

  expect(mockGetRandomValues).toHaveBeenCalled()
  expect(iv.length).toBe(IVSIZE)
  expect(Array.from(iv)).toStrictEqual(Array(IVSIZE).fill(0x42))

  crypto.getRandomValues = originalGetRandomValues
})

test('Cipher - encryptAES returns correct structure', async () => {
  const data = 'data'
  const key = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98,
  ]

  const { encryptedData, iv, tag } = await encryptAES({ data, key })

  expect(typeof encryptedData).toBe('string')
  expect(typeof iv).toBe('string')
  expect(typeof tag).toBe('string')
  expect(encryptedData.length).toBeGreaterThan(0)
  expect(iv.length).toBe(12)
  expect(tag.length).toBe(16)
})

test('Cipher - encryptAES deterministic with mocked IV', async () => {
  const data = 'data'
  const key = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98,
  ]

  const originalGetRandomValues = crypto.getRandomValues.bind(crypto)
  crypto.getRandomValues = jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = 0x61
    return arr
  })

  const result1 = await encryptAES({ data, key })
  const result2 = await encryptAES({ data, key })

  expect(result1.encryptedData).toBe(result2.encryptedData)
  expect(result1.iv).toBe(result2.iv)
  expect(result1.tag).toBe(result2.tag)

  crypto.getRandomValues = originalGetRandomValues
})

test('Cipher - encryptAES different data produces different output', async () => {
  const key = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98,
  ]

  const originalGetRandomValues = crypto.getRandomValues.bind(crypto)
  crypto.getRandomValues = jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = 0x61
    return arr
  })

  const result1 = await encryptAES({ data: 'data1', key })
  const result2 = await encryptAES({ data: 'data2', key })

  expect(result1.encryptedData).not.toBe(result2.encryptedData)

  crypto.getRandomValues = originalGetRandomValues
})

test('Cipher - decryptAES round-trip', async () => {
  const data = 'data'
  const key = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98,
  ]
  const { encryptedData, iv, tag } = await encryptAES({ data, key })
  const decrypted = await decryptAES({
    data: encryptedData,
    iv,
    tag,
    key,
  })

  expect(Buffer.from(decrypted).toString()).toBe(data)
})

test('Cipher - decryptAES round-trip with long data', async () => {
  const data =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  const key = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98,
  ]
  const { encryptedData, iv, tag } = await encryptAES({ data, key })
  const decrypted = await decryptAES({
    data: encryptedData,
    iv,
    tag,
    key,
  })

  expect(Buffer.from(decrypted).toString()).toBe(data)
})

test('Cipher - decryptAES round-trip with unicode data', async () => {
  const data = 'test data with special chars @#$%'
  const key = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98,
  ]
  const { encryptedData, iv, tag } = await encryptAES({ data, key })
  const decrypted = await decryptAES({
    data: encryptedData,
    iv,
    tag,
    key,
  })

  expect(Buffer.from(decrypted).toString()).toBe(data)
})

test('Cipher - decryptAES wrong key throws', async () => {
  const data = 'data'
  const key = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98,
  ]
  const wrongkey = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 97,
  ]
  const { encryptedData, iv, tag } = await encryptAES({ data, key })

  await expect(
    decryptAES({
      data: encryptedData,
      iv,
      tag,
      key: wrongkey,
    }),
  ).rejects.toThrow('Incorrect password')
})

test('Cipher - decryptAES tampered data throws', async () => {
  const data = 'data'
  const key = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98,
  ]
  const { encryptedData, iv, tag } = await encryptAES({ data, key })

  const tampered =
    String.fromCharCode(encryptedData.charCodeAt(0) ^ 0xff) +
    encryptedData.slice(1)

  await expect(
    decryptAES({
      data: tampered,
      iv,
      tag,
      key,
    }),
  ).rejects.toThrow('Incorrect password')
})

test('Cipher - decryptAES tampered tag throws', async () => {
  const data = 'data'
  const key = [
    97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98,
  ]
  const { encryptedData, iv, tag } = await encryptAES({ data, key })

  const tamperedTag =
    String.fromCharCode(tag.charCodeAt(0) ^ 0xff) + tag.slice(1)

  await expect(
    decryptAES({
      data: encryptedData,
      iv,
      tag: tamperedTag,
      key,
    }),
  ).rejects.toThrow('Incorrect password')
})

test('Cipher - constants are correct', () => {
  expect(CURRENT_ENCRYPTION_VERSION).toBe(2)
  expect(getVersionConfig(1).iterations).toBe(10000)
  expect(getVersionConfig(2).iterations).toBe(600000)
  expect(IVSIZE).toBe(12)
})

test('Cipher - getVersionConfig throws on unknown version', () => {
  expect(() => getVersionConfig(999)).toThrow('Unknown encryption version: 999')
})

test('Cipher - full encrypt/decrypt cycle with PBKDF2', async () => {
  const password = 'MyStr0ng!Password'
  const data = 'secret seed phrase data'

  const { key, salt } = await generatePBKDF2Key({ password })
  const { encryptedData, iv, tag } = await encryptAES({ data, key })

  const { key: key2 } = await generatePBKDF2Key({ password, salt })
  const decrypted = await decryptAES({
    data: encryptedData,
    iv,
    tag,
    key: key2,
  })

  expect(Buffer.from(decrypted).toString()).toBe(data)
})

test('Cipher - full cycle with wrong password fails', async () => {
  const data = 'secret seed phrase data'

  const { key } = await generatePBKDF2Key({ password: 'correct' })
  const { encryptedData, iv, tag } = await encryptAES({ data, key })

  const { key: wrongKey } = await generatePBKDF2Key({
    password: 'wrong',
    salt: 'differentsalt',
  })

  await expect(
    decryptAES({
      data: encryptedData,
      iv,
      tag,
      key: wrongKey,
    }),
  ).rejects.toThrow('Incorrect password')
})
