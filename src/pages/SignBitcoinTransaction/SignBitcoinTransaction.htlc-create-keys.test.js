import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as bitcoin from 'bitcoinjs-lib'
import { BIP32Factory } from 'bip32'
import { ECPairFactory, networks as ecpairNetworks } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'

import { Account } from '@Entities'
import { BTCTransaction } from '@Cryptos'
import { AccountContext, BitcoinContext, SettingsContext } from '@Contexts'
import { sendPopupResponse } from '@Browser'
import { SignBitcoinTransactionPage } from './SignBitcoinTransaction'

// Keep the output readable: swallow React error-logging noise.
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

// Minimal chrome stub — must exist before the page's module graph loads
// anything reading chrome.* (see SignExternalTransaction.TDZ.test.js).
jest.mock('@Browser', () => {
  /* eslint-disable-next-line no-undef */
  global.chrome = {
    runtime: { sendMessage: jest.fn(), lastError: null },
    storage: {
      local: {
        get: jest.fn((_keys, cb) => cb && cb({})),
        set: jest.fn((_items, cb) => cb && cb()),
        remove: jest.fn((_keys, cb) => cb && cb()),
      },
      onChanged: { addListener: jest.fn(), removeListener: jest.fn() },
    },
    windows: { getCurrent: jest.fn((cb) => cb({ id: 1 })) },
  }
  const api = {
    runtime: global.chrome.runtime,
    storage: global.chrome.storage,
    windows: global.chrome.windows,
    sendPopupResponse: jest.fn(),
  }
  return {
    __esModule: true,
    Browser: api,
    runtime: api.runtime,
    storage: api.storage,
    windows: api.windows,
    sendPopupResponse: api.sendPopupResponse,
  }
})

// The page imports the wasm package by DIRECTORY, bypassing the jest
// moduleNameMapper — mock the resolved module.
jest.mock('../../services/Crypto/Mintlayer/@mintlayerlib-js', () => ({
  __esModule: true,
  Network: Object.freeze({
    Mainnet: 0,
    0: 'Mainnet',
    Testnet: 1,
    1: 'Testnet',
  }),
}))

// The real signer end to end: the key verdict, the escrow script and the
// funding transaction are really built with bitcoinjs, so the script,
// address and witness the dApp would receive can be inspected. The escrow
// builder and the funding builder are wrapped so a test can see whether
// anything was built from a refused key.
jest.mock('@Cryptos', () => {
  const actual = jest.requireActual('../../services/Crypto/BTC/BTCTransaction')
  return {
    __esModule: true,
    BTC: {},
    BTC_ADDRESS_TYPE_ENUM: jest.requireActual(
      '../../services/Crypto/BTC/BTC.addressType',
    ).BTC_ADDRESS_TYPE_ENUM,
    BTCTransaction: {
      ...actual,
      buildHTLCAndFundingAddress: jest.fn((args) =>
        actual.buildHTLCAndFundingAddress(args),
      ),
      buildTransaction: jest.fn((args) => actual.buildTransaction(args)),
    },
  }
})

jest.mock('@Entities', () => ({
  __esModule: true,
  Account: {
    hasPasskey: jest.fn(),
    unlockAccount: jest.fn(),
    unlockHtlsSecret: jest.fn(),
    saveProvidedHtlsSecret: jest.fn(),
    getPasswordWithPasskey: jest.fn(),
    getAccount: jest.fn(),
  },
  AccountHelpers: {},
}))

// The fee service is unreachable: the page falls back to its fixed rate.
jest.mock('@APIs', () => ({
  __esModule: true,
  Electrum: {
    getFeesEstimates: jest.fn(() =>
      Promise.reject(new Error('fees unavailable')),
    ),
  },
  Mintlayer: {},
}))

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      accountID: 'htlc-create-account',
      addresses: {},
    }),
    SettingsContext: makeCtx({ networkType: 'testnet' }),
    BitcoinContext: makeCtx({ btcUtxos: [], unusedAddresses: {} }),
    MintlayerContext: makeCtx({}),
    TransactionContext: makeCtx({}),
    ExchangeRatesContext: makeCtx({}),
  }
})

// This bitcoinjs build validates strict Uint8Array inputs.
const u8 = (bytes) => new Uint8Array(bytes)
const hexOf = (bytes) => Buffer.from(u8(bytes)).toString('hex')

// The test account: a deterministic HD wallet (never holds funds). Its
// receiving key at index 0 is the refund key of a well-formed create
// request and also holds the UTXO that funds the escrow; its change key
// takes the change. The counterparty key is a valid key the wallet does
// not hold.
const bip32 = BIP32Factory(ecc)
const root = bip32.fromSeed(new Uint8Array(64).fill(3))
const ECPair = ECPairFactory(ecc)
const makeKey = (seed) =>
  ECPair.makeRandom({
    network: ecpairNetworks.testnet,
    rng: (size) => new Uint8Array(size).fill(seed),
  })
const refundChild = root.derivePath("m/84'/0'/0'/0/0")
const changeChild = root.derivePath("m/84'/0'/1'/0/0")
const testnet = bitcoin.networks.testnet
const p2wpkhAddress = (child) =>
  bitcoin.payments.p2wpkh({
    pubkey: u8(child.publicKey),
    network: testnet,
  }).address
const REFUND_ADDRESS = p2wpkhAddress(refundChild)
const CHANGE_ADDRESS = p2wpkhAddress(changeChild)
const WALLET_REFUND_PUBKEY = hexOf(refundChild.publicKey)
const COUNTERPARTY_PUBKEY = hexOf(makeKey(9).publicKey)
const OTHER_FOREIGN_PUBKEY = hexOf(makeKey(10).publicKey)
// A valid point as an uncompressed key (65 bytes starting 04): no escrow
// script can carry it, the address builder rejects a script holding one.
const UNCOMPRESSED_PUBKEY = hexOf(
  ecc.pointCompress(makeKey(11).publicKey, false),
)

// The wallet's address data as the account context carries it: the stored
// `{ [address]: { pubkey } }` shape, the pubkey as bytes.
const walletBtcAddresses = () => ({
  btcReceivingAddresses: [
    { [REFUND_ADDRESS]: { pubkey: u8(refundChild.publicKey) } },
  ],
  btcChangeAddresses: [
    { [CHANGE_ADDRESS]: { pubkey: u8(changeChild.publicKey) } },
  ],
})

// The same wallet as the unlocked account carries it: the flat entries
// the funding builder reads (address, pubkey, derivation path).
const btcAddressData = {
  btcReceivingAddresses: [
    {
      address: REFUND_ADDRESS,
      pubkey: u8(refundChild.publicKey),
      derivationPath: "m/84'/0'/0'/0/0",
      privateKey: refundChild.toWIF(),
    },
  ],
  btcChangeAddresses: [
    {
      address: CHANGE_ADDRESS,
      pubkey: u8(changeChild.publicKey),
      derivationPath: "m/84'/0'/1'/0/0",
      privateKey: changeChild.toWIF(),
    },
  ],
}

// One confirmed UTXO on the refund key's address funds the escrow.
const UTXO = {
  txid: 'a'.repeat(64),
  vout: 0,
  value: 100000,
  address: REFUND_ADDRESS,
}
const AMOUNT_SAT = 50000
const LOCK_BLOCKS = 20

const createRequest = ({
  refundPublicKey = WALLET_REFUND_PUBKEY,
  recipientPublicKey = COUNTERPARTY_PUBKEY,
  amount = String(AMOUNT_SAT),
  timeoutBlocks = String(LOCK_BLOCKS),
} = {}) => ({
  request: {
    requestId: 'create-1',
    origin: 'https://dapp.example',
    network: 'testnet',
    data: {
      txData: {
        JSONRepresentation: {
          secretHash:
            '{"secret_hash_hex":"0000000000000000000000000000000000000000"}',
          amount,
          timeoutBlocks,
          recipientPublicKey,
          refundPublicKey,
        },
      },
    },
  },
})

// The escrow is funded from the wallet's testnet UTXO; the funding builder
// pins its PSBT to the network the wallet reads from local storage.
const SignPageHarness = ({ initialState, btcAddresses, btcUtxos }) => (
  <MemoryRouter
    initialEntries={[{ pathname: '/sign-btc', state: initialState }]}
  >
    <Routes>
      <Route
        path="/sign-btc"
        element={
          <SettingsContext.Provider value={{ networkType: 'testnet' }}>
            <AccountContext.Provider
              value={{
                accountID: 'htlc-create-account',
                addresses: btcAddresses,
              }}
            >
              <BitcoinContext.Provider
                value={{
                  btcUtxos,
                  unusedAddresses: { changeAddress: CHANGE_ADDRESS },
                }}
              >
                <SignBitcoinTransactionPage />
              </BitcoinContext.Provider>
            </AccountContext.Provider>
          </SettingsContext.Provider>
        }
      />
    </Routes>
  </MemoryRouter>
)

const renderSignPage = (
  state = createRequest(),
  {
    btcAddresses = { btcAddresses: walletBtcAddresses() },
    btcUtxos = [UTXO],
  } = {},
) =>
  render(
    <SignPageHarness
      initialState={state}
      btcAddresses={btcAddresses}
      btcUtxos={btcUtxos}
    />,
  )

// Let the page's escrow pre-computation settle: the address it built is
// shown. (Nothing is built for a request the keys of which fail.)
const settlePage = async () => {
  await waitFor(() =>
    expect(rowValue('Escrow address').textContent).not.toBe('unavailable'),
  )
}

const approveButton = () => screen.getByText('Approve and return to page')

// A recap row renders as <dt>label</dt><dd>value</dd>.
const rowValue = (label) => {
  const dt = screen.getByText(label)
  return dt.parentElement.querySelector('dd')
}

const blockBanner = () => screen.queryByText(/cannot be approved/)

// The approval response the dApp would have received, if any.
const approveResponse = () =>
  sendPopupResponse.mock.calls.find(
    ([response]) => response.method === 'signTransaction_approve',
  ) ?? null

// Nothing is built from keys that failed the verdict: neither the escrow
// script nor the funding transaction.
const expectNothingBuilt = () => {
  expect(BTCTransaction.buildHTLCAndFundingAddress).not.toHaveBeenCalled()
  expect(BTCTransaction.buildTransaction).not.toHaveBeenCalled()
}

beforeEach(() => {
  jest.clearAllMocks()
  errorSpy.mockClear()
  localStorage.setItem('networkType', JSON.stringify('testnet'))
  Account.getAccount.mockResolvedValue({ walletType: 'nativeSegwit' })
  Account.unlockAccount.mockResolvedValue({
    btcPrivateKeys: { btcAddressData, btcHDWallet: root },
  })
  Account.saveProvidedHtlsSecret.mockResolvedValue(undefined)
})

afterAll(() => {
  errorSpy.mockRestore()
})

describe('SignBitcoinTransaction — the keys of an HTLC create request', () => {
  // The wallet funds the escrow, and the refund branch of the script pays
  // one single key. A dApp that names a key it holds as the refund key
  // leaves the user with no key that can recover the funds after the lock
  // time, while the dApp could take them then with no secret at all. The
  // approval must say so and never open the password modal.
  test('blocks a create request whose refund key is a valid key the wallet does not hold', async () => {
    renderSignPage(
      createRequest({
        refundPublicKey: COUNTERPARTY_PUBKEY,
        recipientPublicKey: OTHER_FOREIGN_PUBKEY,
      }),
    )

    expect(screen.getByText('Create HTLC — fund an escrow')).toBeInTheDocument()
    expect(blockBanner()).toHaveTextContent(
      'Refund key: not a key of this wallet. After the lock time, only the holder of that key could recover these funds. For your safety, this request cannot be approved.',
    )
    const refund = rowValue('Refund key')
    expect(refund).toHaveTextContent(
      `${COUNTERPARTY_PUBKEY.slice(0, 12)}…${COUNTERPARTY_PUBKEY.slice(-8)} — not a key of this wallet`,
    )
    expect(refund).toHaveClass('mono', 'warn')
    expect(rowValue('Recipient key')).toHaveTextContent(
      `${OTHER_FOREIGN_PUBKEY.slice(0, 12)}…${OTHER_FOREIGN_PUBKEY.slice(-8)} — not a key of this wallet`,
    )

    // no escrow address from keys that failed, and nothing built from them
    expect(rowValue('Escrow address')).toHaveTextContent('unavailable')
    expectNothingBuilt()

    // the approval is closed: Approve is disabled and the password modal
    // never opens on click
    expect(approveButton()).toBeDisabled()
    fireEvent.click(approveButton())
    expect(screen.queryByText('Re-enter your Password')).not.toBeInTheDocument()
    expect(Account.unlockAccount).not.toHaveBeenCalled()
    expect(sendPopupResponse).not.toHaveBeenCalled()
  })

  // A key that is not a valid public key makes its branch of the escrow
  // unspendable, and the hex decode would otherwise cut an odd-length or
  // non-hex value down to a prefix without a word. Each shape, on each
  // key, blocks the approval and names the key and why.
  const WALLET_KEY = WALLET_REFUND_PUBKEY
  const INVALID_KEYS = [
    [
      'an odd-length hex',
      `${WALLET_KEY}0`,
      /its hex has an odd number of digits/,
    ],
    [
      'a non-hex character',
      `${WALLET_KEY.slice(0, -2)}zz`,
      /characters that are not hex digits/,
    ],
    [
      'a key truncated by a hex digit',
      WALLET_KEY.slice(0, -1),
      /odd number of digits/,
    ],
    [
      'a key truncated by a byte',
      WALLET_KEY.slice(0, -2),
      /it is 32 bytes starting 0[23]/,
    ],
    [
      'a 33-byte value starting 04',
      `04${WALLET_KEY.slice(2)}`,
      /it is 33 bytes starting 04/,
    ],
    [
      'a well-formed 33-byte value that is not a point on the curve',
      `02${'00'.repeat(31)}05`,
      /it is not a point on the secp256k1 curve/,
    ],
    [
      'an uncompressed key (65 bytes starting 04)',
      UNCOMPRESSED_PUBKEY,
      /it is an uncompressed key, and the escrow script carries compressed keys only/,
    ],
    ['a value that is not text', { toString: 1 }, /it is not text/],
  ]
  describe.each([
    ['refundPublicKey', 'Refund key'],
    ['recipientPublicKey', 'Recipient key'],
  ])('with an invalid %s', (field, label) => {
    test.each(INVALID_KEYS)(
      'blocks and names the key for %s',
      async (_shape, value, why) => {
        renderSignPage(createRequest({ [field]: value }))

        expect(blockBanner()).toHaveTextContent(
          `${label}: not a valid public key — `,
        )
        expect(blockBanner().textContent).toMatch(why)
        expect(rowValue(label)).toHaveTextContent(`not a valid public key — `)
        expect(rowValue(label)).toHaveClass('warn')
        // the other key is still read and shown
        const otherLabel =
          label === 'Refund key' ? 'Recipient key' : 'Refund key'
        expect(rowValue(otherLabel)).toHaveTextContent(
          label === 'Refund key'
            ? `${COUNTERPARTY_PUBKEY.slice(0, 12)}…`
            : `${WALLET_REFUND_PUBKEY.slice(0, 12)}…`,
        )

        expect(rowValue('Escrow address')).toHaveTextContent('unavailable')
        expectNothingBuilt()
        expect(approveButton()).toBeDisabled()
        fireEvent.click(approveButton())
        expect(
          screen.queryByText('Re-enter your Password'),
        ).not.toBeInTheDocument()
      },
    )
  })

  // A refund key can only be verified against the public keys of this
  // wallet: when none can be read, nothing is approvable.
  test.each([
    ['no address data at all', {}],
    [
      'empty address lists',
      { btcAddresses: { btcReceivingAddresses: [], btcChangeAddresses: [] } },
    ],
    [
      'entries without a public key',
      {
        btcAddresses: {
          btcReceivingAddresses: [{ tb1qnokey: {} }],
          btcChangeAddresses: [],
        },
      },
    ],
    [
      'a public key that is not a byte sequence',
      {
        btcAddresses: {
          btcReceivingAddresses: [{ tb1qbad: { pubkey: { nope: 1 } } }],
          btcChangeAddresses: [],
        },
      },
    ],
  ])(
    'blocks, fail closed, when the wallet has %s',
    async (_shape, btcAddresses) => {
      renderSignPage(createRequest(), { btcAddresses })

      expect(blockBanner()).toHaveTextContent(
        'The public keys of this wallet could not be read, so the refund key cannot be checked against them. If it is not a key of this wallet, after the lock time only the holder of that key could recover these funds. For your safety, this request cannot be approved.',
      )
      // a key that could not be checked is called exactly that: neither
      // the wallet's nor a foreign one
      const refund = rowValue('Refund key')
      expect(refund).toHaveTextContent(
        `${WALLET_REFUND_PUBKEY.slice(0, 12)}…${WALLET_REFUND_PUBKEY.slice(-8)} — could not be checked against the keys of this wallet`,
      )
      expect(refund).toHaveClass('mono', 'warn')
      const recipient = rowValue('Recipient key')
      expect(recipient).toHaveTextContent(
        `${COUNTERPARTY_PUBKEY.slice(0, 12)}…${COUNTERPARTY_PUBKEY.slice(-8)} — could not be checked against the keys of this wallet`,
      )
      expect(recipient).toHaveClass('mono')
      expect(recipient).not.toHaveClass('warn')
      // no recap row calls either key the wallet's or a foreign one (the
      // banner states the stake conditionally)
      const rowValues = screen
        .getAllByRole('definition')
        .map((dd) => dd.textContent)
        .join(' ')
      expect(rowValues).not.toMatch(/a key of this wallet/)
      expectNothingBuilt()
      expect(approveButton()).toBeDisabled()
      fireEvent.click(approveButton())
      expect(
        screen.queryByText('Re-enter your Password'),
      ).not.toBeInTheDocument()
    },
  )

  // Positive control: a well-formed request whose refund key is the test
  // account's receiving key and whose recipient key is a valid foreign key.
  // It shows both key rows as described, approves, and signs: the escrow
  // script carries exactly the two keys, the wallet's UTXO funds the
  // escrow output, and the input carries an ordinary P2WPKH witness of the
  // wallet key — the same script, address and witness shape as before.
  test('approves and signs a create request whose refund key is a key of this wallet', async () => {
    renderSignPage()
    await settlePage()

    expect(blockBanner()).toBeNull()
    const refund = rowValue('Refund key')
    expect(refund).toHaveTextContent(
      `${WALLET_REFUND_PUBKEY.slice(0, 12)}…${WALLET_REFUND_PUBKEY.slice(-8)} — a key of this wallet`,
    )
    expect(refund).toHaveClass('mono')
    expect(refund).not.toHaveClass('warn')
    const recipient = rowValue('Recipient key')
    expect(recipient).toHaveTextContent(
      `${COUNTERPARTY_PUBKEY.slice(0, 12)}…${COUNTERPARTY_PUBKEY.slice(-8)} — not a key of this wallet`,
    )
    expect(recipient).toHaveClass('mono')
    expect(recipient).not.toHaveClass('warn')
    const escrowAddress = rowValue('Escrow address').textContent
    expect(escrowAddress).toMatch(/^tb1q[a-z0-9]{20,}$/)

    expect(approveButton()).toBeEnabled()
    fireEvent.click(approveButton())
    expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wallet-password' },
    })
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(approveResponse()).not.toBeNull())

    expect(Account.unlockAccount).toHaveBeenCalledWith(
      'htlc-create-account',
      'wallet-password',
      { wallets: ['btc'] },
    )
    const { result } = approveResponse()[0]
    expect(result).toEqual(
      expect.objectContaining({
        htlcAddress: escrowAddress,
        redeemScript: expect.stringMatching(/^[0-9a-f]+$/),
        secretHashHex: expect.stringMatching(/^[0-9a-f]{40}$/),
        signedTxHex: expect.stringMatching(/^[0-9a-f]+$/),
        transactionId: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    )
    expect(Account.saveProvidedHtlsSecret).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: 'htlc-create-account',
        data: expect.objectContaining({ hash: result.secretHashHex }),
      }),
    )

    // the escrow script: the wallet's refund key behind the lock, the
    // counterparty's key on the secret branch, the wallet's own hash
    const redeemScript = Buffer.from(result.redeemScript, 'hex')
    expect(redeemScript).toEqual(
      Buffer.from(
        bitcoin.script.compile([
          bitcoin.opcodes.OP_IF,
          bitcoin.opcodes.OP_HASH160,
          u8(Buffer.from(result.secretHashHex, 'hex')),
          bitcoin.opcodes.OP_EQUALVERIFY,
          u8(Buffer.from(COUNTERPARTY_PUBKEY, 'hex')),
          bitcoin.opcodes.OP_ELSE,
          bitcoin.script.number.encode(LOCK_BLOCKS),
          bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
          bitcoin.opcodes.OP_DROP,
          u8(Buffer.from(WALLET_REFUND_PUBKEY, 'hex')),
          bitcoin.opcodes.OP_ENDIF,
          bitcoin.opcodes.OP_CHECKSIG,
        ]),
      ),
    )
    const p2wsh = bitcoin.payments.p2wsh({
      redeem: { output: u8(redeemScript) },
      network: testnet,
    })
    expect(result.htlcAddress).toBe(p2wsh.address)
    expect(BTCTransaction.buildHTLCAndFundingAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverPubKey: COUNTERPARTY_PUBKEY,
        senderPubKey: WALLET_REFUND_PUBKEY,
        lock: String(LOCK_BLOCKS),
        networkType: 'testnet',
      }),
    )

    // the funding transaction: the escrow output and the change output,
    // paid from the wallet's UTXO with the wallet key's P2WPKH witness
    const tx = bitcoin.Transaction.fromHex(result.signedTxHex)
    expect(tx.getId()).toBe(result.transactionId)
    expect(tx.ins).toHaveLength(1)
    expect(Buffer.from(tx.ins[0].hash).reverse().toString('hex')).toBe(
      UTXO.txid,
    )
    expect(tx.ins[0].index).toBe(UTXO.vout)
    const witness = tx.ins[0].witness
    expect(witness).toHaveLength(2)
    expect(Buffer.from(witness[1]).toString('hex')).toBe(WALLET_REFUND_PUBKEY)
    const outputs = tx.outs.map((out) => ({
      script: Buffer.from(u8(out.script)).toString('hex'),
      value: out.value,
    }))
    expect(outputs).toEqual(
      expect.arrayContaining([
        {
          script: Buffer.from(u8(p2wsh.output)).toString('hex'),
          value: BigInt(AMOUNT_SAT),
        },
      ]),
    )
    expect(outputs).toHaveLength(2)
    // the change output: the UTXO minus the escrow amount minus the fee
    const change = outputs.find((o) => o.value !== BigInt(AMOUNT_SAT))
    const remainder = BigInt(UTXO.value) - BigInt(AMOUNT_SAT)
    expect(change.script).toBe(
      Buffer.from(
        bitcoin.address.toOutputScript(CHANGE_ADDRESS, testnet),
      ).toString('hex'),
    )
    expect(change.value).toBeLessThan(remainder)
    expect(remainder - change.value).toBeLessThan(10000n)
  })

  // Sign time: the verdict runs again before the wallet is unlocked. With
  // the wallet's public keys changed after the approval was shown (the
  // refund key no longer among them), the submit refuses and nothing is
  // built, unlocked or answered.
  test('refuses at sign time, before the wallet is unlocked, when the refund key is not a key of this wallet', async () => {
    const addresses = { btcAddresses: walletBtcAddresses() }
    renderSignPage(createRequest(), { btcAddresses: addresses })
    await settlePage()
    expect(blockBanner()).toBeNull()
    expect(approveButton()).toBeEnabled()

    // the display check is bypassed: the approval was shown with the
    // wallet's keys, which changed before the submit read them again
    addresses.btcAddresses = {
      btcReceivingAddresses: [],
      btcChangeAddresses: [],
    }
    fireEvent.click(approveButton())
    expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wallet-password' },
    })
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() =>
      expect(document.querySelector('.sign-error')).not.toBeNull(),
    )

    expect(document.querySelector('.sign-error').textContent).toBe(
      'The public keys of this wallet could not be read, so the refund key cannot be checked against them. If it is not a key of this wallet, after the lock time only the holder of that key could recover these funds.',
    )
    expect(Account.unlockAccount).not.toHaveBeenCalled()
    expect(BTCTransaction.buildTransaction).not.toHaveBeenCalled()
    expect(approveResponse()).toBeNull()
    expect(sendPopupResponse).not.toHaveBeenCalled()
  })
})
