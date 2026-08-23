import {
  generateSalt,
  generatePBKDF2Key,
  generateIV,
  encryptAES,
  decryptAES,
  hexToBytes,
  IVSIZE,
  DEKSIZE,
  CURRENT_ENCRYPTION_VERSION,
  ENVELOPE_ENCRYPTION_VERSION,
  ENCRYPTION_VERSIONS,
  getVersionConfig,
  generateDek,
  wrapDek,
  unwrapDek,
  deriveKekFromPrf,
  contentAad,
  wrapperAad,
  htlsAad,
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
  expect(key.length).toBe(32)
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
  expect(CURRENT_ENCRYPTION_VERSION).toBe(4)
  expect(getVersionConfig(1).iterations).toBe(10000)
  expect(getVersionConfig(2).iterations).toBe(600000)
  expect(getVersionConfig(3).iterations).toBe(600000)
  expect(getVersionConfig(1).keySize).toBe(16)
  expect(getVersionConfig(2).keySize).toBe(16)
  expect(getVersionConfig(3).keySize).toBe(32)
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

// Mirrors the migration flow in reEncryptAccount: decrypt with the old
// version, then re-encrypt with a fresh salt under the new version.
const migrateRoundTrip = async (password, data, fromVersion, toVersion) => {
  const { key: fromKey, salt: fromSalt } = await generatePBKDF2Key({
    password,
    version: fromVersion,
  })
  const enc = await encryptAES({ data, key: fromKey })

  const { key: fromKeyAgain } = await generatePBKDF2Key({
    password,
    salt: fromSalt,
    version: fromVersion,
  })
  const decrypted = await decryptAES({
    data: enc.encryptedData,
    iv: enc.iv,
    tag: enc.tag,
    key: fromKeyAgain,
  })
  expect(Buffer.from(decrypted).toString()).toBe(data)

  const { key: toKey, salt: toSalt } = await generatePBKDF2Key({
    password,
    version: toVersion,
  })
  const reEnc = await encryptAES({ data: decrypted, key: toKey })

  const { key: toKeyAgain } = await generatePBKDF2Key({
    password,
    salt: toSalt,
    version: toVersion,
  })
  const finalDecrypted = await decryptAES({
    data: reEnc.encryptedData,
    iv: reEnc.iv,
    tag: reEnc.tag,
    key: toKeyAgain,
  })
  expect(Buffer.from(finalDecrypted).toString()).toBe(data)

  return { fromKey, toKey }
}

test('Cipher - migration v1 -> v2 preserves data (AES-128)', async () => {
  const { fromKey, toKey } = await migrateRoundTrip(
    'MyStr0ng!Pass',
    'seed phrase v1 to v2',
    1,
    2,
  )
  expect(fromKey.length).toBe(16)
  expect(toKey.length).toBe(16)
})

test('Cipher - migration v2 -> v3 upgrades to AES-256 and preserves data', async () => {
  const { fromKey, toKey } = await migrateRoundTrip(
    'MyStr0ng!Pass',
    'seed phrase v2 to v3',
    2,
    3,
  )
  expect(fromKey.length).toBe(16) // AES-128
  expect(toKey.length).toBe(32) // AES-256
})

test('Cipher - migration v1 -> v3 upgrades to AES-256 and preserves data', async () => {
  const { fromKey, toKey } = await migrateRoundTrip(
    'MyStr0ng!Pass',
    'seed phrase v1 to v3',
    1,
    3,
  )
  expect(fromKey.length).toBe(16) // AES-128
  expect(toKey.length).toBe(32) // AES-256
})

test('Cipher - v4 shares v3 KDF parameters', () => {
  expect(ENVELOPE_ENCRYPTION_VERSION).toBe(4)
  expect(getVersionConfig(4)).toStrictEqual(getVersionConfig(3))
})

test('Cipher - generateDek returns a fresh 32 byte key', async () => {
  const dek1 = await generateDek()
  const dek2 = await generateDek()

  expect(dek1.length).toBe(DEKSIZE)
  expect(Array.isArray(dek1)).toBe(true)
  expect(dek1.every((byte) => byte >= 0 && byte <= 255)).toBe(true)
  expect(dek1).not.toStrictEqual(dek2)
})

test('Cipher - wrapDek / unwrapDek round trip', async () => {
  const dek = await generateDek()
  const wrappingKey = await generateDek()

  const wrapped = await wrapDek({ dek, wrappingKey })

  expect(wrapped.encryptedData).toBeDefined()
  expect(wrapped.iv.length).toBe(IVSIZE)
  expect(wrapped.tag.length).toBe(16)

  const unwrapped = await unwrapDek({
    ...wrapped,
    data: wrapped.encryptedData,
    wrappingKey,
  })

  expect(unwrapped).toStrictEqual(dek)
})

test('Cipher - the same DEK can be wrapped by two independent keys', async () => {
  const dek = await generateDek()
  const { key: passwordKey } = await generatePBKDF2Key({
    password: 'MyStr0ng!Pass',
  })
  const passkeyKey = [...crypto.getRandomValues(new Uint8Array(DEKSIZE))]

  const byPassword = await wrapDek({ dek, wrappingKey: passwordKey })
  const byPasskey = await wrapDek({ dek, wrappingKey: passkeyKey })

  expect(byPassword.encryptedData).not.toBe(byPasskey.encryptedData)

  await expect(
    unwrapDek({
      ...byPassword,
      data: byPassword.encryptedData,
      wrappingKey: passwordKey,
    }),
  ).resolves.toStrictEqual(dek)
  await expect(
    unwrapDek({
      ...byPasskey,
      data: byPasskey.encryptedData,
      wrappingKey: passkeyKey,
    }),
  ).resolves.toStrictEqual(dek)
})

test('Cipher - unwrapDek rejects a wrong wrapping key', async () => {
  const dek = await generateDek()
  const wrappingKey = await generateDek()
  const { key: wrongKey } = await generatePBKDF2Key({ password: 'WrongPass' })

  const wrapped = await wrapDek({ dek, wrappingKey })

  await expect(
    unwrapDek({
      ...wrapped,
      data: wrapped.encryptedData,
      wrappingKey: wrongKey,
    }),
  ).rejects.toThrow('Incorrect password')
})

test('Cipher - wrapDek rejects a DEK of the wrong size', async () => {
  const wrappingKey = await generateDek()

  const invalidDeks = [
    ['too short', [1, 2, 3]],
    ['too long', new Array(DEKSIZE + 1).fill(1)],
    ['empty', []],
    ['undefined', undefined],
    ['null', null],
  ]

  for (const [, dek] of invalidDeks) {
    await expect(wrapDek({ dek, wrappingKey })).rejects.toThrow(
      'Invalid data encryption key',
    )
  }
})

test('Cipher - wrapDek rejects a wrapping key that is not 32 bytes', async () => {
  const dek = await generateDek()
  const { key: legacyKey } = await generatePBKDF2Key({
    password: 'MyStr0ng!Pass',
    version: 1,
  })

  expect(legacyKey.length).toBe(16)

  await expect(wrapDek({ dek, wrappingKey: legacyKey })).rejects.toThrow(
    'Invalid wrapping key',
  )
  await expect(wrapDek({ dek, wrappingKey: undefined })).rejects.toThrow(
    'Invalid wrapping key',
  )
})

test('Cipher - unwrapDek rejects a wrapping key that is not 32 bytes', async () => {
  const dek = await generateDek()
  const wrappingKey = await generateDek()
  const wrapped = await wrapDek({ dek, wrappingKey })

  await expect(
    unwrapDek({
      ...wrapped,
      data: wrapped.encryptedData,
      wrappingKey: [1, 2, 3],
    }),
  ).rejects.toThrow('Invalid wrapping key')
})

test('Cipher - unwrapDek reports a missing wrapper distinctly from a wrong key', async () => {
  const dek = await generateDek()
  const wrappingKey = await generateDek()
  const wrapped = await wrapDek({ dek, wrappingKey })
  const full = { ...wrapped, data: wrapped.encryptedData }

  const incomplete = [
    { ...full, data: undefined },
    { ...full, iv: undefined },
    { ...full, tag: undefined },
    {},
  ]

  for (const wrapper of incomplete) {
    await expect(unwrapDek({ ...wrapper, wrappingKey })).rejects.toThrow(
      'Missing key wrapper',
    )
  }
})

test('Cipher - unwrapDek rejects a payload that is not a 32 byte key', async () => {
  const wrappingKey = await generateDek()

  const payloads = [new Uint8Array([1, 2, 3]), new Uint8Array(DEKSIZE + 1)]

  for (const payload of payloads) {
    const notAKey = await encryptAES({ data: payload, key: wrappingKey })
    await expect(
      unwrapDek({ ...notAKey, data: notAKey.encryptedData, wrappingKey }),
    ).rejects.toThrow('Invalid data encryption key')
  }
})

test('Cipher - unwrapDek rejects tampered ciphertext, tag and IV', async () => {
  const dek = await generateDek()
  const wrappingKey = await generateDek()
  const wrapped = await wrapDek({ dek, wrappingKey })
  const full = { ...wrapped, data: wrapped.encryptedData }

  const flipFirstByte = (binaryString) =>
    String.fromCharCode(binaryString.charCodeAt(0) ^ 0xff) +
    binaryString.slice(1)

  const tampered = [
    { ...full, data: flipFirstByte(full.data) },
    { ...full, tag: flipFirstByte(full.tag) },
    { ...full, iv: flipFirstByte(full.iv) },
  ]

  for (const wrapper of tampered) {
    await expect(unwrapDek({ ...wrapper, wrappingKey })).rejects.toThrow(
      'Incorrect password',
    )
  }
})

test('Cipher - wrapDek uses a fresh IV for every wrap', async () => {
  const dek = await generateDek()
  const wrappingKey = await generateDek()

  const first = await wrapDek({ dek, wrappingKey })
  const second = await wrapDek({ dek, wrappingKey })

  expect(first.iv).not.toBe(second.iv)
  expect(first.encryptedData).not.toBe(second.encryptedData)

  await expect(
    unwrapDek({ ...first, data: first.encryptedData, wrappingKey }),
  ).resolves.toStrictEqual(dek)
  await expect(
    unwrapDek({ ...second, data: second.encryptedData, wrappingKey }),
  ).resolves.toStrictEqual(dek)
})

test('Cipher - generateDek uses crypto.getRandomValues', async () => {
  const originalGetRandomValues = crypto.getRandomValues.bind(crypto)
  const mockGetRandomValues = jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = 0x5a
    return arr
  })
  crypto.getRandomValues = mockGetRandomValues

  const dek = await generateDek()

  expect(mockGetRandomValues).toHaveBeenCalled()
  expect(dek).toStrictEqual(new Array(DEKSIZE).fill(0x5a))

  crypto.getRandomValues = originalGetRandomValues
})

test('Cipher - wrapDek accepts a Uint8Array DEK and unwraps to a plain array', async () => {
  const wrappingKey = await generateDek()
  const dek = new Uint8Array(DEKSIZE).fill(7)

  const wrapped = await wrapDek({ dek, wrappingKey })
  const unwrapped = await unwrapDek({
    ...wrapped,
    data: wrapped.encryptedData,
    wrappingKey,
  })

  expect(Array.isArray(unwrapped)).toBe(true)
  expect(unwrapped).toStrictEqual(new Array(DEKSIZE).fill(7))
})

test('Cipher - a wrapped DEK survives a JSON round trip at byte value edges', async () => {
  const wrappingKey = await generateDek()

  const edgeCases = [
    new Array(DEKSIZE).fill(0x00),
    new Array(DEKSIZE).fill(0xff),
    Array.from({ length: DEKSIZE }, (_, i) => (i % 2 ? 0x00 : 0xff)),
  ]

  for (const dek of edgeCases) {
    const wrapped = await wrapDek({ dek, wrappingKey })
    const restored = JSON.parse(JSON.stringify(wrapped))

    const unwrapped = await unwrapDek({
      ...restored,
      data: restored.encryptedData,
      wrappingKey,
    })

    expect(unwrapped).toStrictEqual(dek)
  }
})

test('Cipher - generatePBKDF2Key accepts version 4 and yields a 32 byte key', async () => {
  const salt = 'fixedsalt'
  const password = 'MyStr0ng!Pass'

  const { key: v4Key } = await generatePBKDF2Key({
    password,
    salt,
    version: ENVELOPE_ENCRYPTION_VERSION,
  })
  const { key: v3Key } = await generatePBKDF2Key({ password, salt, version: 3 })

  expect(v4Key.length).toBe(DEKSIZE)
  expect(v4Key).toStrictEqual(v3Key)
})

test('Cipher - ENCRYPTION_VERSIONS exposes every supported version', () => {
  expect(Object.keys(ENCRYPTION_VERSIONS)).toStrictEqual(['1', '2', '3', '4'])
  expect(() => getVersionConfig(5)).toThrow('Unknown encryption version: 5')
})

test('Cipher - hexToBytes returns an empty array for unusable input', () => {
  expect(hexToBytes('')).toStrictEqual(new Uint8Array())
  expect(hexToBytes(undefined)).toStrictEqual(new Uint8Array())
  expect(hexToBytes(null)).toStrictEqual(new Uint8Array())
})

test('Cipher - deriveKekFromPrf is deterministic and returns a 32 byte key', async () => {
  const prfOutput = [...crypto.getRandomValues(new Uint8Array(DEKSIZE))]

  const first = await deriveKekFromPrf(prfOutput)
  const second = await deriveKekFromPrf(prfOutput)

  expect(first.length).toBe(DEKSIZE)
  expect(Array.isArray(first)).toBe(true)
  expect(first).toStrictEqual(second)
})

test('Cipher - deriveKekFromPrf never returns the raw PRF output', async () => {
  const prfOutput = [...crypto.getRandomValues(new Uint8Array(DEKSIZE))]
  const other = [...crypto.getRandomValues(new Uint8Array(DEKSIZE))]

  const kek = await deriveKekFromPrf(prfOutput)

  expect(kek).not.toStrictEqual(prfOutput)
  expect(kek).not.toStrictEqual(await deriveKekFromPrf(other))
})

test('Cipher - deriveKekFromPrf rejects anything that is not 32 bytes', async () => {
  const invalid = [
    [1, 2, 3],
    new Array(DEKSIZE + 1).fill(1),
    [],
    undefined,
    null,
  ]

  for (const prfOutput of invalid) {
    await expect(deriveKekFromPrf(prfOutput)).rejects.toThrow(
      'Invalid PRF output',
    )
  }
})

test('Cipher - a DEK wrapped by a PRF-derived key round trips', async () => {
  const dek = await generateDek()
  const prfOutput = [...crypto.getRandomValues(new Uint8Array(DEKSIZE))]

  const wrappingKey = await deriveKekFromPrf(prfOutput)
  const wrapped = await wrapDek({ dek, wrappingKey })

  await expect(
    unwrapDek({
      ...wrapped,
      data: wrapped.encryptedData,
      wrappingKey: await deriveKekFromPrf(prfOutput),
    }),
  ).resolves.toStrictEqual(dek)

  await expect(
    unwrapDek({
      ...wrapped,
      data: wrapped.encryptedData,
      wrappingKey: prfOutput,
    }),
  ).rejects.toThrow('Incorrect password')
})

test('Cipher - keys must be real bytes, not just the right length', async () => {
  const dek = await generateDek()
  const notBytes = [
    new Array(DEKSIZE).fill(undefined),
    new Array(DEKSIZE).fill(NaN),
    new Array(DEKSIZE).fill(1.5),
    new Array(DEKSIZE).fill(256),
    new Array(DEKSIZE).fill(-1),
    'a'.repeat(DEKSIZE),
    { length: DEKSIZE },
  ]

  for (const value of notBytes) {
    await expect(wrapDek({ dek: value, wrappingKey: dek })).rejects.toThrow(
      'Invalid data encryption key',
    )
    await expect(wrapDek({ dek, wrappingKey: value })).rejects.toThrow(
      'Invalid wrapping key',
    )
    await expect(deriveKekFromPrf(value)).rejects.toThrow('Invalid PRF output')
  }
})

test('Cipher - typed arrays are accepted as keys', async () => {
  const dek = new Uint8Array(DEKSIZE).fill(3)
  const wrappingKey = new Uint8Array(DEKSIZE).fill(9)

  const wrapped = await wrapDek({ dek, wrappingKey })

  await expect(
    unwrapDek({ ...wrapped, data: wrapped.encryptedData, wrappingKey }),
  ).resolves.toStrictEqual([...dek])
})

test('Cipher - additional data must match on decryption', async () => {
  const key = await generateDek()
  const encrypted = await encryptAES({ data: 'secret', key, aad: 'context/a' })

  await expect(
    decryptAES({
      ...encrypted,
      data: encrypted.encryptedData,
      key,
      aad: 'context/a',
    }),
  ).resolves.toBeDefined()

  await expect(
    decryptAES({
      ...encrypted,
      data: encrypted.encryptedData,
      key,
      aad: 'context/b',
    }),
  ).rejects.toThrow('Incorrect password')

  await expect(
    decryptAES({ ...encrypted, data: encrypted.encryptedData, key }),
  ).rejects.toThrow('Incorrect password')
})

test('Cipher - data written without additional data still decrypts without it', async () => {
  const key = await generateDek()
  const encrypted = await encryptAES({ data: 'legacy', key })

  const decrypted = await decryptAES({
    ...encrypted,
    data: encrypted.encryptedData,
    key,
  })

  expect(Buffer.from(decrypted).toString()).toBe('legacy')
})

test('Cipher - a DEK wrapper is bound to the wrapper it belongs to', async () => {
  const dek = await generateDek()
  const wrappingKey = await generateDek()

  const wrapped = await wrapDek({
    dek,
    wrappingKey,
    aad: wrapperAad('password'),
  })

  await expect(
    unwrapDek({
      ...wrapped,
      data: wrapped.encryptedData,
      wrappingKey,
      aad: wrapperAad('some-credential-id'),
    }),
  ).rejects.toThrow('Incorrect password')
})

test('Cipher - the aad builders are distinct per purpose and per field', () => {
  expect(contentAad('btcEncryptedSeed')).not.toBe(
    contentAad('encryptedMlMainnetPrivateKey'),
  )
  expect(wrapperAad('password')).not.toBe(wrapperAad('cred'))
  expect(htlsAad('a')).not.toBe(htlsAad('b'))
  expect(contentAad('x')).not.toBe(wrapperAad('x'))
  expect(contentAad('x')).not.toBe(htlsAad('x'))
})

test('Cipher - the passkey KEK derivation is pinned to a known vector', async () => {
  const prfOutput = Array.from({ length: 32 }, (_, i) => i)

  expect(await deriveKekFromPrf(prfOutput)).toStrictEqual([
    128, 134, 211, 213, 27, 178, 194, 105, 0, 85, 111, 79, 63, 120, 223, 76, 3,
    92, 102, 175, 17, 153, 205, 237, 54, 226, 12, 209, 117, 179, 157, 239,
  ])
})

const KNOWN_PASSWORD = 'correct horse battery staple'
const KNOWN_SALT = '000102030405060708090a0b0c0d0e0f'
const fromCodes = (codes) => String.fromCharCode(...codes)

test.each([
  [1, [54, 3, 60, 234, 152, 152, 20, 171, 192, 66, 40, 128, 46, 37, 81, 44]],
  [
    2,
    [99, 123, 106, 23, 174, 237, 18, 166, 11, 134, 179, 112, 110, 201, 235, 79],
  ],
  [
    3,
    [
      99, 123, 106, 23, 174, 237, 18, 166, 11, 134, 179, 112, 110, 201, 235, 79,
      147, 133, 30, 40, 70, 44, 26, 215, 254, 11, 159, 186, 168, 109, 179, 6,
    ],
  ],
  [
    4,
    [
      99, 123, 106, 23, 174, 237, 18, 166, 11, 134, 179, 112, 110, 201, 235, 79,
      147, 133, 30, 40, 70, 44, 26, 215, 254, 11, 159, 186, 168, 109, 179, 6,
    ],
  ],
])(
  'Cipher - the v%i key derivation is pinned to a known vector',
  async (version, expected) => {
    const { key } = await generatePBKDF2Key({
      password: KNOWN_PASSWORD,
      salt: KNOWN_SALT,
      version,
    })

    expect(key).toStrictEqual(expected)
  },
)

test('Cipher - a blob encrypted before this change still decrypts', async () => {
  const { key } = await generatePBKDF2Key({
    password: KNOWN_PASSWORD,
    salt: KNOWN_SALT,
    version: 4,
  })

  const decrypted = await decryptAES({
    data: fromCodes([
      107, 143, 59, 183, 211, 112, 106, 253, 33, 97, 249, 54, 47, 237, 187, 183,
      59, 154, 142, 159, 223, 35, 203, 194, 204, 252, 98, 17,
    ]),
    iv: fromCodes([16, 167, 231, 76, 225, 178, 64, 6, 199, 106, 255, 246]),
    tag: fromCodes([
      27, 133, 117, 246, 162, 232, 227, 29, 64, 161, 172, 141, 11, 201, 145, 46,
    ]),
    key,
    aad: contentAad('btcEncryptedSeed'),
  })

  expect(new TextDecoder().decode(decrypted)).toBe('attack at dawn')
})

test('Cipher - the additional data strings are part of the stored format', () => {
  expect(contentAad('btcEncryptedSeed')).toBe(
    'mojito/v4/content/btcEncryptedSeed',
  )
  expect(wrapperAad('password')).toBe('mojito/v4/dek/password')
  expect(htlsAad('abc')).toBe('mojito/v4/htls/abc')
})
