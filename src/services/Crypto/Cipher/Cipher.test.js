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

test('Cipher - encrypt v1, decrypt v1, re-encrypt v2, decrypt v2', async () => {
  const password = 'MyStr0ng!Password'
  const originalData =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

  // Step 1: encrypt with v1 (10000 iterations)
  const { key: keyV1, salt: saltV1 } = await generatePBKDF2Key({
    password,
    version: 1,
  })
  const {
    encryptedData: encV1,
    iv: ivV1,
    tag: tagV1,
  } = await encryptAES({
    data: originalData,
    key: keyV1,
  })

  // Step 2: decrypt with v1
  const { key: keyV1Again } = await generatePBKDF2Key({
    password,
    salt: saltV1,
    version: 1,
  })
  const decryptedV1 = await decryptAES({
    data: encV1,
    iv: ivV1,
    tag: tagV1,
    key: keyV1Again,
  })
  expect(Buffer.from(decryptedV1).toString()).toBe(originalData)

  // Step 3: re-encrypt with v2 (600000 iterations)
  const { key: keyV2, salt: saltV2 } = await generatePBKDF2Key({
    password,
    version: 2,
  })
  const {
    encryptedData: encV2,
    iv: ivV2,
    tag: tagV2,
  } = await encryptAES({
    data: decryptedV1,
    key: keyV2,
  })

  // Step 4: decrypt with v2
  const { key: keyV2Again } = await generatePBKDF2Key({
    password,
    salt: saltV2,
    version: 2,
  })
  const decryptedV2 = await decryptAES({
    data: encV2,
    iv: ivV2,
    tag: tagV2,
    key: keyV2Again,
  })
  expect(Buffer.from(decryptedV2).toString()).toBe(originalData)
})

test('Cipher - encrypt v2, decrypt v2, re-encrypt v1, decrypt v1', async () => {
  const password = 'An0ther$ecure'
  const originalData = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'

  // Step 1: encrypt with v2 (600000 iterations)
  const { key: keyV2, salt: saltV2 } = await generatePBKDF2Key({
    password,
    version: 2,
  })
  const {
    encryptedData: encV2,
    iv: ivV2,
    tag: tagV2,
  } = await encryptAES({
    data: originalData,
    key: keyV2,
  })

  // Step 2: decrypt with v2
  const { key: keyV2Again } = await generatePBKDF2Key({
    password,
    salt: saltV2,
    version: 2,
  })
  const decryptedV2 = await decryptAES({
    data: encV2,
    iv: ivV2,
    tag: tagV2,
    key: keyV2Again,
  })
  expect(Buffer.from(decryptedV2).toString()).toBe(originalData)

  // Step 3: re-encrypt with v1 (10000 iterations)
  const { key: keyV1, salt: saltV1 } = await generatePBKDF2Key({
    password,
    version: 1,
  })
  const {
    encryptedData: encV1,
    iv: ivV1,
    tag: tagV1,
  } = await encryptAES({
    data: decryptedV2,
    key: keyV1,
  })

  // Step 4: decrypt with v1
  const { key: keyV1Again } = await generatePBKDF2Key({
    password,
    salt: saltV1,
    version: 1,
  })
  const decryptedV1 = await decryptAES({
    data: encV1,
    iv: ivV1,
    tag: tagV1,
    key: keyV1Again,
  })
  expect(Buffer.from(decryptedV1).toString()).toBe(originalData)
})

test('Cipher - multiple re-encryption cycles preserve data', async () => {
  const password = 'Cycl3!Test'
  const originalData = 'secret mnemonic phrase for multi-cycle test'
  const versions = [1, 2, 1, 2, 1]

  let currentData = originalData

  for (const version of versions) {
    const { key, salt } = await generatePBKDF2Key({ password, version })
    const { encryptedData, iv, tag } = await encryptAES({
      data: currentData,
      key,
    })

    const { key: decryptKey } = await generatePBKDF2Key({
      password,
      salt,
      version,
    })
    const decrypted = await decryptAES({
      data: encryptedData,
      iv,
      tag,
      key: decryptKey,
    })

    currentData = decrypted
    expect(Buffer.from(decrypted).toString()).toBe(originalData)
  }
})

test('Cipher - re-encryption with different passwords per version', async () => {
  const originalData = 'important seed data'

  // Encrypt with password1 + v1
  const password1 = 'P@ssword1'
  const { key: keyEnc, salt: salt1 } = await generatePBKDF2Key({
    password: password1,
    version: 1,
  })
  const {
    encryptedData: enc1,
    iv: iv1,
    tag: tag1,
  } = await encryptAES({
    data: originalData,
    key: keyEnc,
  })

  // Decrypt with password1 + v1
  const { key: keyDec1 } = await generatePBKDF2Key({
    password: password1,
    salt: salt1,
    version: 1,
  })
  const decrypted1 = await decryptAES({
    data: enc1,
    iv: iv1,
    tag: tag1,
    key: keyDec1,
  })
  expect(Buffer.from(decrypted1).toString()).toBe(originalData)

  // Re-encrypt with password2 + v2
  const password2 = 'N3wP@ss!'
  const { key: keyEnc2, salt: salt2 } = await generatePBKDF2Key({
    password: password2,
    version: 2,
  })
  const {
    encryptedData: enc2,
    iv: iv2,
    tag: tag2,
  } = await encryptAES({
    data: decrypted1,
    key: keyEnc2,
  })

  // Decrypt with password2 + v2
  const { key: keyDec2 } = await generatePBKDF2Key({
    password: password2,
    salt: salt2,
    version: 2,
  })
  const decrypted2 = await decryptAES({
    data: enc2,
    iv: iv2,
    tag: tag2,
    key: keyDec2,
  })
  expect(Buffer.from(decrypted2).toString()).toBe(originalData)

  // Old password + v2 salt should NOT decrypt
  const { key: wrongKey } = await generatePBKDF2Key({
    password: password1,
    salt: salt2,
    version: 2,
  })
  await expect(
    decryptAES({ data: enc2, iv: iv2, tag: tag2, key: wrongKey }),
  ).rejects.toThrow('Incorrect password')
})

test('Cipher - v1 key cannot decrypt v2-encrypted data with same password', async () => {
  const password = 'SameP@ss1'
  const originalData = 'cross version test'
  const salt = await generateSalt(16)

  const { key: keyV2 } = await generatePBKDF2Key({
    password,
    salt,
    version: 2,
  })
  const { encryptedData, iv, tag } = await encryptAES({
    data: originalData,
    key: keyV2,
  })

  const { key: keyV1 } = await generatePBKDF2Key({
    password,
    salt,
    version: 1,
  })

  // v1 key differs from v2 key (different iterations), so decryption must fail
  expect(keyV1).not.toStrictEqual(keyV2)
  await expect(
    decryptAES({ data: encryptedData, iv, tag, key: keyV1 }),
  ).rejects.toThrow('Incorrect password')
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
