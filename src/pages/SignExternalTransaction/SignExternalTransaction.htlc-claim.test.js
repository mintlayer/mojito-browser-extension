import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { sendPopupResponse } from '@Browser'
import { Mintlayer } from '@APIs'
import { Account } from '@Entities'
import { Secret } from '@Helpers'

// Keep the output readable: swallow React error-logging noise (this also
// covers the act() warnings fired by async signing-state updates); the
// error log is also inspected for secret leakage below.
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

// Minimal chrome stub — see SignExternalTransaction.TDZ.test.js for why this
// must exist before the page's module graph loads anything reading chrome.*.
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
    notifyApprovalDisplayed: jest.fn(),
  }
  return {
    __esModule: true,
    Browser: api,
    runtime: api.runtime,
    storage: api.storage,
    windows: api.windows,
    sendPopupResponse: api.sendPopupResponse,
    notifyApprovalDisplayed: api.notifyApprovalDisplayed,
  }
})

// The page imports the wasm package by DIRECTORY, bypassing the jest
// moduleNameMapper for `.*wasm_wrappers.js` — mock the resolved module.
jest.mock('../../services/Crypto/Mintlayer/@mintlayerlib-js', () => ({
  __esModule: true,
  Network: Object.freeze({
    Mainnet: 0,
    0: 'Mainnet',
    Testnet: 1,
    1: 'Testnet',
  }),
}))

jest.mock('@Entities', () => ({
  __esModule: true,
  Account: {
    hasPasskey: jest.fn().mockResolvedValue(false),
    unlockAccount: jest.fn(),
    unlockHtlsSecret: jest.fn(),
    saveProvidedHtlsSecret: jest.fn(),
    getPasswordWithPasskey: jest.fn(),
  },
}))

// Plausible providers — real page, real child components, fake wallet state.
const WALLET_SPEND_ADDRESS = 'tmt1qwalletreceiving'
jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      accountID: 'htlc-claim-account',
      addresses: {
        btcAddresses: { btcReceivingAddresses: [], btcChangeAddresses: [] },
        mlAddresses: {
          mlReceivingAddresses: ['tmt1qwalletreceiving'],
          mlChangeAddresses: ['tmt1qwalletchange'],
        },
      },
    }),
    SettingsContext: makeCtx({ networkType: 'testnet' }),
    BitcoinContext: makeCtx({}),
    MintlayerContext: makeCtx({
      currentHeight: 100,
      setAllDataFetching: jest.fn(),
      tokenMap: {},
      allNetworkTokensData: [],
    }),
    TransactionContext: makeCtx({}),
    ExchangeRatesContext: makeCtx({}),
  }
})

// The gate under test is whether the wallet's secret reaches the witness
// encoder, not the wasm itself: the witness encoder (which cannot run in
// this realm) is stood in for by a function that, like it, puts the secret
// it is handed into the signed transaction it returns.
jest.mock('../../utils/Helpers/ML/SignTransaction', () => {
  const actual = jest.requireActual('../../utils/Helpers/ML/SignTransaction')
  return {
    __esModule: true,
    ...actual,
    getTransactionBINrepresentation: jest.fn(() => ({
      inputs: [new Uint8Array([1])],
      outputs: [new Uint8Array([2])],
      transactionsize: 10,
      feeRate: '100000000',
    })),
    getTransactionHEX: jest.fn(
      ({ secret }) =>
        `witness:${secret ? Buffer.from(secret).toString('hex') : 'none'}`,
    ),
    getTransactionIntent: jest.fn(() => 'eeff0011'),
  }
})

// The mocked unlockAccount yields a fake private key; keep the wallet-key
// derivation out of the test with the same deep-module strategy.
jest.mock('../../services/Crypto/Mintlayer/Mintlayer', () => {
  const actual = jest.requireActual('../../services/Crypto/Mintlayer/Mintlayer')
  return {
    __esModule: true,
    ...actual,
    getWalletPrivKeysList: jest.fn(() => ({
      mlReceivingPrivKeys: { tmt1qwalletreceiving: 'walletprivkey' },
      mlChangePrivKeys: { tmt1qwalletchange: 'walletprivkey' },
    })),
  }
})

// The chain: the node API is a mock, no network is ever touched.
jest.mock('../../services/API/Mintlayer/Mintlayer', () => {
  const actual = jest.requireActual('../../services/API/Mintlayer/Mintlayer')
  return {
    __esModule: true,
    ...actual,
    getTransactionData: jest.fn(),
    batchRequestMintlayer: jest.fn(),
  }
})

// hash160 of a hex secret — the hash the wallet locks into an HTLC when it
// creates one.
const hashOf = (secretHex) =>
  Buffer.from(
    Secret.generateSecretHash(Secret.hexToSecret(secretHex)),
  ).toString('hex')

// The wallet's own secret (held in storage for its hash) and an unrelated
// one a dApp may lock into an HTLC.
const SECRET = '33'.repeat(32)
const SECRET_HASH = hashOf(SECRET)
const OTHER_SECRET = '44'.repeat(32)
const OTHER_HASH = hashOf(OTHER_SECRET)

const SOURCE_ID =
  'ee674161da300e36334f4fb644403ca1e8e1cb601a4c8b37d0b579760a3c23b3'
const OTHER_SOURCE_ID =
  'f902a75999200e3e84382bfd4c499547433b2473a3fe8a1c1ae5864171d785b0'
const COUNTERPARTY = 'tmt1qcounterparty'
const TOKEN_ID =
  'tmltk18wg2xa7qxflwmcjpcd7nepsrsjj0gcrqyc7k5ej4cq5q3lf7ry7qtm2l6z'
const ATOMS = '1000000000000'
const DECIMAL = '10'

const coin = (atoms, decimal) => ({
  type: 'Coin',
  amount: { atoms, decimal },
})

// The HTLC output of the funding transaction, as the node serializes it.
const nodeHtlcOutput = ({
  secretHashHex = SECRET_HASH,
  spendKey = WALLET_SPEND_ADDRESS,
  atoms = ATOMS,
  tokenId,
} = {}) => ({
  type: 'Htlc',
  htlc: {
    refund_key: COUNTERPARTY,
    refund_timelock: { content: 20, type: 'ForBlockCount' },
    secret_hash: { hex: secretHashHex, string: null },
    spend_key: spendKey,
  },
  value: tokenId
    ? {
        type: 'TokenV1',
        token_id: tokenId,
        amount: { atoms, decimal: DECIMAL },
      }
    : coin(atoms, DECIMAL),
})

// The HTLC input a dApp asks the wallet to claim, as its transaction
// carries it.
const htlcInput = ({
  secretHashHex = SECRET_HASH,
  spendKey = WALLET_SPEND_ADDRESS,
  atoms = ATOMS,
  tokenId,
  index = 0,
  sourceId = SOURCE_ID,
} = {}) => ({
  input: {
    index,
    input_type: 'UTXO',
    source_id: sourceId,
    source_type: 'Transaction',
  },
  utxo: {
    destination: spendKey,
    type: 'Htlc',
    htlc: {
      refund_key: COUNTERPARTY,
      refund_timelock: { content: 20, type: 'ForBlockCount' },
      secret_hash: { hex: secretHashHex, string: null },
      spend_key: spendKey,
    },
    value: tokenId
      ? {
          type: 'TokenV1',
          token_id: tokenId,
          amount: { atoms, decimal: DECIMAL },
        }
      : coin(atoms, DECIMAL),
  },
})

// A claim request: the HTLC input plus the output paying the spend key.
const claimRequest = (input, { outputAtoms = '990000000000' } = {}) => ({
  request: {
    origin: 'https://dapp.example',
    requestId: 'claim-1',
    network: 'testnet',
    data: {
      chain: 'mintlayer',
      txData: {
        JSONRepresentation: {
          inputs: [input],
          outputs: [
            {
              destination: input.utxo.htlc.spend_key,
              type: 'Transfer',
              value: coin(outputAtoms, '9.9'),
            },
          ],
        },
      },
    },
  },
})

// The batch endpoint's answers, as the client hands them to the wallet
// (batchRequestMintlayer returns results.flat()). No captured answer of
// either type exists in the repository; these fixtures are built from:
//  - type '/transaction/:txid' — one id asked, one transaction back. id,
//    confirmations, inputs, outputs[].type, outputs[].value.token_id and
//    outputs[].value.amount.decimal are what ML.getParsedTransactions reads
//    (ML.js), fed by MintlayerProvider through ML.getBatchData.
//  - type '/address/:address/spendable-utxos' — the address's UTXOs as
//    items of { outpoint: { source_id, index }, utxo: { type, value } },
//    read by MintlayerProvider (item.outpoint, item.utxo) and, for the
//    atoms of utxo.value, by the SDK the wallet hands them to.
//  - outputs[].htlc (spend key and secret hash) and
//    outputs[].value.amount.atoms of the transaction answer, and the htlc
//    object inside the spendable-UTXO items — the fields the verification
//    turns on — are read from those answers by nothing in the wallet's
//    production code. Their shape here follows the dApp request fixtures
//    for an HTLC input (type 'Htlc', htlc.secret_hash as { hex, string },
//    value.amount as { atoms, decimal }) and is unverified against a live
//    node.
const TRANSACTION_TYPE = '/transaction/:txid'
const SPENDABLE_UTXOS_TYPE = '/address/:address/spendable-utxos'
const NODE_TRANSACTION_ANSWER = {
  id: SOURCE_ID,
  confirmations: 1,
  inputs: [],
  outputs: [nodeHtlcOutput()],
}
const NODE_SPENDABLE_UTXOS_ANSWER = [
  {
    outpoint: { source_id: SOURCE_ID, source_type: 'Transaction', index: 0 },
    utxo: nodeHtlcOutput(),
  },
]

// The batch answer for one transaction id: the decoded transaction holding
// an HTLC output at index 0.
const chainTransaction = ({
  id = SOURCE_ID,
  type = 'Htlc',
  secretHashHex = SECRET_HASH,
  spendKey = WALLET_SPEND_ADDRESS,
  atoms = ATOMS,
  tokenId,
  confirmations = 1,
} = {}) => ({
  ...(confirmations === null ? {} : { confirmations }),
  id,
  inputs: [],
  outputs: [
    type === 'Htlc'
      ? nodeHtlcOutput({ secretHashHex, spendKey, atoms, tokenId })
      : {
          destination: WALLET_SPEND_ADDRESS,
          type: 'Transfer',
          value: coin(atoms, DECIMAL),
        },
  ],
})

// The batch answer for one address: its spendable UTXOs, holding the HTLC
// output at index 0 of the funding transaction.
const chainSpendableUtxos = (overrides) => [
  {
    outpoint: { source_id: SOURCE_ID, source_type: 'Transaction', index: 0 },
    utxo: nodeHtlcOutput(overrides),
  },
]

// The node answers the batch endpoint by type: the transaction for the
// transaction lookup, the UTXOs for the spendable-utxo lookup.
const nodeAnswers = (
  transactionAnswer = [chainTransaction()],
  spendableUtxosAnswer = chainSpendableUtxos(),
) =>
  Mintlayer.batchRequestMintlayer.mockImplementation(({ type }) => {
    if (type === TRANSACTION_TYPE) return Promise.resolve(transactionAnswer)
    if (type === SPENDABLE_UTXOS_TYPE) {
      return Promise.resolve(spendableUtxosAnswer)
    }
    return Promise.reject(new Error(`unexpected batch type ${type}`))
  })

// The chain holds exactly the confirmed, unspent HTLC output the request
// describes.
const chainHoldsOutput = (transactionOverrides, utxoOverrides) =>
  nodeAnswers(
    [chainTransaction(transactionOverrides)],
    chainSpendableUtxos(utxoOverrides),
  )

const renderSignPage = (state) =>
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/wallet/Mintlayer/sign-external-transaction',
          state,
        },
      ]}
    >
      <Routes>
        <Route
          path="/wallet/:coinType/sign-external-transaction"
          element={<SignTransactionPage />}
        />
      </Routes>
    </MemoryRouter>,
  )

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const {
  SignTransactionPage,
  resolveWalletSecretUse,
} = require('./SignExternalTransaction')
// eslint-disable-next-line import/first
const { getTransactionHEX } = require('../../utils/Helpers/ML/SignTransaction')

// The one approval response the dApp would have received, if any.
const approveResponse = () =>
  sendPopupResponse.mock.calls.find(
    ([response]) => response.method === 'signTransaction_approve',
  ) ?? null

const onPageError = () =>
  document.querySelector('.sign-error')?.textContent ?? ''

const settleSigning = async () =>
  waitFor(() =>
    expect(
      approveResponse() !== null ||
        document.querySelector('.sign-error') !== null,
    ).toBe(true),
  )

const approveThroughModal = async (typedSecret) => {
  fireEvent.click(screen.getByText('Approve and return to page'))
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: 'wallet-password' },
  })
  if (typedSecret !== undefined) {
    fireEvent.change(screen.getByPlaceholderText('Placeholder'), {
      target: { value: typedSecret },
    })
  }
  fireEvent.click(screen.getByText('Approve'))
  await settleSigning()
}

// Every channel a refusal could leak through: the response, the on-page
// error text and the console. None may carry the wallet's secret.
const expectSecretNowhere = () => {
  expect(JSON.stringify(sendPopupResponse.mock.calls)).not.toContain(SECRET)
  expect(onPageError()).not.toContain(SECRET)
  expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(SECRET)
  expect(JSON.stringify(warnSpy.mock.calls)).not.toContain(SECRET)
}

// A refusal happens before the wallet is unlocked and before anything is
// fetched or signed: neither the keys, nor the stored secret, nor the
// witness encoder are ever reached.
const expectNothingReached = () => {
  expect(Account.unlockAccount).not.toHaveBeenCalled()
  expect(Account.unlockHtlsSecret).not.toHaveBeenCalled()
  expect(getTransactionHEX).not.toHaveBeenCalled()
}

beforeEach(() => {
  jest.clearAllMocks()
  errorSpy.mockClear()
  warnSpy.mockClear()
  Account.unlockAccount.mockResolvedValue({
    mlPrivKeys: { mlTestnetPrivateKey: 'testnetprivkey' },
  })
  // The wallet holds its own secret for its hash, and nothing else.
  Account.unlockHtlsSecret.mockImplementation(async ({ hash }) => {
    if (hash === SECRET_HASH) return SECRET
    throw new Error('No secret found for the provided hash')
  })
  Mintlayer.getTransactionData.mockRejectedValue(
    new Error('the direct transaction endpoint is not consulted'),
  )
  Mintlayer.batchRequestMintlayer.mockRejectedValue(new Error('not mocked'))
})

afterAll(() => {
  errorSpy.mockRestore()
  warnSpy.mockRestore()
})

describe('SignTransactionPage — claiming an HTLC with the wallet secret', () => {
  // An HTLC input whose spend_key is a wallet address and whose secret hash
  // is the hash of a secret the wallet holds in storage, over an outpoint
  // that does not exist on chain (the node holds no transaction for it).
  // The dApp would receive the wallet's secret in the witness and take the
  // wallet's own HTLC with it.
  test('refuses a claim over an outpoint that does not exist on chain, before the wallet is unlocked', async () => {
    nodeAnswers([])

    renderSignPage(claimRequest(htlcInput()))
    await approveThroughModal()

    // The response, had there been one, must not carry the secret in its
    // witness.
    const response = approveResponse()
    const witness =
      response === null ? 'no response' : String(response[0].result)
    expect(witness).not.toContain(SECRET)
    expect(sendPopupResponse).not.toHaveBeenCalled()

    expect(onPageError()).toMatch(/could not be read from the chain/)
    expectNothingReached()
    expectSecretNowhere()
  })

  test('refuses a claim whose outpoint is not an HTLC output on chain, before the wallet is unlocked', async () => {
    chainHoldsOutput({ type: 'Transfer' })

    renderSignPage(claimRequest(htlcInput()))
    await approveThroughModal()

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(/not an HTLC output on chain/)
    expectNothingReached()
    expectSecretNowhere()
  })

  // Each refusal on its own: every other fact of the request is legitimate,
  // so only the named one can be the cause.
  describe('refuses, before the wallet is unlocked, when', () => {
    const refusalCases = [
      [
        'the on-chain output pays its spend branch to a different key',
        () => {
          chainHoldsOutput({ spendKey: COUNTERPARTY })
          return {
            state: claimRequest(htlcInput()),
            error: /pays its spend branch to a different key/,
          }
        },
      ],
      [
        'the on-chain output is locked to a different secret hash',
        () => {
          chainHoldsOutput({ secretHashHex: OTHER_HASH })
          return {
            state: claimRequest(htlcInput()),
            error: /locked to a different secret hash/,
          }
        },
      ],
      [
        'the input carries no readable secret hash',
        () => {
          chainHoldsOutput()
          return {
            state: claimRequest(htlcInput({ secretHashHex: 'not-a-hash' })),
            error: /no readable secret hash/,
            chainLookedUp: false,
          }
        },
      ],
      [
        'the input names no transaction output',
        () => {
          const input = htlcInput()
          input.input.index = -1
          return {
            state: claimRequest(input),
            error: /does not name a transaction output/,
            chainLookedUp: false,
          }
        },
      ],
      [
        'the on-chain output holds a different amount',
        () => {
          chainHoldsOutput({ atoms: '900000000000' })
          return {
            state: claimRequest(htlcInput()),
            error: /different amount/,
          }
        },
      ],
      [
        'the on-chain output holds a different asset',
        () => {
          chainHoldsOutput({ tokenId: TOKEN_ID })
          return {
            state: claimRequest(htlcInput()),
            error: /different asset/,
          }
        },
      ],
      [
        'the node answers with a different transaction',
        () => {
          chainHoldsOutput({ id: OTHER_SOURCE_ID })
          return {
            state: claimRequest(htlcInput()),
            error: /different transaction/,
          }
        },
      ],
      [
        'the funding transaction is unconfirmed',
        () => {
          chainHoldsOutput({ confirmations: 0 })
          return {
            state: claimRequest(htlcInput()),
            error: /not confirmed on chain yet/,
          }
        },
      ],
      [
        'the transaction answer carries no confirmation count',
        () => {
          chainHoldsOutput({ confirmations: null })
          return {
            state: claimRequest(htlcInput()),
            error: /not confirmed on chain yet/,
          }
        },
      ],
      [
        "the output is no longer among the spend key's spendable UTXOs",
        () => {
          nodeAnswers([chainTransaction()], [])
          return {
            state: claimRequest(htlcInput()),
            error: /no longer an unspent output/,
          }
        },
      ],
      [
        'the outpoint is spendable but is not the HTLC being claimed',
        () => {
          chainHoldsOutput({}, { secretHashHex: OTHER_HASH })
          return {
            state: claimRequest(htlcInput()),
            error: /is not the HTLC being claimed/,
          }
        },
      ],
      [
        'the spendable UTXO answer is not a list',
        () => {
          nodeAnswers(undefined, {
            results: [[NODE_SPENDABLE_UTXOS_ANSWER[0]]],
          })
          return {
            state: claimRequest(htlcInput()),
            error: /no longer an unspent output/,
          }
        },
      ],
      [
        'the spendable UTXO lookup fails',
        () => {
          Mintlayer.batchRequestMintlayer.mockImplementation(({ type }) =>
            type === SPENDABLE_UTXOS_TYPE
              ? Promise.reject(new Error('network down'))
              : Promise.resolve([chainTransaction()]),
          )
          return {
            state: claimRequest(htlcInput()),
            error: /could not be looked up on chain/,
          }
        },
      ],
      [
        'the batch answer holds no transaction for the outpoint',
        () => {
          nodeAnswers([])
          return {
            state: claimRequest(htlcInput()),
            error: /could not be read from the chain/,
          }
        },
      ],
      [
        'the batch answer holds more than one transaction',
        () => {
          nodeAnswers([chainTransaction(), chainTransaction()])
          return {
            state: claimRequest(htlcInput()),
            error: /could not be read from the chain/,
          }
        },
      ],
      [
        'the batch answer holds no readable transaction',
        () => {
          nodeAnswers([null])
          return {
            state: claimRequest(htlcInput()),
            error: /could not be read from the chain/,
          }
        },
      ],
      [
        'the transaction lookup fails',
        () => {
          Mintlayer.batchRequestMintlayer.mockRejectedValue(
            new Error('network down'),
          )
          return {
            state: claimRequest(htlcInput()),
            error: /could not be looked up on chain/,
          }
        },
      ],
    ]

    test.each(refusalCases)('%s', async (_description, setup) => {
      const { state, error, chainLookedUp = true } = setup()

      renderSignPage(state)
      await approveThroughModal()

      expect(sendPopupResponse).not.toHaveBeenCalled()
      expect(onPageError()).toMatch(error)
      expectNothingReached()
      if (chainLookedUp) {
        expect(Mintlayer.batchRequestMintlayer).toHaveBeenCalledWith({
          ids: [SOURCE_ID],
          type: TRANSACTION_TYPE,
        })
      } else {
        expect(Mintlayer.batchRequestMintlayer).not.toHaveBeenCalled()
      }
      // the direct transaction endpoint is never consulted
      expect(Mintlayer.getTransactionData).not.toHaveBeenCalled()
      expectSecretNowhere()
    })
  })

  // The typed secret is held to the same checks as a stored one.
  test('refuses a typed secret that does not hash to the on-chain secret hash', async () => {
    chainHoldsOutput()

    renderSignPage(claimRequest(htlcInput()))
    await approveThroughModal(OTHER_SECRET)

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(/does not match the hash of the HTLC/)
    expectNothingReached()
    expectSecretNowhere()
  })

  test('refuses a typed secret when the chain lookup fails', async () => {
    Mintlayer.batchRequestMintlayer.mockRejectedValue(new Error('network down'))

    renderSignPage(claimRequest(htlcInput()))
    await approveThroughModal(SECRET)

    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(onPageError()).toMatch(/could not be looked up on chain/)
    expectNothingReached()
    expectSecretNowhere()
  })

  // The node may serialize the same facts slightly differently; every
  // spelling below is the same confirmed, unspent HTLC output.
  test('accepts the shape variants the node may serialize', async () => {
    const variantHtlcOutput = {
      type: 'Htlc',
      htlc: {
        refund_key: COUNTERPARTY,
        refund_timelock: { content: 20, type: 'ForBlockCount' },
        secret_hash: SECRET_HASH,
        spend_key: WALLET_SPEND_ADDRESS,
      },
      value: {
        type: 'Coin',
        amount: { atoms: Number(ATOMS), decimal: DECIMAL },
      },
    }
    nodeAnswers(
      [
        {
          txid: SOURCE_ID,
          confirmations: 12,
          inputs: [],
          outputs: [variantHtlcOutput],
        },
      ],
      [
        {
          outpoint: { source_id: SOURCE_ID, index: 0 },
          utxo: variantHtlcOutput,
        },
      ],
    )

    renderSignPage(claimRequest(htlcInput()))
    await approveThroughModal()

    const response = approveResponse()
    expect(response).not.toBeNull()
    expect(response[0].result).toContain(SECRET)
    expect(Account.unlockHtlsSecret).toHaveBeenCalledWith(
      expect.objectContaining({ hash: SECRET_HASH }),
    )
  })

  // The direct transaction endpoint is not what proves the output: the
  // node's own answer to it may nest the transaction body one level deeper
  // than the wallet's batch answer, which would read as an unconfirmed or
  // non-HTLC output. The claim is read from the batch answer the wallet's
  // history is built from, and the direct endpoint is never asked.
  test('reads the transaction from the batch answer, never from the direct transaction endpoint', async () => {
    chainHoldsOutput()
    Mintlayer.getTransactionData.mockResolvedValue({
      txid: SOURCE_ID,
      tx: NODE_TRANSACTION_ANSWER,
    })

    renderSignPage(claimRequest(htlcInput()))
    await approveThroughModal()

    const response = approveResponse()
    expect(response).not.toBeNull()
    expect(response[0].result).toContain(SECRET)
    expect(Mintlayer.getTransactionData).not.toHaveBeenCalled()
    expect(Mintlayer.batchRequestMintlayer).toHaveBeenCalledWith({
      ids: [SOURCE_ID],
      type: TRANSACTION_TYPE,
    })
  })

  // Positive control: the node holds a confirmed HTLC output paying the
  // wallet's spend key for the hash of the wallet's own secret, still
  // among the spend key's spendable UTXOs. The claim signs exactly as
  // before — the secret reaches the witness encoder.
  test('signs a legitimate claim with the stored secret, looked up by the on-chain hash', async () => {
    chainHoldsOutput()

    renderSignPage(claimRequest(htlcInput()))
    await approveThroughModal()

    expect(Mintlayer.batchRequestMintlayer).toHaveBeenCalledWith({
      ids: [SOURCE_ID],
      type: TRANSACTION_TYPE,
    })
    expect(Mintlayer.batchRequestMintlayer).toHaveBeenCalledWith({
      ids: [WALLET_SPEND_ADDRESS],
      type: SPENDABLE_UTXOS_TYPE,
    })
    expect(Mintlayer.getTransactionData).not.toHaveBeenCalled()
    expect(Account.unlockHtlsSecret).toHaveBeenCalledTimes(1)
    expect(Account.unlockHtlsSecret).toHaveBeenCalledWith(
      expect.objectContaining({ hash: SECRET_HASH }),
    )

    const response = approveResponse()
    expect(response).not.toBeNull()
    expect(response[0]).toEqual(
      expect.objectContaining({
        method: 'signTransaction_approve',
        requestId: 'claim-1',
        origin: 'https://dapp.example',
        result: expect.stringContaining('witness:'),
      }),
    )
    // the secret, in the witness, exactly as today
    expect(response[0].result).toContain(SECRET)
    expect(getTransactionHEX).toHaveBeenCalledWith(
      expect.objectContaining({
        secret: new Uint8Array(Buffer.from(SECRET, 'hex')),
      }),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    )
  })

  test('signs a legitimate claim with the typed secret when no secret is stored', async () => {
    Account.unlockHtlsSecret.mockRejectedValue(new Error('no saved secret'))
    chainHoldsOutput()

    renderSignPage(claimRequest(htlcInput()))
    await approveThroughModal(SECRET)

    const response = approveResponse()
    expect(response).not.toBeNull()
    expect(response[0].result).toContain(SECRET)
    expect(Account.unlockHtlsSecret).not.toHaveBeenCalled()
  })

  // A refund names the counterparty as spend key: no wallet secret could
  // reach its witness, so nothing is verified or fetched for it.
  test('does not fetch the stored secret for an HTLC input whose spend key is not a wallet address', async () => {
    chainHoldsOutput({ spendKey: COUNTERPARTY })

    renderSignPage(claimRequest(htlcInput({ spendKey: COUNTERPARTY })))
    await approveThroughModal()

    expect(Account.unlockHtlsSecret).not.toHaveBeenCalled()
    expect(Mintlayer.batchRequestMintlayer).not.toHaveBeenCalled()
    expect(approveResponse()).not.toBeNull()
    expect(approveResponse()[0].result).toBe('witness:none')
  })

  // The secret prompt belongs to a claim by this wallet alone: an HTLC
  // input whose spend key is not a wallet address never asks for one.
  test('does not ask for a secret when no HTLC input pays its spend branch to this wallet', async () => {
    chainHoldsOutput({ spendKey: COUNTERPARTY })

    renderSignPage(claimRequest(htlcInput({ spendKey: COUNTERPARTY })))
    fireEvent.click(screen.getByText('Approve and return to page'))

    expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()
    expect(screen.queryByText(/HTLC Secret:/)).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Placeholder')).not.toBeInTheDocument()
  })
})

describe('resolveWalletSecretUse — which secret a request may sign with', () => {
  const claimed = [htlcInput()]

  it('uses the stored secret for a claimed input when nothing is typed and the request brings no witness', () => {
    expect(
      resolveWalletSecretUse({
        claimedInputs: claimed,
        typedSecret: '',
        witnessInputGiven: false,
      }),
    ).toEqual({ typedSecretUsed: false, storedSecretUsed: true })
  })

  it('uses the typed secret for a claimed input', () => {
    expect(
      resolveWalletSecretUse({
        claimedInputs: claimed,
        typedSecret: SECRET,
        witnessInputGiven: false,
      }),
    ).toEqual({ typedSecretUsed: true, storedSecretUsed: false })
  })

  it('signs no wallet secret when the request brings its own witness and nothing is typed', () => {
    expect(
      resolveWalletSecretUse({
        claimedInputs: claimed,
        typedSecret: '',
        witnessInputGiven: true,
      }),
    ).toEqual({ typedSecretUsed: false, storedSecretUsed: false })
    expect(
      resolveWalletSecretUse({
        claimedInputs: [],
        typedSecret: '',
        witnessInputGiven: false,
      }),
    ).toEqual({ typedSecretUsed: false, storedSecretUsed: false })
  })

  // A typed secret with no claimed input has nothing it could be signed
  // for: it is refused before any key or secret is touched.
  it('refuses a typed secret when no HTLC input pays its spend branch to this wallet', () => {
    expect(() =>
      resolveWalletSecretUse({
        claimedInputs: [],
        typedSecret: SECRET,
        witnessInputGiven: false,
      }),
    ).toThrow(/no HTLC input of this transaction pays its spend branch/)
  })
})
