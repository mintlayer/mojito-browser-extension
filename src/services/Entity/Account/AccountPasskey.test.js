import { Cipher, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { LocalStorageService } from '@Storage'
import initWasm from 'src/tests/helpers/initWasm'

jest.mock('src/services/Crypto/Passkey/Passkey', () => ({
  __esModule: true,
  isSupported: jest.fn(() => true),
  enroll: jest.fn(),
  getPrfOutput: jest.fn(),
}))

const accountName = 'Savings'
const password = 'pass'
const btcOnly = { wallets: ['btc'] }
const MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

let Passkey
let Account

beforeAll(async () => {
  initWasm()
  Passkey = await import('src/services/Crypto/Passkey/Passkey')
  Account = await import('./Account')
})

beforeEach(() => {
  LocalStorageService.setItem('networkType', 'testnet')
  jest.clearAllMocks()
  Passkey.isSupported.mockReturnValue(true)
})

const createAccount = async () =>
  Account.saveAccount({
    name: accountName,
    password,
    mnemonic: MNEMONIC,
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: ['btc'],
  })

const stubCeremony = async (credentialId = 'cred-1') => {
  const prfOutput = await Cipher.generateDek()
  const prfSalt = 'c2FsdA'

  Passkey.enroll.mockResolvedValue({ credentialId, prfSalt, prfOutput })
  Passkey.getPrfOutput.mockResolvedValue({ credentialId, prfOutput })

  return { credentialId, prfSalt, prfOutput }
}

const receivingAddressesOf = (addresses) =>
  addresses.btcAddresses.btcReceivingAddresses.map(
    (entry) => Object.keys(entry)[0],
  )

test('AccountPasskey - enrolling stores a wrapper and unlocking uses it', async () => {
  const id = await createAccount()
  const { credentialId, prfSalt } = await stubCeremony()

  const result = await Account.enrollPasskey({
    accountId: id,
    password,
    label: 'Touch ID',
  })

  expect(result).toStrictEqual({ credentialId, label: 'Touch ID' })
  expect(Passkey.enroll).toHaveBeenCalledWith(accountName)

  const account = await Account.getAccount(id)
  const [wrapper] = account.wrappedDek.passkeys

  expect(wrapper.credentialId).toBe(credentialId)
  expect(wrapper.prfSalt).toBe(prfSalt)

  const byPasskey = await Account.unlockAccountWithPasskey(id, btcOnly)
  const byPassword = await Account.unlockAccount(id, password, btcOnly)

  expect(Passkey.getPrfOutput).toHaveBeenCalledWith([
    expect.objectContaining({ credentialId, prfSalt }),
  ])
  expect(receivingAddressesOf(byPasskey.addresses)).toStrictEqual(
    receivingAddressesOf(byPassword.addresses),
  )
})

test('AccountPasskey - enrolling does not touch the seed or the password wrapper', async () => {
  const id = await createAccount()
  await stubCeremony()

  const before = await Account.getAccount(id)
  await Account.enrollPasskey({ accountId: id, password, label: 'Touch ID' })
  const after = await Account.getAccount(id)

  expect(after.seed).toStrictEqual(before.seed)
  expect(after.wrappedDek.password).toStrictEqual(before.wrappedDek.password)
})

test('AccountPasskey - a wrong password cannot enroll a passkey', async () => {
  const id = await createAccount()
  await stubCeremony()

  await expect(
    Account.enrollPasskey({
      accountId: id,
      password: 'pasz',
      label: 'Touch ID',
    }),
  ).rejects.toBeDefined()

  expect(Passkey.enroll).not.toHaveBeenCalled()

  const account = await Account.getAccount(id)
  expect(account.wrappedDek.passkeys).toStrictEqual([])
})

test('AccountPasskey - enrolment is refused when the browser has no passkey support', async () => {
  const id = await createAccount()
  Passkey.isSupported.mockReturnValue(false)

  await expect(
    Account.enrollPasskey({ accountId: id, password, label: 'Touch ID' }),
  ).rejects.toBe('Passkeys are not available in this browser')
})

test('AccountPasskey - the same passkey cannot be enrolled twice', async () => {
  const id = await createAccount()
  await stubCeremony()

  await Account.enrollPasskey({ accountId: id, password, label: 'Touch ID' })

  await expect(
    Account.enrollPasskey({ accountId: id, password, label: 'Again' }),
  ).rejects.toBe('This passkey is already enrolled')
})

test('AccountPasskey - several passkeys can be enrolled and listed', async () => {
  const id = await createAccount()

  await stubCeremony('cred-1')
  await Account.enrollPasskey({ accountId: id, password, label: 'Laptop' })

  await stubCeremony('cred-2')
  await Account.enrollPasskey({ accountId: id, password, label: 'Phone' })

  const passkeys = await Account.getPasskeys(id)

  expect(passkeys.map((entry) => entry.label)).toStrictEqual([
    'Laptop',
    'Phone',
  ])
  expect(passkeys[0]).not.toHaveProperty('encryptedData')
  expect(passkeys[0]).not.toHaveProperty('prfSalt')
})

test('AccountPasskey - removing a passkey leaves the password working', async () => {
  const id = await createAccount()
  const { credentialId } = await stubCeremony()

  await Account.enrollPasskey({ accountId: id, password, label: 'Touch ID' })
  await Account.removePasskey({ accountId: id, credentialId })

  await expect(Account.getPasskeys(id)).resolves.toStrictEqual([])
  await expect(
    Account.unlockAccount(id, password, btcOnly),
  ).resolves.toBeDefined()
  await expect(Account.unlockAccountWithPasskey(id, btcOnly)).rejects.toBe(
    'No passkey is enrolled for this account',
  )
})

test('AccountPasskey - removing an unknown passkey is refused', async () => {
  const id = await createAccount()

  await expect(
    Account.removePasskey({ accountId: id, credentialId: 'nope' }),
  ).rejects.toBe('Passkey not found')
})

test('AccountPasskey - a legacy account must be unlocked with a password first', async () => {
  const { key, salt } = await Cipher.generatePBKDF2Key({ password, version: 3 })
  const blob = await Cipher.encryptAES({ data: 'x', key })

  const { IndexedDB } = await import('@Databases')
  const id = await IndexedDB.save(await IndexedDB.loadAccounts(), {
    name: accountName,
    salt,
    encryptionVersion: 3,
    iv: { btcIv: blob.iv },
    tag: { btcTag: blob.tag },
    seed: { btcEncryptedSeed: blob.encryptedData },
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: ['btc'],
    htlsSecrets: {},
  })

  await expect(
    Account.enrollPasskey({ accountId: id, password, label: 'Touch ID' }),
  ).rejects.toBe('Unlock this account with your password first')
})

test('AccountPasskey - the second enrolled passkey can unlock too', async () => {
  const id = await createAccount()

  const first = await stubCeremony('cred-1')
  await Account.enrollPasskey({ accountId: id, password, label: 'Laptop' })

  const second = await stubCeremony('cred-2')
  await Account.enrollPasskey({ accountId: id, password, label: 'Phone' })

  const byPassword = await Account.unlockAccount(id, password, btcOnly)

  Passkey.getPrfOutput.mockResolvedValue({
    credentialId: second.credentialId,
    prfOutput: second.prfOutput,
  })
  const bySecond = await Account.unlockAccountWithPasskey(id, btcOnly)

  Passkey.getPrfOutput.mockResolvedValue({
    credentialId: first.credentialId,
    prfOutput: first.prfOutput,
  })
  const byFirst = await Account.unlockAccountWithPasskey(id, btcOnly)

  expect(receivingAddressesOf(bySecond.addresses)).toStrictEqual(
    receivingAddressesOf(byPassword.addresses),
  )
  expect(receivingAddressesOf(byFirst.addresses)).toStrictEqual(
    receivingAddressesOf(byPassword.addresses),
  )
})

test('AccountPasskey - every enrolled passkey is offered to the authenticator', async () => {
  const id = await createAccount()

  await stubCeremony('cred-1')
  await Account.enrollPasskey({ accountId: id, password, label: 'Laptop' })

  const second = await stubCeremony('cred-2')
  await Account.enrollPasskey({ accountId: id, password, label: 'Phone' })

  Passkey.getPrfOutput.mockResolvedValue({
    credentialId: second.credentialId,
    prfOutput: second.prfOutput,
  })
  await Account.unlockAccountWithPasskey(id, btcOnly)

  const offered = Passkey.getPrfOutput.mock.calls.at(-1)[0]

  expect(offered.map((entry) => entry.credentialId)).toStrictEqual([
    'cred-1',
    'cred-2',
  ])
})

const writeDuringWrap = (id, buildPatch) => {
  const AccountHelpers = require('./AccountHelpers')
  const original = AccountHelpers.buildPasskeyWrapper

  return jest
    .spyOn(AccountHelpers, 'buildPasskeyWrapper')
    .mockImplementation(async (args) => {
      const current = await Account.getAccount(id)
      await Account.updateAccount(id, buildPatch(current))

      return original(args)
    })
}

test('AccountPasskey - a re-key landing mid-write is not clobbered', async () => {
  const id = await createAccount()
  await stubCeremony()

  const rekeyed = { encryptedData: 'fresh', iv: 'fresh-iv', tag: 'fresh-tag' }
  const spy = writeDuringWrap(id, (current) => ({
    wrappedDek: { ...current.wrappedDek, password: rekeyed },
  }))

  await Account.enrollPasskey({ accountId: id, password, label: 'Touch ID' })
  spy.mockRestore()

  const account = await Account.getAccount(id)

  expect(account.wrappedDek.password).toStrictEqual(rekeyed)
  expect(account.wrappedDek.passkeys).toHaveLength(1)
})

test('AccountPasskey - a passkey added mid-write is not lost', async () => {
  const id = await createAccount()
  await stubCeremony('cred-late')

  const other = { credentialId: 'cred-other', label: 'Other', prfSalt: 'x' }
  const spy = writeDuringWrap(id, (current) => ({
    wrappedDek: {
      ...current.wrappedDek,
      passkeys: [...(current.wrappedDek?.passkeys ?? []), other],
    },
  }))

  await Account.enrollPasskey({ accountId: id, password, label: 'Late' })
  spy.mockRestore()

  const passkeys = await Account.getPasskeys(id)

  expect(passkeys.map((entry) => entry.credentialId)).toStrictEqual([
    'cred-other',
    'cred-late',
  ])
})

test('AccountPasskey - migrating an account with passkeys is refused, not silent', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})

  const { BTC } = await import('@Cryptos')
  const { IndexedDB } = await import('@Databases')

  const { key, salt } = await Cipher.generatePBKDF2Key({ password, version: 3 })
  const seed = await BTC.getSeedFromMnemonic(MNEMONIC)
  const btc = await Cipher.encryptAES({ data: seed, key })
  const ml = await Cipher.encryptAES({ data: 'ml-key', key })

  const id = await IndexedDB.save(await IndexedDB.loadAccounts(), {
    name: 'Legacy with passkeys',
    salt,
    encryptionVersion: 3,
    wrappedDek: {
      passkeys: [{ credentialId: 'cred-1', prfSalt: 'c2FsdA' }],
    },
    iv: {
      btcIv: btc.iv,
      mlTestnetPrivKeyIv: ml.iv,
      mlMainnetPrivKeyIv: ml.iv,
    },
    tag: {
      btcTag: btc.tag,
      mlTestnetPrivKeyTag: ml.tag,
      mlMainnetPrivKeyTag: ml.tag,
    },
    seed: {
      btcEncryptedSeed: btc.encryptedData,
      encryptedMlTestnetPrivateKey: ml.encryptedData,
      encryptedMlMainnetPrivateKey: ml.encryptedData,
    },
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: ['btc'],
    htlsSecrets: {},
  })

  await expect(
    Account.unlockAccount(id, password, btcOnly),
  ).resolves.toBeDefined()

  const after = await Account.getAccount(id)

  expect(after.encryptionVersion).toBe(3)
  expect(after.wrappedDek.passkeys).toHaveLength(1)

  console.error.mockRestore()
})
