import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as bitcoin from 'bitcoinjs-lib'
import { ECPairFactory, networks as ecpairNetworks } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'

import { Account } from '@Entities'
import { BTCTransaction } from '@Cryptos'
import { SettingsContext } from '@Contexts'
import { Electrum } from '@APIs'
import { sendPopupResponse } from '@Browser'
import { Secret } from '@Helpers'
import { SignBitcoinTransactionPage } from './SignBitcoinTransaction'

// Keep the output readable: swallow React error-logging noise; the error
// log is also inspected for secret leakage below.
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

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

// The real signer: the claim must really be built with bitcoinjs so the
// witness the dApp would receive can be inspected. The key matcher wraps
// the real one so the branch it was asked for and the key it returned are
// observable.
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
      findWalletKeyForRedeemScript: jest.fn((args) =>
        actual.findWalletKeyForRedeemScript(args),
      ),
      buildHtlcClaimTx: jest.fn((args) => actual.buildHtlcClaimTx(args)),
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

// The chain: the Electrum client is a mock, no network is ever touched.
jest.mock('@APIs', () => ({
  __esModule: true,
  Electrum: {
    getFeesEstimates: jest.fn(() =>
      Promise.reject(new Error('fees unavailable')),
    ),
    getTransactionData: jest.fn(),
    getTransactionHex: jest.fn(),
    getOutspend: jest.fn(),
  },
  Mintlayer: {},
}))

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      accountID: 'htlc-claim-account',
      addresses: {},
    }),
    SettingsContext: makeCtx({ networkType: 'testnet' }),
    BitcoinContext: makeCtx({
      btcUtxos: [],
      unusedAddresses: {
        receivingAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      },
    }),
    MintlayerContext: makeCtx({}),
    TransactionContext: makeCtx({}),
    ExchangeRatesContext: makeCtx({}),
  }
})

// Deterministic testnet keys (never hold funds): two wallet keys, one for
// each HTLC branch, and a counterparty key.
const ECPair = ECPairFactory(ecc)
const makeKey = (seed) =>
  ECPair.makeRandom({
    network: ecpairNetworks.testnet,
    rng: (size) => new Uint8Array(size).fill(seed),
  })
const walletSpendKey = makeKey(7)
const walletRefundKey = makeKey(8)
const counterpartyKey = makeKey(9)
const pubkeyHexOf = (key) => Buffer.from(key.publicKey).toString('hex')

const btcAddressData = {
  btcReceivingAddresses: [
    {
      address: 'tb1qspend',
      pubkey: new Uint8Array(walletSpendKey.publicKey),
      derivationPath: "m/84'/0'/0'/0/0",
      privateKey: walletSpendKey.toWIF(),
    },
    {
      address: 'tb1qrefund',
      pubkey: new Uint8Array(walletRefundKey.publicKey),
      derivationPath: "m/84'/0'/0'/0/1",
      privateKey: walletRefundKey.toWIF(),
    },
  ],
  btcChangeAddresses: [],
}

// This bitcoinjs build validates strict Uint8Array inputs.
const u8 = (bytes) => new Uint8Array(bytes)

// The HTLC script shape the wallet builds: the spend branch pays spendKey
// against the hash, the refund branch pays refundKey after the lock.
const compileHtlc = ({
  spendKey,
  refundKey,
  secretHashHex,
  lockBlocks = 100,
}) =>
  Buffer.from(
    bitcoin.script.compile([
      bitcoin.opcodes.OP_IF,
      bitcoin.opcodes.OP_HASH160,
      u8(Buffer.from(secretHashHex, 'hex')),
      bitcoin.opcodes.OP_EQUALVERIFY,
      u8(spendKey.publicKey),
      bitcoin.opcodes.OP_ELSE,
      bitcoin.script.number.encode(lockBlocks),
      bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
      bitcoin.opcodes.OP_DROP,
      u8(refundKey.publicKey),
      bitcoin.opcodes.OP_ENDIF,
      bitcoin.opcodes.OP_CHECKSIG,
    ]),
  ).toString('hex')

const p2wshHex = (redeemScriptHex) =>
  Buffer.from(
    bitcoin.payments.p2wsh({
      redeem: { output: u8(Buffer.from(redeemScriptHex, 'hex')) },
    }).output,
  ).toString('hex')

// hash160 of a hex secret — the hash the wallet locks into an HTLC.
const hashOf = (secretHex) =>
  Buffer.from(
    Secret.generateSecretHash(Secret.hexToSecret(secretHex)),
  ).toString('hex')

// The wallet's own secret (held in storage for its hash) and an unrelated
// one the dApp may put in a script.
const SECRET = '11'.repeat(32)
const SECRET_HASH = hashOf(SECRET)
const OTHER_SECRET = '22'.repeat(32)
const OTHER_HASH = hashOf(OTHER_SECRET)

const TXID = 'f'.repeat(64)
const OTHER_TXID = 'e'.repeat(64)
const UTXO_VALUE = 2000
const DESTINATION = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'

const utxo = (overrides = {}) => ({
  txid: TXID,
  vout: 0,
  value: UTXO_VALUE,
  ...overrides,
})

const claimRequest = ({ redeemScriptHex, utxo: utxo_, secret, to }) => ({
  request: {
    requestId: 'claim-1',
    origin: 'https://dapp.example',
    network: 'testnet',
    data: {
      txData: {
        JSONRepresentation: {
          type: 'spendHtlc',
          utxo: utxo_,
          redeemScriptHex,
          ...(secret !== undefined ? { secret } : {}),
          ...(to ? { to } : {}),
        },
      },
    },
  },
})

const refundRequest = ({ redeemScriptHex, utxo: utxo_ }) => ({
  request: {
    requestId: 'refund-1',
    origin: 'https://dapp.example',
    network: 'testnet',
    data: {
      txData: {
        JSONRepresentation: {
          type: 'refundHtlc',
          utxo: utxo_,
          redeemScriptHex,
        },
      },
    },
  },
})

// An Esplora-style /tx/:txid answer holding the given outputs; the
// transaction is confirmed unless stated otherwise.
const chainTransaction = (txid, outputs, confirmed = true) =>
  JSON.stringify({
    txid,
    vin: [],
    vout: outputs,
    ...(confirmed === null ? {} : { status: { confirmed } }),
  })
const chainOutput = (scriptPubKeyHex, value) => ({
  scriptpubkey: scriptPubKeyHex,
  scriptpubkey_type: 'v0_p2wsh',
  value,
})
// An Esplora-style /tx/:txid/outspend/:vout answer.
const chainOutspend = (spent) => JSON.stringify({ spent })

// The chain holds exactly the HTLC output the request describes: a
// confirmed funding transaction whose output is still unspent.
const chainHoldsOutput = (
  redeemScriptHex,
  {
    txid = TXID,
    value = UTXO_VALUE,
    scriptPubKeyHex,
    confirmed = true,
    spent = false,
  } = {},
) => {
  Electrum.getTransactionData.mockResolvedValue(
    chainTransaction(
      txid,
      [chainOutput(scriptPubKeyHex ?? p2wshHex(redeemScriptHex), value)],
      confirmed,
    ),
  )
  Electrum.getOutspend.mockResolvedValue(chainOutspend(spent))
}

// A legitimate claim: the HTLC pays the wallet's spend key against the
// hash of the wallet's own secret, and the chain holds that output.
const legitimateClaimScript = compileHtlc({
  spendKey: walletSpendKey,
  refundKey: counterpartyKey,
  secretHashHex: SECRET_HASH,
})

const renderSignPage = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/sign-btc', state }]}>
      <Routes>
        <Route
          path="/sign-btc"
          element={<SignBitcoinTransactionPage />}
        />
      </Routes>
    </MemoryRouter>,
  )

// The secret inside the claim witness of a signed transaction, as the dApp
// would read it: [signature, secret, OP_1, witness script].
const witnessSecretOf = (signedTxHex) =>
  Buffer.from(
    bitcoin.Transaction.fromHex(signedTxHex).ins[0].witness[1],
  ).toString('hex')

// The one approval response the dApp would have received, if any.
const approveResponse = () =>
  sendPopupResponse.mock.calls.find(
    ([response]) => response.method === 'signTransaction_approve',
  ) ?? null

const settleSigning = async () =>
  waitFor(() =>
    expect(
      approveResponse() !== null ||
        document.querySelector('.sign-error') !== null,
    ).toBe(true),
  )

const approveThroughModal = async (typedSecret) => {
  fireEvent.click(screen.getByText('Approve and return to page'))
  expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: 'wallet-password' },
  })
  if (typedSecret !== undefined) {
    fireEvent.change(
      screen.getByPlaceholderText(
        'Enter htlc secret in hex format (64 characters)',
      ),
      { target: { value: typedSecret } },
    )
  }
  fireEvent.click(screen.getByText('Approve'))
  await settleSigning()
}

const onPageError = () =>
  document.querySelector('.sign-error')?.textContent ?? ''

// Every channel a refusal could leak through: the response, the on-page
// error text and the console. None may carry the wallet's secret.
const expectSecretNowhere = () => {
  expect(JSON.stringify(sendPopupResponse.mock.calls)).not.toContain(SECRET)
  expect(onPageError()).not.toContain(SECRET)
  expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(SECRET)
  expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(SECRET)
}

beforeEach(() => {
  jest.clearAllMocks()
  errorSpy.mockClear()
  warnSpy.mockClear()
  BTCTransaction.findWalletKeyForRedeemScript.mockClear()
  BTCTransaction.buildHtlcClaimTx.mockClear()
  Account.unlockAccount.mockResolvedValue({
    btcPrivateKeys: { btcAddressData },
  })
  // The wallet holds its own secret for its hash, and nothing else.
  Account.unlockHtlsSecret.mockImplementation(async ({ hash }) => {
    if (hash === SECRET_HASH) return SECRET
    throw new Error('No secret found for the provided hash')
  })
  Electrum.getTransactionData.mockRejectedValue(new Error('not mocked'))
  Electrum.getOutspend.mockRejectedValue(new Error('not mocked'))
})

afterAll(() => {
  errorSpy.mockRestore()
  warnSpy.mockRestore()
})

describe('SignBitcoinTransaction — claiming an HTLC with the wallet secret', () => {
  // A claim whose script pays the WALLET key only on the refund branch and
  // is locked to a different hash, while its utxo carries the hash of a
  // secret the wallet holds in storage. The dApp would receive the wallet's
  // secret in the witness and take the wallet's own HTLC with it.
  test('refuses a claim that hands the wallet a refund-branch script carrying the hash of a stored secret, before the secret is fetched', async () => {
    const refundBranchOnlyScript = compileHtlc({
      spendKey: counterpartyKey,
      refundKey: walletRefundKey,
      secretHashHex: OTHER_HASH,
    })
    chainHoldsOutput(refundBranchOnlyScript)

    renderSignPage(
      claimRequest({
        redeemScriptHex: refundBranchOnlyScript,
        utxo: utxo({ secretHash: { secret_hash_hex: SECRET_HASH } }),
      }),
    )
    await approveThroughModal()

    // The response, had there been one, must not carry the secret in its
    // witness.
    const response = approveResponse()
    expect(
      response && witnessSecretOf(response[0].result.signedTxHex),
    ).not.toBe(SECRET)
    expect(sendPopupResponse).not.toHaveBeenCalled()

    // the stored secret was never fetched, by the request's hash or any other
    expect(Account.unlockHtlsSecret).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(
      /does not pay its spend branch|does not match the hash in the HTLC script/,
    )
    expectSecretNowhere()
  })

  // The same request shape with the hash as a JSON string.
  test('refuses it whether the request carries the hash as an object or as a JSON string', async () => {
    const refundBranchOnlyScript = compileHtlc({
      spendKey: counterpartyKey,
      refundKey: walletRefundKey,
      secretHashHex: OTHER_HASH,
    })
    chainHoldsOutput(refundBranchOnlyScript)

    renderSignPage(
      claimRequest({
        redeemScriptHex: refundBranchOnlyScript,
        utxo: utxo({
          secretHash: JSON.stringify({ secret_hash_hex: SECRET_HASH }),
        }),
      }),
    )
    await approveThroughModal()

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(Account.unlockHtlsSecret).not.toHaveBeenCalled()
    expectSecretNowhere()
  })

  // Each refusal on its own: every other fact of the request is legitimate,
  // so only the named one can be the cause.
  describe('refuses, before the secret is fetched, when', () => {
    const refusalCases = [
      [
        'the wallet key sits only on the refund branch',
        () => {
          const script = compileHtlc({
            spendKey: counterpartyKey,
            refundKey: walletRefundKey,
            secretHashHex: SECRET_HASH,
          })
          chainHoldsOutput(script)
          return {
            state: claimRequest({
              redeemScriptHex: script,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /does not pay its spend branch/,
            // the spend-branch key is read from the unlocked wallet
            afterUnlock: true,
          }
        },
      ],
      [
        'the secret does not hash to the hash in the script',
        () => {
          chainHoldsOutput(legitimateClaimScript)
          return {
            // nothing stored for the hash: the revealed secret is what
            // would be signed
            noStoredSecret: true,
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: OTHER_SECRET,
            }),
            error: /does not match the hash in the HTLC script/,
            afterUnlock: true,
          }
        },
      ],
      [
        'the request carries a hash that differs from the script hash',
        () => {
          chainHoldsOutput(legitimateClaimScript)
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo({ secretHash: { secret_hash_hex: OTHER_HASH } }),
              secret: SECRET,
            }),
            error: /does not match the hash in the HTLC script/,
            // the hash disagreement is settled from the script alone
            chainLookedUp: false,
          }
        },
      ],
      [
        'the request carries a hash that cannot be read',
        () => {
          chainHoldsOutput(legitimateClaimScript)
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo({ secretHash: '{"secret_hash_hex":' }),
              secret: SECRET,
            }),
            error: /does not match the hash in the HTLC script/,
            chainLookedUp: false,
          }
        },
      ],
      [
        'the script is not an HTLC script of the expected shape',
        () => {
          const script = Buffer.from(
            bitcoin.script.compile([
              bitcoin.opcodes.OP_IF,
              bitcoin.opcodes.OP_HASH160,
              u8(Buffer.from(SECRET_HASH, 'hex')),
              bitcoin.opcodes.OP_EQUALVERIFY,
              u8(walletSpendKey.publicKey),
              bitcoin.opcodes.OP_ELSE,
              bitcoin.script.number.encode(100),
              bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
              bitcoin.opcodes.OP_DROP,
              u8(counterpartyKey.publicKey),
              bitcoin.opcodes.OP_CHECKSIG,
            ]),
          ).toString('hex')
          return {
            state: claimRequest({
              redeemScriptHex: script,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /not a valid HTLC script/,
            chainLookedUp: false,
          }
        },
      ],
      [
        'the transaction holding the output is not found on chain',
        () => {
          Electrum.getTransactionData.mockRejectedValue(
            new Error('Request not successful'),
          )
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /could not be looked up on chain/,
          }
        },
      ],
      [
        'the funding transaction is not confirmed on chain',
        () => {
          chainHoldsOutput(legitimateClaimScript, { confirmed: false })
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /not confirmed on chain yet/,
          }
        },
      ],
      [
        'the chain answer carries no confirmation status',
        () => {
          Electrum.getTransactionData.mockResolvedValue(
            chainTransaction(
              TXID,
              [chainOutput(p2wshHex(legitimateClaimScript), UTXO_VALUE)],
              null,
            ),
          )
          Electrum.getOutspend.mockResolvedValue(chainOutspend(false))
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /not confirmed on chain yet/,
          }
        },
      ],
      [
        'the output at the requested index does not exist on chain',
        () => {
          chainHoldsOutput(legitimateClaimScript)
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo({ vout: 1 }),
              secret: SECRET,
            }),
            error: /does not exist on chain/,
          }
        },
      ],
      [
        'the on-chain output is locked to a different script',
        () => {
          chainHoldsOutput(legitimateClaimScript, {
            scriptPubKeyHex: p2wshHex(
              compileHtlc({
                spendKey: walletSpendKey,
                refundKey: counterpartyKey,
                secretHashHex: OTHER_HASH,
              }),
            ),
          })
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /not locked to this HTLC script/,
          }
        },
      ],
      [
        'the on-chain output holds a different amount',
        () => {
          chainHoldsOutput(legitimateClaimScript, { value: UTXO_VALUE - 1 })
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /different amount on chain/,
          }
        },
      ],
      [
        'the chain answers with a different transaction',
        () => {
          chainHoldsOutput(legitimateClaimScript, { txid: OTHER_TXID })
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /different transaction/,
          }
        },
      ],
      [
        'the output has already been spent on chain',
        () => {
          chainHoldsOutput(legitimateClaimScript, { spent: true })
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /already been spent on chain/,
          }
        },
      ],
      [
        'the spend status of the output cannot be read',
        () => {
          chainHoldsOutput(legitimateClaimScript)
          Electrum.getOutspend.mockResolvedValue('{}')
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /spend status of the HTLC output could not be read/,
          }
        },
      ],
      [
        'the spend status lookup fails',
        () => {
          chainHoldsOutput(legitimateClaimScript)
          Electrum.getOutspend.mockRejectedValue(new Error('network down'))
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            // the transaction itself was read: the message names the
            // spend-status lookup, not a connection problem
            error:
              /spend status of the HTLC output could not be looked up on chain/,
          }
        },
      ],
      [
        'the chain answer cannot be read',
        () => {
          Electrum.getTransactionData.mockResolvedValue('not json')
          return {
            state: claimRequest({
              redeemScriptHex: legitimateClaimScript,
              utxo: utxo(),
              secret: SECRET,
            }),
            error: /could not be looked up on chain/,
          }
        },
      ],
    ]

    test.each(refusalCases)('%s', async (_description, setup) => {
      const {
        state,
        error,
        chainLookedUp = true,
        noStoredSecret = false,
        afterUnlock = false,
      } = setup()
      if (noStoredSecret) {
        Account.unlockHtlsSecret.mockRejectedValue(new Error('no saved secret'))
      }

      renderSignPage(state)
      await approveThroughModal()

      expect(sendPopupResponse).not.toHaveBeenCalled()
      expect(onPageError()).toMatch(error)
      // nothing is ever built or signed for a refused request
      expect(BTCTransaction.buildHtlcClaimTx).not.toHaveBeenCalled()
      // a refusal that needs no key material comes before the wallet is
      // unlocked at all
      if (afterUnlock) {
        expect(Account.unlockAccount).toHaveBeenCalled()
      } else {
        expect(Account.unlockAccount).not.toHaveBeenCalled()
      }
      // the stored secret is never fetched by anything the request supplies
      if (noStoredSecret) {
        expect(Account.unlockHtlsSecret).toHaveBeenCalledWith(
          expect.objectContaining({ hash: SECRET_HASH }),
        )
      } else {
        expect(Account.unlockHtlsSecret).not.toHaveBeenCalled()
      }
      if (chainLookedUp) {
        expect(Electrum.getTransactionData).toHaveBeenCalledWith(TXID)
      } else {
        expect(Electrum.getTransactionData).not.toHaveBeenCalled()
      }
      expectSecretNowhere()
    })
  })

  // The typed secret is held to the same checks as a stored or revealed one.
  test('refuses a typed secret that does not hash to the hash in the script', async () => {
    Account.unlockHtlsSecret.mockRejectedValue(new Error('no saved secret'))
    chainHoldsOutput(legitimateClaimScript)

    renderSignPage(
      claimRequest({ redeemScriptHex: legitimateClaimScript, utxo: utxo() }),
    )
    await approveThroughModal(OTHER_SECRET)

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(/does not match the hash in the HTLC script/)
    expectSecretNowhere()
  })

  test('refuses a typed secret when the output is not found on chain', async () => {
    Account.unlockHtlsSecret.mockRejectedValue(new Error('no saved secret'))
    Electrum.getTransactionData.mockRejectedValue(
      new Error('Request not successful'),
    )

    renderSignPage(
      claimRequest({ redeemScriptHex: legitimateClaimScript, utxo: utxo() }),
    )
    await approveThroughModal(SECRET)

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(/could not be looked up on chain/)
    expect(Account.unlockHtlsSecret).not.toHaveBeenCalled()
    expectSecretNowhere()
  })

  // Surrounding whitespace in a typed secret never reaches the signer: the
  // field trims as the user types, and the page trims again before the
  // hash check and the build (the signer accepts exactly 64 hex characters).
  test('signs a legitimate claim with a typed secret typed with surrounding whitespace', async () => {
    Account.unlockHtlsSecret.mockRejectedValue(new Error('no saved secret'))
    chainHoldsOutput(legitimateClaimScript)

    renderSignPage(
      claimRequest({ redeemScriptHex: legitimateClaimScript, utxo: utxo() }),
    )
    await approveThroughModal(`${SECRET} `)

    const response = approveResponse()
    expect(response).not.toBeNull()
    expect(witnessSecretOf(response[0].result.signedTxHex)).toBe(SECRET)
  })

  // Positive control: the HTLC really pays the wallet's spend key for the
  // hash of the wallet's own secret and the chain holds that output. The
  // claim signs exactly as before — the secret in the OP_IF witness.
  test('signs a legitimate claim with the stored secret, looked up by the hash in the script', async () => {
    chainHoldsOutput(legitimateClaimScript)

    renderSignPage(
      claimRequest({
        redeemScriptHex: legitimateClaimScript,
        utxo: utxo({ secretHash: { secret_hash_hex: SECRET_HASH } }),
      }),
    )
    await approveThroughModal()

    expect(Electrum.getTransactionData).toHaveBeenCalledWith(TXID)
    expect(Electrum.getOutspend).toHaveBeenCalledWith(TXID, 0)
    expect(Account.unlockHtlsSecret).toHaveBeenCalledTimes(1)
    expect(Account.unlockHtlsSecret).toHaveBeenCalledWith(
      expect.objectContaining({ hash: SECRET_HASH }),
    )
    expect(BTCTransaction.findWalletKeyForRedeemScript).toHaveBeenCalledWith(
      expect.objectContaining({ branch: 'spend' }),
    )

    const response = approveResponse()
    expect(response).not.toBeNull()
    expect(response[0]).toEqual(
      expect.objectContaining({
        method: 'signTransaction_approve',
        requestId: 'claim-1',
        result: { signedTxHex: expect.any(String) },
      }),
    )

    // the signed claim, exactly as today
    const tx = bitcoin.Transaction.fromHex(response[0].result.signedTxHex)
    expect(Buffer.from(tx.ins[0].hash).reverse().toString('hex')).toBe(TXID)
    expect(tx.ins[0].index).toBe(0)
    expect(tx.outs).toHaveLength(1)
    expect(tx.outs[0].value).toBe(
      BigInt(UTXO_VALUE) - BigInt(BTCTransaction.HTLC_CLAIM_FEE_SATOSHIS),
    )
    expect(Buffer.from(tx.outs[0].script)).toEqual(
      Buffer.from(
        bitcoin.address.toOutputScript(DESTINATION, bitcoin.networks.testnet),
      ),
    )
    const witness = tx.ins[0].witness
    expect(witness).toHaveLength(4)
    expect(witnessSecretOf(response[0].result.signedTxHex)).toBe(SECRET)
    expect(Array.from(witness[2])).toEqual([0x01])
    expect(Buffer.from(witness[3]).toString('hex')).toBe(legitimateClaimScript)
  })

  // Positive control with the secret the dApp reveals or the user types.
  test('signs a legitimate claim with the revealed secret when no secret is stored', async () => {
    Account.unlockHtlsSecret.mockRejectedValue(new Error('no saved secret'))
    chainHoldsOutput(legitimateClaimScript)

    renderSignPage(
      claimRequest({
        redeemScriptHex: legitimateClaimScript,
        utxo: utxo(),
        secret: SECRET,
      }),
    )
    await approveThroughModal()

    const response = approveResponse()
    expect(response).not.toBeNull()
    expect(witnessSecretOf(response[0].result.signedTxHex)).toBe(SECRET)
    expect(Account.unlockHtlsSecret).toHaveBeenCalledWith(
      expect.objectContaining({ hash: SECRET_HASH }),
    )
  })

  test('signs a legitimate claim with the typed secret when no secret is stored or revealed', async () => {
    Account.unlockHtlsSecret.mockRejectedValue(new Error('no saved secret'))
    chainHoldsOutput(legitimateClaimScript)

    renderSignPage(
      claimRequest({ redeemScriptHex: legitimateClaimScript, utxo: utxo() }),
    )
    await approveThroughModal(SECRET)

    const response = approveResponse()
    expect(response).not.toBeNull()
    expect(witnessSecretOf(response[0].result.signedTxHex)).toBe(SECRET)
  })
})

describe('SignBitcoinTransaction — refunding an HTLC', () => {
  // A refund pays the wallet's key behind the timelock.
  const refundableScript = compileHtlc({
    spendKey: counterpartyKey,
    refundKey: walletRefundKey,
    secretHashHex: OTHER_HASH,
  })

  test('signs only with the refund-branch key, once the output is verified on chain', async () => {
    chainHoldsOutput(refundableScript)

    renderSignPage(
      refundRequest({ redeemScriptHex: refundableScript, utxo: utxo() }),
    )
    await approveThroughModal()

    expect(Electrum.getTransactionData).toHaveBeenCalledWith(TXID)
    expect(BTCTransaction.findWalletKeyForRedeemScript).toHaveBeenCalledWith(
      expect.objectContaining({ branch: 'refund' }),
    )
    expect(
      BTCTransaction.findWalletKeyForRedeemScript.mock.results[0].value.wif,
    ).toBe(walletRefundKey.toWIF())

    const response = approveResponse()
    expect(response).toEqual([
      expect.objectContaining({
        method: 'signTransaction_approve',
        requestId: 'refund-1',
        result: { signedTxHex: expect.any(String) },
      }),
    ])
    const tx = bitcoin.Transaction.fromHex(response[0].result.signedTxHex)
    expect(tx.version).toBe(2)
    expect(tx.ins[0].sequence).toBe(100)
    // refund witness: [signature, empty (OP_FALSE), witness script]
    const witness = tx.ins[0].witness
    expect(witness).toHaveLength(3)
    expect(witness[1]).toHaveLength(0)
    expect(Buffer.from(witness[2]).toString('hex')).toBe(refundableScript)
  })

  test('refuses a refund whose script pays the wallet key only on the spend branch', async () => {
    const spendBranchOnlyScript = compileHtlc({
      spendKey: walletSpendKey,
      refundKey: counterpartyKey,
      secretHashHex: SECRET_HASH,
    })
    chainHoldsOutput(spendBranchOnlyScript)

    renderSignPage(
      refundRequest({ redeemScriptHex: spendBranchOnlyScript, utxo: utxo() }),
    )
    await approveThroughModal()

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(/does not pay its refund branch/)
    expect(
      BTCTransaction.findWalletKeyForRedeemScript.mock.results[0].value,
    ).toBeNull()
  })

  test('refuses a refund whose output is not found on chain', async () => {
    Electrum.getTransactionData.mockRejectedValue(
      new Error('Request not successful'),
    )

    renderSignPage(
      refundRequest({ redeemScriptHex: refundableScript, utxo: utxo() }),
    )
    await approveThroughModal()

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(/could not be looked up on chain/)
    // fail closed: no key material was unlocked for an unverified output
    expect(Account.unlockAccount).not.toHaveBeenCalled()
  })

  test('refuses a refund whose on-chain output is locked to a different script', async () => {
    chainHoldsOutput(refundableScript, {
      scriptPubKeyHex: p2wshHex(
        compileHtlc({
          spendKey: counterpartyKey,
          refundKey: walletRefundKey,
          secretHashHex: SECRET_HASH,
        }),
      ),
    })

    renderSignPage(
      refundRequest({ redeemScriptHex: refundableScript, utxo: utxo() }),
    )
    await approveThroughModal()

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(/not locked to this HTLC script/)
    expect(Account.unlockAccount).not.toHaveBeenCalled()
  })

  // A refunded or already-claimed output is of no use to refund: the
  // outpoint must still be unspent, like for a claim.
  test.each([
    ['already spent', { spent: true }, /already been spent on chain/],
    ['not confirmed yet', { confirmed: false }, /not confirmed on chain yet/],
  ])(
    'refuses a refund whose output is %s',
    async (_description, chain, error) => {
      chainHoldsOutput(refundableScript, chain)

      renderSignPage(
        refundRequest({ redeemScriptHex: refundableScript, utxo: utxo() }),
      )
      await approveThroughModal()

      expect(sendPopupResponse).not.toHaveBeenCalled()
      expect(onPageError()).toMatch(error)
      expect(Account.unlockAccount).not.toHaveBeenCalled()
    },
  )

  test('refuses a refund when the spend status lookup fails', async () => {
    chainHoldsOutput(refundableScript)
    Electrum.getOutspend.mockRejectedValue(new Error('network down'))

    renderSignPage(
      refundRequest({ redeemScriptHex: refundableScript, utxo: utxo() }),
    )
    await approveThroughModal()

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(
      /spend status of the HTLC output could not be looked up on chain/,
    )
    expect(Account.unlockAccount).not.toHaveBeenCalled()
  })
})
