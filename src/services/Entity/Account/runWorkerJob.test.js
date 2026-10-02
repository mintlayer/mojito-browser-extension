import runWorkerJob from './runWorkerJob'

class FakeWorker {
  constructor() {
    this.terminated = false
  }

  postMessage() {
    const response = this.nextResponse
    if (response?.__workerError) {
      Promise.resolve().then(() => this.onerror(response.event))
    } else if (response !== undefined) {
      Promise.resolve().then(() => this.onmessage({ data: response }))
    }
  }

  terminate() {
    this.terminated = true
  }
}

describe('runWorkerJob (worker error contract)', () => {
  test('resolves the response payload and terminates the worker', async () => {
    const worker = new FakeWorker()
    worker.nextResponse = { key: 'key', salt: 'salt' }

    const result = await runWorkerJob(worker, 'GENERATE_PBKDF2_KEY', 'pass')

    expect(result).toEqual({ key: 'key', salt: 'salt' })
    expect(worker.terminated).toBe(true)
  })

  test('posts a { job, data } envelope', async () => {
    const worker = new FakeWorker()
    const postMessageSpy = jest.spyOn(worker, 'postMessage')
    worker.nextResponse = 'result'

    await runWorkerJob(worker, 'GET_SEED_FROM_MNEMONIC', 'mnemonic')

    expect(postMessageSpy).toHaveBeenCalledWith({
      job: 'GET_SEED_FROM_MNEMONIC',
      data: 'mnemonic',
    })
  })

  test('REJECTS when the worker responds with an { error } payload', async () => {
    const worker = new FakeWorker()
    worker.nextResponse = { error: 'job failed' }

    await expect(runWorkerJob(worker, 'ENCRYPT_AES', {})).rejects.toThrow(
      'job failed',
    )
    expect(worker.terminated).toBe(true)
  })

  test('rejects when the worker itself errors (onerror)', async () => {
    const worker = new FakeWorker()
    worker.nextResponse = {
      __workerError: true,
      event: { message: 'worker crashed' },
    }

    await expect(runWorkerJob(worker, 'ENCRYPT_AES', {})).rejects.toThrow(
      'worker crashed',
    )
    expect(worker.terminated).toBe(true)
  })

  test('rejects with a generic message when onerror has no message', async () => {
    const worker = new FakeWorker()
    worker.nextResponse = { __workerError: true, event: {} }

    await expect(runWorkerJob(worker, 'ENCRYPT_AES', {})).rejects.toThrow(
      'Worker error',
    )
  })
})
