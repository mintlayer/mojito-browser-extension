import { useLocation } from 'react-router'
import {
  SignTransaction as SignTxHelpers,
  Secret,
  TransactionAmounts,
} from '@Helpers'
import { MOCKS } from './mocks'
import {
  Button,
  Error as ErrorBanner,
  PageWrapper,
  SiteBadge,
} from '@BasicComponents'
import { PopUp, TextField } from '@ComposedComponents'
import { SignTransaction } from '@ContainerComponents'
import { MintlayerContext } from '@Contexts'

import './SignExternalTransaction.css'
import { useState, useContext, useEffect } from 'react'
import { Network } from '../../services/Crypto/Mintlayer/@mintlayerlib-js'
import { Account } from '@Entities'
import { ML } from '@Cryptos'
import { AccountContext, SettingsContext } from '@Contexts'
import { Mintlayer } from '@APIs'
import { sendPopupResponse } from '@Browser'

const isDevelopment = process.env.NODE_ENV === 'development'

// A refusal to sign an HTLC spend the wallet cannot verify. Carries no
// secret: the message only ever describes what failed.
const htlcSpendRefusal = (message) =>
  Object.assign(new Error(message), { code: 'HTLC_SPEND_UNVERIFIED' })

const isWalletAddress = (address, walletAddresses) =>
  typeof address === 'string' && walletAddresses.includes(address)

// The chain's hash over a hex secret — the one the wallet locks into an
// HTLC when it creates one (Secret.generateSecretHash).
const htlcSecretHashHex = (secretHex) =>
  Buffer.from(
    Secret.generateSecretHash(Secret.hexToSecret(secretHex)),
  ).toString('hex')

const isSecretHashHex = (hex) =>
  typeof hex === 'string' && /^[0-9a-fA-F]{40}$/.test(hex)

// A node-serialized secret hash: a plain hex string or `{ hex }`.
const readSecretHashHex = (secretHash) => {
  const hex = typeof secretHash === 'string' ? secretHash : secretHash?.hex
  return isSecretHashHex(hex) ? hex.toLowerCase() : null
}

// Atoms as BigInt from a node-serialized amount (a digit string or a safe
// integer), or null when unreadable.
const atomsOf = (value) => {
  const raw = value?.amount?.atoms
  if (typeof raw === 'number' && !Number.isSafeInteger(raw)) return null
  try {
    const atoms = BigInt(raw)
    return atoms < 0n ? null : atoms
  } catch {
    return null
  }
}

// The asset of a node-serialized value: a token id, or null for the coin.
const tokenIdOf = (value) => value?.token_id ?? null

const isSameOutpoint = (outpoint, sourceId, index) =>
  typeof outpoint?.source_id === 'string' &&
  outpoint.source_id.toLowerCase() === sourceId.toLowerCase() &&
  outpoint.index === index

/**
 * Verifies an HTLC input the wallet is asked to spend with its secret
 * against the chain, before any key or secret is used.
 *
 * Both answers come from the node's batch endpoint — the one the wallet's
 * own history is built from (MintlayerProvider → ML.getBatchData →
 * batchRequestMintlayer):
 *  - the transaction at input.source_id, asked for by that one id: the
 *    answer must hold exactly that one transaction. It must be CONFIRMED
 *    (confirmations > 0) and have an HTLC output at input.index with the
 *    same spend_key, secret hash, asset and value as the request describes.
 *    Of the fields read here from the transaction answer, id,
 *    confirmations, outputs[].type, outputs[].value.token_id and
 *    outputs[].value.amount.decimal are what the production parser reads
 *    (ML.getParsedTransactions). outputs[].htlc — the spend key and secret
 *    hash this verification turns on — and outputs[].value.amount.atoms are
 *    read from this answer by nothing in the wallet's production code:
 *    their shape here follows the wallet's request fixtures and is
 *    unverified against a live node, which must be checked before relying
 *    on this path.
 *  - the spendable UTXOs of the spend_key address, items of
 *    { outpoint: { source_id, index }, utxo: { type, value } } as
 *    MintlayerProvider reads them (item.outpoint, item.utxo) and as the
 *    SDK reads the atoms of utxo.value; the htlc object inside utxo — its
 *    spend_key and secret_hash are compared too — is read from this answer
 *    by nothing in production and is likewise known only from the request
 *    fixtures and unverified against a live node.
 *    The outpoint must still be among them, describing the same HTLC.
 *    That answer carries no confirmation indicator, which is why
 *    confirmation is required from the transaction answer.
 *
 * Returns the on-chain secret hash — the only key a stored secret may be
 * looked up by. Fail closed: a lookup that cannot be completed refuses as
 * well.
 */
const verifyHtlcSpendInput = async ({ input }) => {
  const outpoint = input?.input
  const htlc = input?.utxo?.htlc
  if (
    typeof outpoint?.source_id !== 'string' ||
    !/^[0-9a-fA-F]{64}$/.test(outpoint.source_id) ||
    !Number.isInteger(outpoint?.index) ||
    outpoint.index < 0
  ) {
    throw htlcSpendRefusal('The HTLC input does not name a transaction output.')
  }
  const requestedHash = readSecretHashHex(htlc?.secret_hash)
  if (!requestedHash) {
    throw htlcSpendRefusal('The HTLC input carries no readable secret hash.')
  }
  const requestedAtoms = atomsOf(input.utxo?.value)
  const requestedTokenId = tokenIdOf(input.utxo?.value)

  // The transaction, fetched the way the wallet's history fetches it: the
  // batch endpoint with the transaction lookup as its type, one id asked
  // and exactly one transaction expected back.
  let transactions
  try {
    transactions = await Mintlayer.batchRequestMintlayer({
      ids: [outpoint.source_id],
      type: Mintlayer.MINTLAYER_ENDPOINTS.GET_TRANSACTION_DATA,
    })
  } catch {
    throw htlcSpendRefusal(
      'The HTLC output could not be looked up on chain. Check your connection and try again.',
    )
  }
  const transaction =
    Array.isArray(transactions) && transactions.length === 1
      ? transactions[0]
      : null
  if (!transaction || typeof transaction !== 'object') {
    throw htlcSpendRefusal(
      'The transaction holding the HTLC output could not be read from the chain.',
    )
  }
  const reportedId = transaction.txid ?? transaction.id
  if (
    typeof reportedId !== 'string' ||
    reportedId.toLowerCase() !== outpoint.source_id.toLowerCase()
  ) {
    throw htlcSpendRefusal(
      'The node returned a different transaction than the one being claimed.',
    )
  }
  if (
    !Number.isInteger(transaction.confirmations) ||
    transaction.confirmations <= 0
  ) {
    throw htlcSpendRefusal(
      'The transaction holding the HTLC output is not confirmed on chain yet.',
    )
  }
  const output = Array.isArray(transaction.outputs)
    ? transaction.outputs[outpoint.index]
    : null
  if (!output || output.type !== 'Htlc' || typeof output.htlc !== 'object') {
    throw htlcSpendRefusal(
      'The output being claimed is not an HTLC output on chain.',
    )
  }
  if (output.htlc.spend_key !== htlc.spend_key) {
    throw htlcSpendRefusal(
      'The HTLC output on chain pays its spend branch to a different key.',
    )
  }
  const chainHash = readSecretHashHex(output.htlc.secret_hash)
  if (!chainHash) {
    throw htlcSpendRefusal(
      'The HTLC output on chain carries no readable secret hash.',
    )
  }
  if (chainHash !== requestedHash) {
    throw htlcSpendRefusal(
      'The HTLC output on chain is locked to a different secret hash than the request states.',
    )
  }
  const chainAtoms = atomsOf(output.value)
  if (
    chainAtoms === null ||
    requestedAtoms === null ||
    chainAtoms !== requestedAtoms
  ) {
    throw htlcSpendRefusal(
      'The HTLC output on chain holds a different amount than the request states.',
    )
  }
  if (tokenIdOf(output.value) !== requestedTokenId) {
    throw htlcSpendRefusal(
      'The HTLC output on chain holds a different asset than the request states.',
    )
  }

  // Still unspent: the outpoint is among the spend key's spendable UTXOs
  // (the same batch endpoint, with the spendable-utxo lookup as its type),
  // and that entry describes the same HTLC.
  let spendable
  try {
    spendable = await Mintlayer.batchRequestMintlayer({
      ids: [htlc.spend_key],
      type: Mintlayer.MINTLAYER_ENDPOINTS.GET_ADDRESS_SPENDABLE_UTXO,
    })
  } catch {
    throw htlcSpendRefusal(
      'The HTLC output could not be looked up on chain. Check your connection and try again.',
    )
  }
  const live = Array.isArray(spendable)
    ? spendable.find((item) =>
        isSameOutpoint(item?.outpoint, outpoint.source_id, outpoint.index),
      )
    : null
  if (!live) {
    throw htlcSpendRefusal(
      'The HTLC output being claimed is no longer an unspent output of its spend key.',
    )
  }
  const liveHtlc = live.utxo?.htlc
  if (
    live.utxo?.type !== 'Htlc' ||
    typeof liveHtlc !== 'object' ||
    liveHtlc?.spend_key !== htlc.spend_key ||
    readSecretHashHex(liveHtlc?.secret_hash) !== chainHash ||
    atomsOf(live.utxo?.value) !== requestedAtoms ||
    tokenIdOf(live.utxo?.value) !== requestedTokenId
  ) {
    throw htlcSpendRefusal(
      'The unspent output at this outpoint is not the HTLC being claimed.',
    )
  }
  return chainHash
}

/**
 * Decides whether a wallet secret will be signed into the request and
 * where it comes from. A typed secret must have an HTLC input paying its
 * spend branch to this wallet — there is nothing it could legitimately be
 * signed for otherwise. The stored secret is used when such an input
 * exists, nothing was typed and the request brings no witness of its own.
 */
export const resolveWalletSecretUse = ({
  claimedInputs,
  typedSecret,
  witnessInputGiven,
}) => {
  const typedSecretUsed = typedSecret !== ''
  if (typedSecretUsed && claimedInputs.length === 0) {
    throw htlcSpendRefusal(
      'A secret was entered, but no HTLC input of this transaction pays its spend branch to this wallet.',
    )
  }
  return {
    typedSecretUsed,
    storedSecretUsed:
      claimedInputs.length > 0 && !typedSecretUsed && !witnessInputGiven,
  }
}

export const SignTransactionPage = () => {
  const { state: external_state } = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')

  // Declared BEFORE the effects below: their dependency arrays are
  // evaluated during render, and referencing `accountID` above its
  // declaration is a temporal-dead-zone crash on every render.
  const { addresses, accountID } = useContext(AccountContext)

  const [hasPasskey, setHasPasskey] = useState(false)

  useEffect(() => {
    if (!accountID) return
    let cancelled = false
    Account.hasPasskey(accountID).then((has) => {
      if (!cancelled) setHasPasskey(has)
    })
    return () => {
      cancelled = true
    }
  }, [accountID])
  const [usePasswordEntry, setPasswordEntry] = useState(false)
  const [secret, setSecret] = useState('')

  const { currentHeight, allNetworkTokensData } = useContext(MintlayerContext)
  const { networkType } = useContext(SettingsContext)

  const blockHeight = currentHeight ? BigInt(currentHeight) : 0n

  // Secret management state for HTLC transactions
  const [generatedSecret, setGeneratedSecret] = useState(null)
  const [generatedSecretHash, setGeneratedSecretHash] = useState(null)
  const [secretError, setSecretError] = useState('')

  const [isSigning, setIsSigning] = useState(false)
  // SECURITY: a dApp-supplied `intent` is opaque bytes the wallet signs
  // alongside the transaction. Signing requires the user to explicitly
  // acknowledge them — the summary shows the full bytes, this gate makes
  // the approval a conscious act instead of a habitual password entry.
  const [intentAcknowledged, setIntentAcknowledged] = useState(false)
  const [signError, setSignError] = useState('')

  const [selectedMock, setSelectedMock] = useState('transfer')
  const extraButtonStyles = ['buttonSignTransaction']

  // State to hold the potentially modified transaction data
  const [transactionState, setTransactionState] = useState(null)

  const state =
    transactionState ||
    external_state ||
    (isDevelopment ? MOCKS[selectedMock] : null)
  const origin = state?.request?.origin

  const currentMlAddresses = addresses.mlAddresses

  // SECURITY: fail closed when the dApp-reported amounts do not match the
  // transaction that would actually be signed. This is the same
  // reconciliation the summary renders from, so what was reviewed is what
  // can be approved — a mismatching request can never reach the signer.
  // Malformed payloads (non-array legs, unreadable entries, an intent that
  // is not a string) are blocked by the same rule.
  const jsonRepresentation = state?.request?.data?.txData?.JSONRepresentation
  const intent = state?.request?.data?.txData?.intent
  const tokenDecimalsById =
    TransactionAmounts.buildTokenDecimalsIndex(allNetworkTokensData)
  const { blocked: approvalBlocked } = jsonRepresentation
    ? TransactionAmounts.reconcileApprovalAmounts(jsonRepresentation, {
        tokenDecimalsById,
        ownAddresses: {
          receiving: currentMlAddresses.mlReceivingAddresses,
          change: currentMlAddresses.mlChangeAddresses,
        },
        intent,
      })
    : { blocked: false }

  const network = networkType === 'testnet' ? Network.Testnet : Network.Mainnet

  const hasIntent = Boolean(intent)

  // Fail closed on malformed payloads: legs may not even be arrays (the
  // background forwards dApp params unvalidated), their entries may not be
  // objects, and an HTLC-shaped input may arrive without an htlc object —
  // never dereference them during render; a crash here would wedge the
  // approval window behind the ErrorBoundary. reconcileApprovalAmounts
  // blocks non-array legs and malformed entries.
  const payloadInputs = Array.isArray(jsonRepresentation?.inputs)
    ? jsonRepresentation.inputs
    : []
  const payloadOutputs = Array.isArray(jsonRepresentation?.outputs)
    ? jsonRepresentation.outputs
    : []
  const htlcInputs = payloadInputs.filter(
    (input) =>
      input?.input?.input_type === 'UTXO' && input?.utxo?.type === 'Htlc',
  )
  const isHTLCTx = htlcInputs.length > 0

  // The HTLC inputs whose spend branch pays this wallet — the only ones
  // this wallet's secret could ever be placed into. An HTLC input whose
  // spend key is not a wallet address is not a claim by this wallet.
  const walletMlAddresses = [
    ...currentMlAddresses.mlReceivingAddresses,
    ...currentMlAddresses.mlChangeAddresses,
  ]
  const claimedInputs = htlcInputs.filter((input) =>
    isWalletAddress(input?.utxo?.htlc?.spend_key, walletMlAddresses),
  )
  const claimedInput = claimedInputs[0]

  const isHTLCCreateTx = payloadOutputs.some(
    (output) => output?.type === 'Htlc',
  )

  // A claim by this wallet: an HTLC input pays its spend branch to this
  // wallet and an output pays that key. The secret prompt is shown for
  // it alone — a typed secret is only ever used for such an input.
  const isHTLCClaim =
    isHTLCTx &&
    claimedInput !== undefined &&
    payloadOutputs.some(
      (output) => output?.destination === claimedInput?.utxo?.htlc?.spend_key,
    )

  const handleApprove = () => {
    if (approvalBlocked) return // fail closed: verified amounts only
    setSignError('')
    setIsModalOpen(true) // Open the modal
  }

  useEffect(() => {
    // Initialize transaction state from external state or mocks.
    // Mocks are dev-only: in production a direct visit with no route state
    // must bail to the "no pending request" state.
    const initialState =
      external_state || (isDevelopment ? MOCKS[selectedMock] : null)

    if (!transactionState && initialState) {
      setTransactionState(initialState)
    }
  }, [external_state, selectedMock, transactionState])

  useEffect(() => {
    // SECRET FOR HTLC
    // Check if this is a create HTLC transaction and if secret_hash needs to be filled in
    const currentState =
      transactionState ||
      external_state ||
      (isDevelopment ? MOCKS[selectedMock] : null)
    const transactionJSON =
      currentState?.request?.data?.txData?.JSONRepresentation

    // outputs may be a truthy non-array, or hold entries that are not
    // objects (the background forwards dApp params unvalidated) — a filter
    // that dereferenced them would crash the effect and unmount the page
    // into the ErrorBoundary before the blocked banner can render.
    if (!transactionJSON || !Array.isArray(transactionJSON.outputs)) {
      return
    }

    // Find HTLC outputs that need secret generation
    const htlcOutputsNeedingSecret = transactionJSON.outputs.filter(
      (output) => {
        return (
          output?.type === 'Htlc' &&
          output.htlc &&
          (!output.htlc.secret_hash ||
            !output.htlc.secret_hash.hex ||
            output.htlc.secret_hash.hex === null ||
            output.htlc.secret_hash.hex ===
              '0000000000000000000000000000000000000000')
        )
      },
    )

    // If we found HTLC outputs that need secrets, generate one
    if (htlcOutputsNeedingSecret.length > 0 && !generatedSecret) {
      try {
        const secretObj = Secret.generateSecretObject()
        setGeneratedSecret(secretObj.secretHex)
        setGeneratedSecretHash(secretObj.secretHashHex)

        // Create a deep copy of the current state to avoid mutation
        const updatedState = JSON.parse(JSON.stringify(currentState))
        const updatedTransactionJSON =
          updatedState.request.data.txData.JSONRepresentation

        // Find and update HTLC outputs in the copied state
        const updatedHtlcOutputs = updatedTransactionJSON.outputs.filter(
          (output) => {
            return (
              output?.type === 'Htlc' &&
              output.htlc &&
              (!output.htlc.secret_hash ||
                !output.htlc.secret_hash.hex ||
                output.htlc.secret_hash.hex === null ||
                output.htlc.secret_hash.hex ===
                  '0000000000000000000000000000000000000000')
            )
          },
        )

        // Update the transaction JSON to fill in the secret_hash
        updatedHtlcOutputs.forEach((output) => {
          if (output.htlc.secret_hash) {
            output.htlc.secret_hash.hex = secretObj.secretHashHex
            output.htlc.secret_hash.string = null // Keep string as null as per existing pattern
          } else {
            output.htlc.secret_hash = {
              hex: secretObj.secretHashHex,
              string: null,
            }
          }
        })

        // Update the transaction state to trigger re-render
        setTransactionState(updatedState)
      } catch (error) {
        console.error('Failed to generate secret for HTLC transaction:', error)
      }
    }
  }, [transactionState, external_state, selectedMock, generatedSecret])

  const handleModalSubmit = async ({ usePasskey = false } = {}) => {
    if (isSigning) return
    // Defense in depth: the approve button is already disabled, but the
    // modal submit must never reach the signer for a blocked request.
    if (approvalBlocked) return
    // Defense in depth: both approval paths (passkey and password) funnel
    // through this handler, and the buttons can be the only UI guard. A
    // dApp-supplied intent is opaque bytes — it must never be signed unless
    // the user explicitly acknowledged it.
    if (hasIntent && !intentAcknowledged) return

    // Validate secret if it's an HTLC claim transaction
    if (isHTLCClaim && secret && !Secret.validateSecretHex(secret.trim())) {
      setSecretError(
        'Invalid secret format. Please enter a valid 64-character hex string.',
      )
      return
    }

    setIsSigning(true)
    setSignError('')

    // Wrong-chain guard: the session records the network the site was
    // granted on. Fail CLOSED — a session without a recorded network is a
    // pre-upgrade grant and must reconnect before signing.
    const grantedNetwork = state?.request?.network
    if (!grantedNetwork || grantedNetwork !== networkType) {
      setIsSigning(false)
      sendPopupResponse({
        method: 'signTransaction_reject',
        requestId: state?.request?.requestId,
        origin: state?.request?.origin,
        error: {
          code: 'WRONG_NETWORK',
          message: grantedNetwork
            ? `Wrong network: this site was connected on '${grantedNetwork}' but the wallet is now on '${networkType}'. Switch the wallet network or reconnect the site.`
            : 'This site was connected before the wallet recorded its network. Reconnect the site and approve again.',
        },
      })
      return
    }

    try {
      // Everything that needs neither keys nor a secret runs first: whether
      // a wallet secret will be used at all and, if so, that every HTLC
      // input it would be placed into is the confirmed, unspent on-chain
      // HTLC output the request describes — and, for a typed secret, that
      // it hashes to that output's hash. A request refused here never
      // decrypts the wallet and never reaches the stored secret.
      const typedSecret = secret.trim()
      const { typedSecretUsed, storedSecretUsed } = resolveWalletSecretUse({
        claimedInputs,
        typedSecret,
        witnessInputGiven:
          state?.request?.data?.txData?.htlc?.witness_input !== undefined,
      })
      let claimSecretHash = null
      if (typedSecretUsed || storedSecretUsed) {
        const verifiedHashes = []
        for (const input of claimedInputs) {
          verifiedHashes.push(await verifyHtlcSpendInput({ input }))
        }
        claimSecretHash = verifiedHashes[0]
        // One secret is signed for every claimed input, so they must all
        // demand it.
        if (verifiedHashes.some((hash) => hash !== claimSecretHash)) {
          throw htlcSpendRefusal(
            'The HTLC inputs being claimed are locked to different secret hashes.',
          )
        }
        if (
          typedSecretUsed &&
          htlcSecretHashHex(typedSecret) !== claimSecretHash
        ) {
          throw htlcSpendRefusal(
            'The secret does not match the hash of the HTLC being claimed.',
          )
        }
      }

      const transactionJSONrepresentation =
        state?.request?.data?.txData?.JSONRepresentation

      const transactionBINrepresentation =
        SignTxHelpers.getTransactionBINrepresentation(
          transactionJSONrepresentation,
          network,
          blockHeight,
        )

      const pass = usePasskey
        ? await Account.getPasswordWithPasskey(accountID)
        : password

      const unlockedAccount = usePasskey
        ? await Account.unlockAccount(accountID, pass, { wallets: ['ml'] })
        : await Account.unlockAccount(accountID, password, {
            wallets: ['ml'],
          })

      const mlPrivKeys = unlockedAccount.mlPrivKeys

      const privKey =
        networkType === 'mainnet'
          ? mlPrivKeys.mlMainnetPrivateKey
          : mlPrivKeys.mlTestnetPrivateKey

      const walletPrivKeys = ML.getWalletPrivKeysList(privKey, networkType, [
        ...currentMlAddresses.mlReceivingAddresses,
        ...currentMlAddresses.mlChangeAddresses,
      ])

      const keysList = {
        ...walletPrivKeys.mlReceivingPrivKeys,
        ...walletPrivKeys.mlChangePrivKeys,
      }

      let intentEncode

      if (state?.request?.data?.txData?.intent) {
        const intent = state?.request?.data?.txData?.intent
        intentEncode = SignTxHelpers.getTransactionIntent({
          intent,
          transactionBINrepresentation,
          transactionJSONrepresentation,
          addressesPrivateKeys: keysList,
        })
      }

      // The stored secret is looked up by the hash the ON-CHAIN output
      // carries — never by a value the request supplies — and must hash to
      // it before anything is built or signed with it.
      const secretPresaved = storedSecretUsed
        ? await Account.unlockHtlsSecret({
            accountId: accountID,
            password: pass,
            hash: claimSecretHash,
          })
        : null

      const secret_ = secretPresaved || typedSecret

      if (
        secret_ &&
        claimSecretHash !== null &&
        htlcSecretHashHex(secret_) !== claimSecretHash
      ) {
        throw htlcSpendRefusal(
          'The secret does not match the hash of the HTLC being claimed.',
        )
      }

      const order_info = {}

      // if fill order then check for order id and fetch data
      if (
        transactionJSONrepresentation.inputs.find((input) =>
          ['FillOrder', 'ConcludeOrder'].includes(input.input.command),
        )
      ) {
        const order_id = transactionJSONrepresentation.inputs.find((input) =>
          ['FillOrder', 'ConcludeOrder'].includes(input.input.command),
        ).input.order_id
        const orderdata = JSON.parse(await Mintlayer.getOrderById(order_id))

        order_info[order_id] = {
          initially_asked: {
            ...(orderdata.ask_currency.type === 'Coin'
              ? {
                  coins: {
                    atoms: orderdata.initially_asked.atoms,
                  },
                }
              : {
                  tokens: {
                    token_id: orderdata.ask_currency.token_id,
                    amount: {
                      atoms: orderdata.initially_asked.atoms,
                    },
                  },
                }),
          },
          initially_given: {
            ...(orderdata.give_currency.type === 'Coin'
              ? {
                  coins: {
                    atoms: orderdata.initially_given.atoms,
                  },
                }
              : {
                  tokens: {
                    token_id: orderdata.give_currency.token_id,
                    amount: {
                      atoms: orderdata.initially_given.atoms,
                    },
                  },
                }),
          },
          ask_balance: {
            atoms: orderdata.ask_balance.atoms,
          },
          give_balance: {
            atoms: orderdata.give_balance.atoms,
          },
        }
      }

      const transactionHex = SignTxHelpers.getTransactionHEX(
        {
          transactionBINrepresentation,
          transactionJSONrepresentation,
          addressesPrivateKeys: keysList,
          ...(state?.request?.data?.txData?.htlc?.witness_input && {
            htlc: {
              witness_input: state?.request?.data?.txData?.htlc?.witness_input,
              multisig_challenge:
                state?.request?.data?.txData?.htlc?.multisig_challenge,
            },
          }),
          secret: secret_
            ? new Uint8Array(Buffer.from(secret_, 'hex'))
            : undefined,
        },
        network,
        blockHeight,
        {
          pool_info: {},
          order_info,
        },
      )

      if (isHTLCCreateTx) {
        // save secret to account
        await Account.saveProvidedHtlsSecret({
          accountId: accountID,
          password: pass,
          data: {
            secret: generatedSecret,
            hash: generatedSecretHash,
            txHash: transactionHex,
          },
        })
      }

      const requestId = state?.request?.requestId
      const method = 'signTransaction_approve'
      let result
      if (intentEncode) {
        result = {
          transactionHex,
          intentEncode,
        }
      } else {
        result = transactionHex
      }

      sendPopupResponse({
        method,
        requestId,
        origin,
        result,
      })

      // Signing done: drop the password/secret from memory. The page stays
      // mounted in the side panel — do not leave signing material in the
      // React tree after the response has been returned.
      setPassword('')
      setSecret('')
      setIntentAcknowledged(false)
    } catch (error) {
      console.error('Error during transaction signing:', error)
      setSignError(
        error?.message || 'Signing failed. Check your password and try again.',
      )
      setIsSigning(false)
    }
  }

  const handleReject = () => {
    setPassword('')
    setSecret('')
    setIntentAcknowledged(false)
    sendPopupResponse({
      method: 'signTransaction_reject',
      requestId: state?.request?.requestId,
      origin,
      error: 'Transaction rejected',
    })
  }

  const selectMock = (name) => {
    setSelectedMock(name)
    // Reset transaction state when switching mocks to trigger re-initialization
    setTransactionState(null)
    // Reset generated secret state when switching mocks
    setGeneratedSecret(null)
    setGeneratedSecretHash(null)
  }

  const passwordChangeHandler = (value) => {
    setPassword(value)
  }

  const secretChangeHandler = (value) => {
    setSecret(value)

    // Validate secret format if value is provided
    if (value && value.trim()) {
      if (Secret.validateSecretHex(value.trim())) {
        setSecretError('')
      } else {
        setSecretError(
          'Invalid secret format. Must be 64 hex characters (32 bytes).',
        )
      }
    } else {
      setSecretError('')
    }
  }

  return (
    <PageWrapper>
      <div className="SignTransaction">
        <div className="header">
          <h1 className="signTxTitle">Sign transaction</h1>
        </div>

        <div className="requestOrigin">
          <SiteBadge
            origin={origin || 'Unknown Website'}
            unknown={!origin}
          />
        </div>

        <div className="SignTxContent">
          {!external_state && isDevelopment && (
            <div className="mock_selector">
              {Object.keys(MOCKS).map((key) => {
                return (
                  <div
                    key={key}
                    onClick={() => selectMock(key)}
                    title={key}
                    className={selectedMock === key ? 'active' : ''}
                  >
                    {key}
                  </div>
                )
              })}
            </div>
          )}

          {state?.request?.data?.txData?.JSONRepresentation && (
            <SignTransaction.TransactionSummary
              jsonRepresentation={state.request.data.txData.JSONRepresentation}
              intent={state.request.data.txData.intent}
              ownAddresses={{
                receiving: currentMlAddresses.mlReceivingAddresses,
                change: currentMlAddresses.mlChangeAddresses,
              }}
              technicalDetails={
                <SignTransaction.ExternalTransactionPreview data={state} />
              }
              rawJsonNode={<SignTransaction.JsonPreview data={state} />}
            />
          )}

          {!state?.request?.data?.txData?.JSONRepresentation && (
            <ErrorBanner error="No pending sign request." />
          )}

          {approvalBlocked && (
            <ErrorBanner error="Amount verification failed: the site-reported amounts do not match what this transaction would sign. For your safety, this request cannot be approved." />
          )}

          {/* HTLC Secret Information */}
          {isHTLCCreateTx && generatedSecret && (
            <div className="htlc-secret-section">
              <h3>HTLC Secret Generated</h3>
              <div className="secret-info">
                <div className="secret-item">
                  <label>Secret (Hex):</label>
                  <div className="secret-value">
                    <span>{generatedSecret}</span>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(generatedSecret)
                      }
                      title="Copy secret"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="secret-item">
                  <label>Secret Hash (Hex):</label>
                  <div className="secret-value">
                    <span>{generatedSecretHash}</span>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(generatedSecretHash)
                      }
                      title="Copy secret hash"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="secret-actions">
                  {/* TODO: Add "Save Secret" button functionality here */}
                  <p>
                    <em>
                      💡 Save this secret - you&apos;ll need it to claim the
                      HTLC later!
                    </em>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="footer">
          <Button
            onClickHandle={handleReject}
            extraStyleClasses={extraButtonStyles}
            alternate
          >
            Decline
          </Button>
          <Button
            onClickHandle={handleApprove}
            extraStyleClasses={extraButtonStyles}
            disabled={
              !state?.request?.data?.txData?.JSONRepresentation ||
              approvalBlocked
            }
          >
            Approve and return to page
          </Button>
        </div>

        {isModalOpen && (
          <PopUp setOpen={setIsModalOpen}>
            <div className="modal-content">
              {hasPasskey && !usePasswordEntry ? (
                <>
                  <Button
                    onClickHandle={() =>
                      handleModalSubmit({ usePasskey: true })
                    }
                    extraStyleClasses={extraButtonStyles}
                    disabled={isSigning || (hasIntent && !intentAcknowledged)}
                  >
                    Confirm with passkey
                  </Button>
                  <Button
                    onClickHandle={() => setPasswordEntry(true)}
                    extraStyleClasses={extraButtonStyles}
                    alternate
                  >
                    Use password instead
                  </Button>
                  {isHTLCClaim && (
                    <>
                      <div className="htlc-secret-input">
                        <label>HTLC Secret:</label>
                        <TextField
                          value={secret}
                          onChangeHandle={secretChangeHandler}
                          placeholder="Enter htlc secret in hex format (64 characters)"
                          autoFocus
                        />
                        {secretError && (
                          <div className="secret-error">{secretError}</div>
                        )}
                      </div>
                    </>
                  )}
                  {hasIntent && (
                    <label className="intent-ack">
                      <input
                        type="checkbox"
                        checked={intentAcknowledged}
                        onChange={(e) =>
                          setIntentAcknowledged(e.target.checked)
                        }
                      />
                      <span>
                        I reviewed the attached intent data above and approve
                        signing it.
                      </span>
                    </label>
                  )}
                  {signError && <div className="sign-error">{signError}</div>}
                </>
              ) : (
                <>
                  <TextField
                    label="Re-enter your Password"
                    password
                    value={password}
                    onChangeHandle={passwordChangeHandler}
                    placeHolder="Enter your password"
                    autoFocus
                  />
                  {isHTLCClaim && (
                    <>
                      <div className="htlc-secret-input">
                        <label>HTLC Secret:</label>
                        <TextField
                          value={secret}
                          onChangeHandle={secretChangeHandler}
                          placeholder="Enter htlc secret in hex format (64 characters)"
                          autoFocus
                        />
                        {secretError && (
                          <div className="secret-error">{secretError}</div>
                        )}
                      </div>
                    </>
                  )}
                  {hasIntent && (
                    <label className="intent-ack">
                      <input
                        type="checkbox"
                        checked={intentAcknowledged}
                        onChange={(e) =>
                          setIntentAcknowledged(e.target.checked)
                        }
                      />
                      <span>
                        I reviewed the attached intent data above and approve
                        signing it.
                      </span>
                    </label>
                  )}
                  {signError && <div className="sign-error">{signError}</div>}
                  <div className="modal-buttons">
                    <Button
                      onClickHandle={() => {
                        setPassword('')
                        setSecret('')
                        setIntentAcknowledged(false)
                        setIsModalOpen(false)
                      }}
                      extraStyleClasses={extraButtonStyles}
                      alternate
                    >
                      Cancel
                    </Button>
                    <Button
                      onClickHandle={() => handleModalSubmit()}
                      extraStyleClasses={extraButtonStyles}
                      disabled={
                        isSigning ||
                        !password ||
                        (hasIntent && !intentAcknowledged)
                      }
                    >
                      {isSigning ? 'Signing…' : 'Approve'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </PopUp>
        )}
      </div>
    </PageWrapper>
  )
}

export default SignTransactionPage
