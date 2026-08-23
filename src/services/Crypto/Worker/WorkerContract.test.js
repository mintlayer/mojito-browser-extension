import { WORKER_ERROR, toWorkerError, getWorkerError } from './WorkerContract'

test('WorkerContract - toWorkerError carries the message under the marker', () => {
  const envelope = toWorkerError(new Error('Incorrect password'))

  expect(envelope).toStrictEqual({ [WORKER_ERROR]: 'Incorrect password' })
  expect(getWorkerError(envelope)).toBe('Incorrect password')
})

test('WorkerContract - real job results are never mistaken for errors', () => {
  const results = [
    { key: [1, 2, 3], salt: 'aabb' },
    { encryptedData: 'x', iv: 'y', tag: 'z' },
    new Uint8Array([1, 2, 3]),
    [1, 2, 3],
    'a mnemonic phrase',
    0,
    null,
    undefined,
  ]

  results.forEach((result) => expect(getWorkerError(result)).toBeUndefined())
})

test('WorkerContract - a legacy payload with a plain error field is not an error envelope', () => {
  expect(getWorkerError({ error: 'Incorrect password' })).toBeUndefined()
})

describe('the cipher worker answers every message', () => {
  const reply = (message) =>
    new Promise((resolve) => {
      const post = globalThis.postMessage
      Object.defineProperty(globalThis, 'postMessage', {
        configurable: true,
        writable: true,
        value: (data) => {
          Object.defineProperty(globalThis, 'postMessage', {
            configurable: true,
            writable: true,
            value: post,
          })
          resolve(data)
        },
      })

      self.onmessage({ data: message })
    })

  beforeAll(() => require('src/services/Crypto/Cipher/Cipher.worker'))

  test('a valid job posts its result', async () => {
    const result = await reply({
      job: 'GENERATE_PBKDF2_KEY',
      data: { password: 'p', salt: 'aabb', version: 1 },
    })

    expect(getWorkerError(result)).toBeUndefined()
    expect(result.key.length).toBe(16)
  })

  test('a failing job posts an error envelope', async () => {
    const result = await reply({
      job: 'DECRYPT_AES',
      data: { data: 'x', key: new Array(32).fill(1), iv: 'i', tag: 't' },
    })

    expect(getWorkerError(result)).toBe('Incorrect password')
  })

  test('an unknown job posts an error envelope instead of hanging', async () => {
    const result = await reply({ job: 'NOPE' })

    expect(getWorkerError(result)).toBe('Unknown job: NOPE')
  })

  test('a missing job posts an error envelope', async () => {
    const result = await reply({})

    expect(getWorkerError(result)).toBe('Unknown job: undefined')
  })
})
