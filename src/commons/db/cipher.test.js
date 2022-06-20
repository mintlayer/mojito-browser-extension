import {
  generateSalt,
  generatePBKDF2Key,
  generateIV,
  encryptAES,
  decryptAES,
  hexToBytes,
  IVSIZE
} from './cipher'

test('Cipher - HEX to Bytes', () => {
  const hex = '6162636465' //abcde
  const bytes = new Uint8Array([97, 98, 99, 100, 101])

  expect(hexToBytes(hex)).toStrictEqual(bytes)
  expect(Buffer.from(bytes).toString('hex')).toBe(hex)
})

test('Cipher - generateSalt', async () => {
  const salt1 = await generateSalt(1)
  const salt2 = await generateSalt(2)

  expect(hexToBytes(salt1).length).toBe(1)
  expect(hexToBytes(salt2).length).toBe(2)
})

test('Cipher - generateSalt random', async () => {
  const random = {
    getBytes: jest.fn(() => new Uint8Array([97]))
  }
  const salt1 = await generateSalt(1, random)

  expect(hexToBytes(salt1).length).toBe(1)
  expect(random.getBytes).toBeCalled()
})

test('Cipher - generateSalt utils', async () => {
  const util = {
    bytesToHex: jest.fn(() => 61)
  }
  const salt = await generateSalt(1, undefined, util)

  expect(salt).toBe(61)
  expect(util.bytesToHex).toBeCalled()
})

test('Cipher - generatePBKDF2Key', async () => {
  const password = 'teste'

  const { key: key1, salt: salt1 } = await generatePBKDF2Key({ password })

  const { key: key2, salt: salt2 } = await generatePBKDF2Key({
    password,
    salt: salt1
  })

  expect(key1).toStrictEqual(key2)
  expect(salt1).toStrictEqual(salt2)
})

test('Cipher - generatePBKDF2Key derivationFn', async () => {
  const password = 'teste'
  const salt = 'salt'
  const derivationFn = () => [12]

  const { key: key1, salt: salt1 } = await generatePBKDF2Key({ password, salt, derivationFn})

  expect(key1).toStrictEqual([12])
  expect(salt1).toStrictEqual(salt)
})

test('Cipher - generateIV', async () => {
  const iv = await generateIV()
  expect(iv.length).toBe(IVSIZE)
})

test('Cipher - generateIV utils', async () => {
  const bytes = [0]
  const random = {
    getBytes: jest.fn(() => bytes)
  }

  const iv = await generateIV(random)
  expect(iv.length).toBe(bytes.length)
  expect(random.getBytes).toBeCalled()
})

test('Cipher - encryptAES', async () => {
  const data = 'data'
  const key = [97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98]
  const { encryptedData, iv, tag } = await encryptAES({data, key})

  expect(encryptedData).toBeDefined()
  expect(iv).toBeDefined()
  expect(tag).toBeDefined()
})

test('Cipher - decryptAES', async () => {
  const data = 'data'
  const key = [97, 98, 99, 100, 101, 97, 98, 99, 100, 101, 97, 98, 100, 101, 97, 98]
  const { encryptedData, iv, tag } = await encryptAES({data, key})
  const decrypted = await decryptAES({
    data: encryptedData,
    iv,
    tag,
    key
  })

  expect(Buffer.from(decrypted).toString()).toBe(data)
})
