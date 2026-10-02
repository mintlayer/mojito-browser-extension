import {
  generateSecret,
  generateSecretHash,
  secretToHex,
  hexToSecret,
  validateSecretHex,
  generateSecretObject,
  createSecretObjectFromHex,
} from './Secret'

const originalGetRandomValues = global.crypto.getRandomValues

// Deterministic CSPRNG: fills the array with 0, 1, 2, ... so assertions are stable
beforeEach(() => {
  global.crypto.getRandomValues = jest.fn((array) => {
    for (let i = 0; i < array.length; i += 1) {
      array[i] = i % 256
    }
    return array
  })
})

afterEach(() => {
  global.crypto.getRandomValues = originalGetRandomValues
})

describe('generateSecret', () => {
  it('generates a 32-byte secret using crypto.getRandomValues', () => {
    const secret = generateSecret()

    expect(global.crypto.getRandomValues).toHaveBeenCalledTimes(1)
    expect(global.crypto.getRandomValues).toHaveBeenCalledWith(
      expect.any(Uint8Array),
    )
    expect(secret).toBeInstanceOf(Uint8Array)
    expect(secret).toHaveLength(32)
  })

  it('fills the secret with CSPRNG output', () => {
    const secret = generateSecret()

    expect(Array.from(secret)).toStrictEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
    ])
  })
})

describe('generateSecretHash', () => {
  it('hashes SHA256 -> RIPEMD160 (known vector: "abc")', () => {
    const secret = Uint8Array.from([97, 98, 99]) // 'abc'
    const hash = generateSecretHash(secret)

    expect(secretToHex(hash)).toBe('bb1be98c142444d7a56aa3981c3942a978e4dc33')
  })

  it('returns a 20-byte hash', () => {
    const hash = generateSecretHash(new Uint8Array([1, 2, 3]))

    expect(hash).toHaveLength(20)
    expect(Array.from(hash)).toHaveLength(20)
  })
})

describe('secretToHex', () => {
  it('converts a secret to its hex representation', () => {
    const secret = new Uint8Array([0, 255, 16])

    expect(secretToHex(secret)).toBe('00ff10')
  })
})

describe('hexToSecret', () => {
  it('converts a hex string back to a secret', () => {
    const secret = hexToSecret('00ff10')

    expect(secret).toBeInstanceOf(Uint8Array)
    expect(Array.from(secret)).toStrictEqual([0, 255, 16])
  })

  it('round-trips through secretToHex', () => {
    const secret = new Uint8Array([9, 8, 7, 6, 5, 4, 3, 2, 1, 0])

    expect(Array.from(hexToSecret(secretToHex(secret)))).toStrictEqual(
      Array.from(secret),
    )
  })
})

describe('validateSecretHex', () => {
  const validHex = 'a'.repeat(64)

  it('accepts a valid 64 character hex string', () => {
    expect(validateSecretHex(validHex)).toBe(true)
  })

  it('accepts uppercase hex', () => {
    expect(validateSecretHex(validHex.toUpperCase())).toBe(true)
  })

  it('accepts hex surrounded by whitespace', () => {
    expect(validateSecretHex(`  ${validHex}  `)).toBe(true)
  })

  it('rejects non-string input', () => {
    expect(validateSecretHex(null)).toBe(false)
    expect(validateSecretHex(undefined)).toBe(false)
    expect(validateSecretHex(123)).toBe(false)
  })

  it('rejects empty and wrong-length strings', () => {
    expect(validateSecretHex('')).toBe(false)
    expect(validateSecretHex('a'.repeat(63))).toBe(false)
    expect(validateSecretHex('a'.repeat(65))).toBe(false)
  })

  it('rejects non-hex characters', () => {
    expect(validateSecretHex(`${'g'.repeat(63)}a`)).toBe(false)
    expect(validateSecretHex(`${'0'.repeat(63)}z`)).toBe(false)
  })
})

describe('generateSecretObject', () => {
  it('returns secret, hash and hex representations', () => {
    const secretObject = generateSecretObject()

    expect(secretObject.secret).toBeInstanceOf(Uint8Array)
    expect(secretObject.secret).toHaveLength(32)
    expect(secretObject.secretHash).toHaveLength(20)
    expect(secretObject.secretHex).toBe(
      '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    )
    expect(secretObject.secretHashHex).toBe(
      'ea4beb47def8492389a1e16634795441e1b87245',
    )
  })

  it('hash matches the generated secret', () => {
    const { secret, secretHash, secretHashHex } = generateSecretObject()

    expect(generateSecretHash(secret)).toStrictEqual(secretHash)
    expect(secretToHex(secretHash)).toBe(secretHashHex)
  })
})

describe('createSecretObjectFromHex', () => {
  it('returns null for an invalid hex string', () => {
    expect(createSecretObjectFromHex('not-hex')).toBeNull()
    expect(createSecretObjectFromHex('a'.repeat(63))).toBeNull()
    expect(createSecretObjectFromHex(undefined)).toBeNull()
  })

  it('creates a secret object from a valid hex string, lowercasing it', () => {
    const upperHex = 'A'.repeat(64)
    const secretObject = createSecretObjectFromHex(upperHex)

    expect(secretObject.secretHex).toBe('a'.repeat(64))
    expect(Array.from(secretObject.secret)).toStrictEqual(
      Array.from(new Uint8Array(32).fill(0xaa)),
    )
    expect(secretObject.secretHashHex).toBe(
      'b3256e789b42b4e73b0954beb516ec7dfc032dd3',
    )
  })
})
