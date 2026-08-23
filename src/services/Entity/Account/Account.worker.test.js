import { toWorkerError } from 'src/services/Crypto/Worker/WorkerContract'
import { runJob } from './Account.worker'

const fakeWorker = (respond) => {
  const worker = {
    terminate: jest.fn(),
    postMessage: jest.fn(() => {
      Promise.resolve().then(() => respond(worker))
    }),
  }

  return worker
}

test('Account.worker - resolves with the payload the worker posts', async () => {
  const payload = { key: [1, 2, 3], salt: 'aabb' }
  const worker = fakeWorker((w) => w.onmessage({ data: payload }))

  await expect(runJob(() => worker, { job: 'ANY' })).resolves.toStrictEqual(
    payload,
  )
  expect(worker.postMessage).toHaveBeenCalledWith({ job: 'ANY' })
  expect(worker.terminate).toHaveBeenCalled()
})

test('Account.worker - rejects when the worker posts an error envelope', async () => {
  const worker = fakeWorker((w) =>
    w.onmessage({ data: toWorkerError(new Error('Incorrect password')) }),
  )

  await expect(runJob(() => worker, { job: 'ANY' })).rejects.toThrow(
    'Incorrect password',
  )
  expect(worker.terminate).toHaveBeenCalled()
})

test('Account.worker - rejects when the worker itself fails', async () => {
  const worker = fakeWorker((w) => w.onerror({ message: 'boom' }))

  await expect(runJob(() => worker, { job: 'ANY' })).rejects.toThrow('boom')
  expect(worker.terminate).toHaveBeenCalled()
})

test('Account.worker - rejects with a fallback message when the failure has none', async () => {
  const worker = fakeWorker((w) => w.onerror({}))

  await expect(runJob(() => worker, { job: 'ANY' })).rejects.toThrow(
    'Worker failed',
  )
})

describe('the job builders forward every field they are given', () => {
  let posted
  let worker

  beforeEach(async () => {
    posted = []
    worker = {
      terminate: jest.fn(),
      postMessage: (message) => {
        posted.push(message)
        Promise.resolve().then(() => worker.onmessage({ data: 'ok' }))
      },
    }
    global.Worker = jest.fn(() => worker)
  })

  afterEach(() => {
    delete global.Worker
  })

  test('encryptSeed carries the additional data', async () => {
    const { encryptSeed } = await import('./Account.worker')

    await encryptSeed({
      data: 'plain',
      key: [1, 2],
      aad: 'mojito/v4/content/x',
    })

    expect(posted[0]).toStrictEqual({
      job: 'ENCRYPT_AES',
      data: { data: 'plain', key: [1, 2], aad: 'mojito/v4/content/x' },
    })
  })

  test('decryptSeed carries the additional data', async () => {
    const { decryptSeed } = await import('./Account.worker')

    await decryptSeed({
      data: 'cipher',
      key: [1, 2],
      iv: 'iv',
      tag: 'tag',
      aad: 'mojito/v4/content/x',
    })

    expect(posted[0]).toStrictEqual({
      job: 'DECRYPT_AES',
      data: {
        data: 'cipher',
        key: [1, 2],
        iv: 'iv',
        tag: 'tag',
        aad: 'mojito/v4/content/x',
      },
    })
  })

  test('generateEncryptionKey carries salt and version', async () => {
    const { generateEncryptionKey } = await import('./Account.worker')

    await generateEncryptionKey({ password: 'p', salt: 'aabb', version: 4 })

    expect(posted[0]).toStrictEqual({
      job: 'GENERATE_PBKDF2_KEY',
      data: { password: 'p', salt: 'aabb', version: 4 },
    })
  })

  test('every cipher payload field reaches the worker untouched', async () => {
    const { encryptSeed } = await import('./Account.worker')
    const payload = { data: 'a', key: [1], aad: 'b', future: 'c' }

    await encryptSeed(payload)

    expect(posted[0].data).toStrictEqual(payload)
  })
})
