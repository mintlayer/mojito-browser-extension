import { AppInfo } from '@Constants'
import initWasm from 'src/tests/helpers/initWasm'
import * as ML from './Mintlayer'

const MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

beforeAll(() => initWasm())

test('Mintlayer - the real wasm module is loaded, not a mock', () => {
  const key = ML.getPrivateKeyFromMnemonic(
    MNEMONIC,
    AppInfo.NETWORK_TYPES.TESTNET,
  )

  expect(key).toBeInstanceOf(Uint8Array)
  expect(key.length).toBeGreaterThan(0)
})

test('Mintlayer - key derivation is deterministic and network specific', () => {
  const testnet = ML.getPrivateKeyFromMnemonic(
    MNEMONIC,
    AppInfo.NETWORK_TYPES.TESTNET,
  )
  const mainnet = ML.getPrivateKeyFromMnemonic(
    MNEMONIC,
    AppInfo.NETWORK_TYPES.MAINNET,
  )

  expect(
    ML.getPrivateKeyFromMnemonic(MNEMONIC, AppInfo.NETWORK_TYPES.TESTNET),
  ).toStrictEqual(testnet)
  expect(Buffer.from(testnet)).not.toStrictEqual(Buffer.from(mainnet))
})

test('Mintlayer - initWasm is idempotent', async () => {
  await expect(ML.initWasm()).resolves.toBeUndefined()
  await expect(ML.initWasm()).resolves.toBeUndefined()
})

test('Mintlayer - the import.meta stub does not touch new.target', () => {
  function Callable() {
    return new.target
  }

  expect(new Callable()).toBe(Callable)
  expect(Callable()).toBeUndefined()
})
