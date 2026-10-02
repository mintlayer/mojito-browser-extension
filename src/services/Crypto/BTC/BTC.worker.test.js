/**
 * BTC.worker error contract: a thrown job error must be posted back as
 * { error: message } (mirroring Cipher.worker.js) so the bridge can reject
 * instead of waiting forever.
 */
jest.mock('./BTC', () => ({
  generateMnemonic: jest.fn(
    () =>
      'abandon ability able about ancient boy amusing admire axis avoid barely blade',
  ),
  getSeedFromMnemonic: jest.fn(() => {
    throw new Error('boom')
  }),
}))

import { WalletWorkerEnum } from './BTC.worker'

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('BTC.worker', () => {
  let postMessageSpy

  beforeEach(() => {
    postMessageSpy = jest
      .spyOn(global, 'postMessage')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    postMessageSpy.mockRestore()
  })

  test('posts the job result on success', async () => {
    self.onmessage({
      data: { job: WalletWorkerEnum.GENERATE_MNEMONIC },
    })
    await flushMicrotasks()

    expect(postMessageSpy).toHaveBeenCalledTimes(1)
    expect(postMessageSpy).toHaveBeenCalledWith(expect.any(String))
    expect(postMessageSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.anything() }),
    )
  })

  test('posts { error } when the job throws', async () => {
    self.onmessage({
      data: {
        job: WalletWorkerEnum.GET_SEED_FROM_MNEMONIC,
        data: 'invalid input',
      },
    })
    await flushMicrotasks()

    expect(postMessageSpy).toHaveBeenCalledWith({ error: 'boom' })
  })

  test('posts nothing for an unknown job', async () => {
    self.onmessage({ data: { job: 'NOT_A_JOB' } })
    await flushMicrotasks()

    expect(postMessageSpy).not.toHaveBeenCalled()
  })
})
