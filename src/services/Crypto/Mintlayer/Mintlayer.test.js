import {
  getOutputs,
  getPrivateKeyFromMnemonic,
  getWalletAddresses,
  getWalletPrivKeysList,
} from './Mintlayer'
import { batchRequestMintlayer } from '../../API/Mintlayer/Mintlayer'

jest.mock('../../API/Mintlayer/Mintlayer', () => ({
  batchRequestMintlayer: jest.fn(),
}))

// Deterministic wasm stub. The jest moduleNameMapper normally redirects
// wasm_wrappers.js to the raw wasm glue, which cannot run in jsdom without
// the real binary — so the derive path is stubbed here. Address encoding:
// byte 0 marks the chain (1 = receiving, 2 = change), byte 1 the key index,
// and the network byte (0 = mainnet) picks the bech32 prefix, so every
// derived address is predictable and self-describing.
jest.mock('./@mintlayerlib-js/wasm_wrappers.js', () => ({
  __esModule: true,
  default: jest.fn(),
  init: jest.fn(),
  make_receiving_address: jest.fn(
    (privKey, index) => new Uint8Array([1, index]),
  ),
  make_change_address: jest.fn((privKey, index) => new Uint8Array([2, index])),
  public_key_from_private_key: jest.fn((privKey) => Uint8Array.from(privKey)),
  pubkey_to_pubkeyhash_address: jest.fn(
    (pubKey, network) =>
      `${network === 0 ? 'mtc1' : 'tmt1'}${
        pubKey[0] === 1 ? 'r' : 'c'
      }${pubKey[1]}`,
  ),
}))

const ML_PRIV_KEY = new Uint8Array([1, 2, 3, 4])

describe('Mintlayer argument validation', () => {
  test('getPrivateKeyFromMnemonic throws on an unknown networkType', () => {
    expect(() => getPrivateKeyFromMnemonic('mnemonic', 'chaosnet')).toThrow(
      'Unknown Mintlayer network type: chaosnet',
    )
  })

  test('getOutputs throws on an unknown output type', () => {
    expect(() =>
      getOutputs({
        amount: '1000',
        address: 'address',
        networkType: 'testnet',
        type: 'TransferAndFly',
      }),
    ).toThrow('Unknown output type: TransferAndFly')
  })

  test('getOutputs throws on an unknown lock type', () => {
    expect(() =>
      getOutputs({
        amount: '1000',
        address: 'address',
        networkType: 'testnet',
        type: 'LockThenTransfer',
        lock: { type: 'UntilHeight', content: 100 },
      }),
    ).toThrow('Unknown lock type: UntilHeight')
  })

  test('getOutputs throws when LockThenTransfer has no lock', () => {
    expect(() =>
      getOutputs({
        amount: '1000',
        address: 'address',
        networkType: 'testnet',
        type: 'LockThenTransfer',
      }),
    ).toThrow('LockThenTransfer requires a lock')
  })

  test('getOutputs throws on an unknown networkType', () => {
    expect(() =>
      getOutputs({
        amount: '1000',
        address: 'address',
        networkType: 'chaosnet',
        type: 'Transfer',
      }),
    ).toThrow('Unknown Mintlayer network type: chaosnet')
  })
})

describe('getWalletAddresses (address discovery)', () => {
  beforeEach(() => {
    batchRequestMintlayer.mockReset()
  })

  test('stops discovery at the first batch containing per-item errors (unused addresses)', async () => {
    // Per-item errors are the server's "address unused" signal: they must map
    // to used=false and stop the discovery loop — it may only continue while
    // EVERY address of a batch is used. Item 0 = error (unused), item 1 =
    // empty history (unused), item 2 = used. One unused entry must end it.
    batchRequestMintlayer.mockImplementation(async ({ ids }) =>
      ids.map((id, index) => {
        if (index === 0) {
          return { error: 'Address not found in wallet database' }
        }
        if (index === 1) {
          return { transaction_history: [] }
        }
        return { transaction_history: [{ hash: 'txhash' }] }
      }),
    )

    const result = await getWalletAddresses(ML_PRIV_KEY, 'mainnet', 3)

    // Exactly one batch per chain (receiving + change): the partially-unused
    // batch terminated the loop instead of pulling batch 2.
    expect(batchRequestMintlayer).toHaveBeenCalledTimes(2)
    expect(batchRequestMintlayer).toHaveBeenCalledWith({
      ids: ['mtc1r0', 'mtc1r1', 'mtc1r2'],
      type: '/address/:address',
    })
    expect(batchRequestMintlayer).toHaveBeenCalledWith({
      ids: ['mtc1c0', 'mtc1c1', 'mtc1c2'],
      type: '/address/:address',
    })

    // The error-item address still belongs to the wallet: unused(false) means
    // "keep it", not "drop it" or "crash".
    expect(result.mlReceivingAddresses).toEqual(['mtc1r0', 'mtc1r1', 'mtc1r2'])
    expect(result.mlChangeAddresses).toEqual(['mtc1c0', 'mtc1c1', 'mtc1c2'])
    expect(result.mlReceivingPublicKeys).toHaveLength(3)
    expect(result.mlChangePublicKeys).toHaveLength(3)
  })

  test('continues discovery while every address of a batch is used, then stops', async () => {
    // The other half of the loop contract: a fully-used batch must fetch the
    // next batch with the right offset (indices 3-5), and discovery stops at
    // the first batch that contains an unused address.
    batchRequestMintlayer.mockImplementation(async ({ ids }) =>
      ids.map((id, index) => {
        if (Number(id.slice(-1)) < 3) {
          return { transaction_history: [{ hash: 'txhash' }] }
        }
        return index === 0
          ? { transaction_history: [] }
          : { transaction_history: [{ hash: 'txhash' }] }
      }),
    )

    const result = await getWalletAddresses(ML_PRIV_KEY, 'mainnet', 3)

    // 2 batches x 2 chains, then the unused address in batch 2 ended it.
    expect(batchRequestMintlayer).toHaveBeenCalledTimes(4)
    expect(batchRequestMintlayer).toHaveBeenCalledWith({
      ids: ['mtc1r3', 'mtc1r4', 'mtc1r5'],
      type: '/address/:address',
    })
    expect(result.mlReceivingAddresses).toEqual([
      'mtc1r0',
      'mtc1r1',
      'mtc1r2',
      'mtc1r3',
      'mtc1r4',
      'mtc1r5',
    ])
    expect(result.mlChangeAddresses).toEqual([
      'mtc1c0',
      'mtc1c1',
      'mtc1c2',
      'mtc1c3',
      'mtc1c4',
      'mtc1c5',
    ])
  })

  test('rejects when batchRequestMintlayer rejects (request-level failure)', async () => {
    batchRequestMintlayer.mockRejectedValue(
      new Error('All Mintlayer servers failed'),
    )

    await expect(getWalletAddresses(ML_PRIV_KEY, 'testnet', 3)).rejects.toThrow(
      'All Mintlayer servers failed',
    )
  })

  test('a batch with an empty results array terminates after one batch', async () => {
    batchRequestMintlayer.mockResolvedValue([])

    const result = await getWalletAddresses(ML_PRIV_KEY, 'testnet', 3)

    // Empty usage data cannot be "all used": the loop must not spin.
    expect(batchRequestMintlayer).toHaveBeenCalledTimes(2)
    expect(result.mlReceivingAddresses).toEqual(['tmt1r0', 'tmt1r1', 'tmt1r2'])
    expect(result.mlChangeAddresses).toEqual(['tmt1c0', 'tmt1c1', 'tmt1c2'])
  })
})

describe('getWalletPrivKeysList with an address list', () => {
  test('yields one keyed privkey entry per address on mainnet and testnet', () => {
    // Callers pass [...receiving, ...change]; its length is the coverage
    // count used for BOTH chains.
    const addressList = ['mtc1r0', 'mtc1r1', 'mtc1c0', 'mtc1c1']

    const mainnet = getWalletPrivKeysList(ML_PRIV_KEY, 'mainnet', addressList)

    expect(Object.keys(mainnet.mlReceivingPrivKeys)).toEqual([
      'mtc1r0',
      'mtc1r1',
      'mtc1r2',
      'mtc1r3',
    ])
    expect(Object.keys(mainnet.mlChangePrivKeys)).toEqual([
      'mtc1c0',
      'mtc1c1',
      'mtc1c2',
      'mtc1c3',
    ])
    expect(mainnet.mlReceivingPrivKeys.mtc1r0).toEqual(new Uint8Array([1, 0]))
    expect(mainnet.mlReceivingPrivKeys.mtc1r1).toEqual(new Uint8Array([1, 1]))
    expect(mainnet.mlChangePrivKeys.mtc1c0).toEqual(new Uint8Array([2, 0]))
    expect(mainnet.mlChangePrivKeys.mtc1c3).toEqual(new Uint8Array([2, 3]))
    expect(mainnet.mlReceivingPublicKeys).toHaveLength(4)
    expect(mainnet.mlChangePublicKeys).toHaveLength(4)

    const testnet = getWalletPrivKeysList(ML_PRIV_KEY, 'testnet', addressList)

    expect(Object.keys(testnet.mlReceivingPrivKeys)).toEqual([
      'tmt1r0',
      'tmt1r1',
      'tmt1r2',
      'tmt1r3',
    ])
    expect(Object.keys(testnet.mlChangePrivKeys)).toEqual([
      'tmt1c0',
      'tmt1c1',
      'tmt1c2',
      'tmt1c3',
    ])
    expect(testnet.mlReceivingPrivKeys.tmt1r0).toEqual(new Uint8Array([1, 0]))
    expect(testnet.mlChangePrivKeys.tmt1c3).toEqual(new Uint8Array([2, 3]))
  })
})
