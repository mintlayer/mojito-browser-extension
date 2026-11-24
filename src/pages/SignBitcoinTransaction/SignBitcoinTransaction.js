import { useLocation } from 'react-router'
import { MOCKS } from './mocks'
import {
  Button,
  Error as ErrorBanner,
  PageWrapper,
  SiteBadge,
} from '@BasicComponents'
import { PopUp, TextField } from '@ComposedComponents'
import { SignTransaction } from '@ContainerComponents'

import './SignBitcoinTransaction.css'
import { useState, useContext, useMemo, useEffect } from 'react'
import { Account } from '@Entities'
import { AccountContext, BitcoinContext, SettingsContext } from '@Contexts'
import { BTCTransaction, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { BTC as BTCHelpers, Secret } from '@Helpers'
import { Electrum } from '@APIs'
import { sendPopupResponse } from '@Browser'

import {
  BTC_REQUEST_KIND,
  buildBtcSignRecap,
  classifyBtcSignRequest,
  parseSatoshiAmount,
} from './recap'

const isDevelopment = process.env.NODE_ENV === 'development'

// sat/vB used when the fee service is unreachable
const FALLBACK_BTC_FEE_RATE = 10

const getBtcFeeRate = async () => {
  try {
    const estimates = JSON.parse(await Electrum.getFeesEstimates())
    return (
      Math.ceil(BTCHelpers.parseFeesEstimates(estimates).MEDIUM) ||
      FALLBACK_BTC_FEE_RATE
    )
  } catch (error) {
    console.error('Fee estimates unavailable, using fallback rate:', error)
    return FALLBACK_BTC_FEE_RATE
  }
}

// hash160 (RIPEMD160 over SHA256) of a hex secret — the hash the wallet
// locks into an HTLC when it creates one (Secret.generateSecretHash).
const secretHashHexOf = (secretHex) =>
  Buffer.from(
    Secret.generateSecretHash(Secret.hexToSecret(secretHex)),
  ).toString('hex')

// The hash a claim request carries next to its utxo, if any: a JSON
// string or an object holding secret_hash_hex. null when the request
// carries none; undefined when it carries one that cannot be read.
const readRequestedSecretHash = (secretHash) => {
  if (secretHash == null) return null
  let container = secretHash
  if (typeof secretHash === 'string') {
    try {
      container = JSON.parse(secretHash)
    } catch {
      return undefined
    }
  }
  const hex = container?.secret_hash_hex
  return typeof hex === 'string' ? hex.toLowerCase() : undefined
}

// A refusal to sign an HTLC request the wallet cannot verify. Carries no
// secret: the message only ever describes what failed.
const htlcRefusal = (code, message) =>
  Object.assign(new Error(message), { code })

export const SignBitcoinTransactionPage = () => {
  const { state: external_state } = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [secret, setSecret] = useState('')

  // Secret management state for HTLC transactions
  const [secretError, setSecretError] = useState('')

  const [selectedMock, setSelectedMock] = useState('createHtlc')
  const extraButtonStyles = ['buttonSignTransaction']

  const [isSigning, setIsSigning] = useState(false)
  const [signError, setSignError] = useState('')

  const initialState =
    external_state || (isDevelopment ? MOCKS[selectedMock] : null)

  // Generate secret and prepare transaction state once for HTLC create transactions
  const { generatedSecret, generatedSecretHash, htlcTransactionState } =
    useMemo(() => {
      const currentState = initialState
      const transactionJSON =
        currentState?.request?.data?.txData?.JSONRepresentation
      const isCreate =
        classifyBtcSignRequest(transactionJSON) === BTC_REQUEST_KIND.CREATE

      if (!isCreate) {
        return {
          generatedSecret: null,
          generatedSecretHash: null,
          htlcTransactionState: null,
        }
      }

      try {
        const secretObj = Secret.generateSecretObject()
        const updatedState = JSON.parse(JSON.stringify(currentState))
        const updatedTransactionJSON =
          updatedState.request.data.txData.JSONRepresentation

        if (updatedTransactionJSON.secretHash) {
          updatedTransactionJSON.secretHash = JSON.stringify({
            secret_hash_hex: secretObj.secretHashHex,
          })
        }

        return {
          generatedSecret: secretObj.secretHex,
          generatedSecretHash: secretObj.secretHashHex,
          htlcTransactionState: updatedState,
        }
      } catch (error) {
        console.error('Error generating secret:', error)
        return {
          generatedSecret: null,
          generatedSecretHash: null,
          htlcTransactionState: null,
        }
      }
    }, [initialState])

  const state = htlcTransactionState || initialState
  // Browser-stamped, but rendered as text: only a string is shown.
  const rawOrigin = state?.request?.origin
  const origin = typeof rawOrigin === 'string' ? rawOrigin : undefined

  // dApp-supplied: only a string is the revealed secret. Any other type
  // reads as none, both for the manual-secret prompt below and at signing
  // time (a non-string would otherwise hide the prompt and reach the
  // signer as the secret).
  const rawSecret = state?.request?.data?.txData?.JSONRepresentation?.secret
  const revealed_secret = typeof rawSecret === 'string' ? rawSecret : ''

  const { addresses, accountID } = useContext(AccountContext)
  const { btcUtxos, unusedAddresses: unusedBtcAddresses } =
    useContext(BitcoinContext)
  const { networkType } = useContext(SettingsContext)

  // Pre-computed, password-free facts for the HTLC create recap: the escrow
  // address (from the dApp's script params) and the fee estimate (from the
  // fee service + the wallet's UTXO set). Whatever this effect computes is
  // exactly what signing later uses — the displayed fee can't drift from
  // the charged one.
  const [escrowFeeInfo, setEscrowFeeInfo] = useState(null)
  // Owner-stamped once the escrow pre-computation of a create request has
  // run and could not build the escrow address; null while it is pending
  // and when it succeeded.
  const [escrowUnbuildable, setEscrowUnbuildable] = useState(null)
  const requestJSON = state?.request?.data?.txData?.JSONRepresentation
  // The request's kind, from the one classifier: the recap is built by it
  // (below) and the submit handler signs by it, so what the user approves
  // is what gets signed.
  const requestKind = classifyBtcSignRequest(requestJSON)
  const isCreateRequest = requestKind === BTC_REQUEST_KIND.CREATE

  // The refund key of a create request must be a key of this wallet and
  // both keys valid public keys, or the request is neither shown as
  // approvable nor signed. One verdict, shared with the signer, computed
  // from the public keys of the wallet's addresses as the account context
  // carries them (the ones the connect page shares with a dApp). The
  // verdict never throws; a value it cannot read is an invalid key.
  const createKeys = useMemo(() => {
    if (!isCreateRequest) return null
    return BTCTransaction.verifyHtlcCreateKeys({
      refundPublicKey: requestJSON?.refundPublicKey,
      recipientPublicKey: requestJSON?.recipientPublicKey,
      btcAddressData: addresses?.btcAddresses,
    })
  }, [isCreateRequest, requestJSON, addresses])

  useEffect(() => {
    let active = true
    // Never an escrow address from keys that failed the verdict: the
    // request is blocked, and the script is not built from them at all.
    if (!isCreateRequest || !requestJSON || !createKeys?.ok) return undefined
    ;(async () => {
      try {
        const htlc = await BTCTransaction.buildHTLCAndFundingAddress({
          receiverPubKey: requestJSON.recipientPublicKey,
          senderPubKey: requestJSON.refundPublicKey,
          lock: requestJSON.timeoutBlocks,
          secretHashHex: JSON.parse(requestJSON.secretHash).secret_hash_hex,
          networkType,
        })
        const feeRate = await getBtcFeeRate()
        let estimatedFee = null
        let fundingWalletType = BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT
        try {
          const currentAccount = await Account.getAccount(accountID)
          fundingWalletType =
            currentAccount?.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT
          estimatedFee = await BTCTransaction.calculateBtcTransactionFee({
            to: htlc.p2wshAddress,
            amount: parseSatoshiAmount(requestJSON.amount),
            utxos: btcUtxos || [],
            feeRate,
            walletType: fundingWalletType,
          })
        } catch {
          estimatedFee = null
        }
        if (active) {
          setEscrowFeeInfo({
            // Owner stamp: this frozen record is only ever valid for the
            // request whose fields it was quoted from (see below).
            owner: requestJSON,
            htlc,
            feeRate,
            estimatedFee,
            // Funding snapshot: the exact UTXO set, fee rate and address type
            // this estimate was quoted from. Signing rebuilds from this frozen
            // record so the charged fee cannot drift from the displayed one.
            fundingUtxos: btcUtxos || [],
            fundingWalletType,
          })
          setEscrowUnbuildable(null)
        }
      } catch {
        // Malformed request data: the recap falls back to warnings, the
        // page states that the escrow address could not be built and blocks
        // approval, and signing would fail with the same error.
        if (active) {
          setEscrowFeeInfo(null)
          setEscrowUnbuildable({ owner: requestJSON })
        }
      }
    })()
    return () => {
      active = false
    }
  }, [
    isCreateRequest,
    requestJSON,
    btcUtxos,
    accountID,
    networkType,
    createKeys,
  ])

  // A second sign request can navigate into this already-mounted route
  // (same path, no remount), so escrowFeeInfo may still hold the previous
  // request's frozen record while this request's recompute is pending. The
  // record is only valid for the request it was quoted from — the recap and
  // the sign path treat a foreign record as absent, so request A's escrow
  // address/fee/funding snapshot can never leak into request B. Reruns for
  // the SAME request (UTXO poll refresh) keep the current record visible.
  const activeEscrowFeeInfo =
    escrowFeeInfo?.owner === requestJSON ? escrowFeeInfo : null
  // Same ownership rule for a failed pre-computation: only the request it
  // ran for may be blocked by it, and only once it has settled.
  const escrowFailed =
    isCreateRequest && escrowUnbuildable?.owner === requestJSON

  // Human-readable approval summary — parsed facts, not raw JSON. A value
  // the signer needs but cannot read blocks approval (fail closed).
  const recap = buildBtcSignRecap({
    json: requestJSON,
    networkType,
    escrowFeeInfo: activeEscrowFeeInfo,
    escrowFailed,
    createKeys,
  })
  const approvalBlocked = Boolean(recap?.blockedReason)
  const blockedReason = recap?.blockedReason ?? null

  // Transaction types, from the same classifier as the recap
  const isHTLCCreateTx = requestKind === BTC_REQUEST_KIND.CREATE
  const isHTLCSpendTx = requestKind === BTC_REQUEST_KIND.SPEND

  // HTLC claim/refund proceeds must land in OUR wallet: the claim pays the
  // swap output to the claimer, the refund returns to the funder. A dApp
  // may not redirect them elsewhere.
  const resolveHtlcDestination = (requestedTo, btcAddressData) => {
    const walletAddresses = new Set([
      ...(btcAddressData?.btcReceivingAddresses ?? []).map((a) => a.address),
      ...(btcAddressData?.btcChangeAddresses ?? []).map((a) => a.address),
    ])
    if (requestedTo) {
      if (!walletAddresses.has(requestedTo)) {
        throw Object.assign(
          new Error(
            'HTLC destination must be one of your own wallet addresses.',
          ),
          { code: 'RECIPIENT_NOT_WALLET' },
        )
      }
      return requestedTo
    }
    const fallback =
      unusedBtcAddresses?.receivingAddress ||
      btcAddressData?.btcReceivingAddresses?.[0]?.address
    if (!fallback) throw new Error('Missing HTLC destination address')
    return fallback
  }

  // Signs only with the wallet key ONE branch of the redeem script binds:
  // a claim with the spend-branch key (the one checked against the secret
  // hash), a refund with the refund-branch key (the one behind the
  // timelock). A wallet key that sits only on the other branch is refused.
  const requireWalletKeyFor = (branch, redeemScriptHex, btcPrivateKeys) => {
    const keyInfo = BTCTransaction.findWalletKeyForRedeemScript({
      redeemScriptHex,
      btcAddressData: btcPrivateKeys.btcAddressData,
      btcHDWallet: btcPrivateKeys.btcHDWallet,
      branch,
    })
    if (!keyInfo) {
      throw htlcRefusal(
        'HTLC_SCRIPT_NOT_OURS',
        branch === 'spend'
          ? 'This HTLC does not pay its spend branch to a key from this wallet, so this wallet cannot claim it.'
          : 'This HTLC does not pay its refund branch to a key from this wallet, so this wallet cannot refund it.',
      )
    }
    return keyInfo
  }

  // The HTLC as its redeem script describes it. The script is the only
  // source of the hash a stored secret may be looked up by and of the key
  // each branch pays; a request whose script is not this shape is refused.
  const requireParsedHtlc = (redeemScriptHex) => {
    const htlc = BTCTransaction.parseHtlcRedeemScript(redeemScriptHex)
    if (!htlc) {
      throw htlcRefusal(
        'HTLC_SCRIPT_INVALID',
        'The HTLC script is not a valid HTLC script.',
      )
    }
    return htlc
  }

  // A hash the request carries next to the utxo must be the script's own.
  const requireRequestedHashMatches = (requestedHash, htlc) => {
    if (requestedHash !== null && requestedHash !== htlc.secretHashHex) {
      throw htlcRefusal(
        'HTLC_SECRET_HASH_MISMATCH',
        'The secret hash in the request does not match the hash in the HTLC script.',
      )
    }
  }

  // The output being spent must exist on chain exactly as described. Fail
  // closed: a lookup that cannot be completed refuses as well.
  const requireVerifiedOutpoint = (utxo, redeemScriptHex) =>
    BTCTransaction.verifyHtlcOutpoint({
      networkType,
      utxo,
      redeemScriptHex,
    })

  // The secret — stored or typed — must hash to the HTLC's hash before
  // anything is built or signed with it.
  const requireSecretMatchesHash = (secretHex, htlc) => {
    if (!secretHex) {
      throw htlcRefusal(
        'HTLC_SECRET_MISSING',
        'The secret is required to claim this HTLC.',
      )
    }
    if (secretHashHexOf(secretHex) !== htlc.secretHashHex) {
      throw htlcRefusal(
        'HTLC_SECRET_MISMATCH',
        'The secret does not match the hash in the HTLC script.',
      )
    }
  }

  const handleApprove = () => {
    setSignError('')
    setIsModalOpen(true) // Open the modal
  }

  const submitCreate = async () => {
    // Fail-closed network guard (same contract as ML signing): a session
    // without a recorded network must reconnect before signing.
    const grantedNetwork = state?.request?.network
    if (!grantedNetwork || grantedNetwork !== networkType) {
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

    const pass = password

    const transactionJSONrepresentation =
      state?.request?.data?.txData?.JSONRepresentation

    // The approval's own verdict on the two keys, re-run before anything
    // is built or the wallet is unlocked (it needs public keys only): the
    // escrow's refund branch must pay a key of this wallet, and both keys
    // must be valid public keys.
    const createKeys = BTCTransaction.verifyHtlcCreateKeys({
      refundPublicKey: transactionJSONrepresentation?.refundPublicKey,
      recipientPublicKey: transactionJSONrepresentation?.recipientPublicKey,
      btcAddressData: addresses?.btcAddresses,
    })
    if (!createKeys.ok) {
      throw htlcRefusal(createKeys.code, createKeys.message)
    }

    // buildHTLCAndFundingAddress builds the HTLC script only — it never
    // used a WIF (the old code destructured a phantom `{ WIF }` from
    // unlockAccount, which always came back undefined and threw later).
    const htlc = await BTCTransaction.buildHTLCAndFundingAddress({
      receiverPubKey: transactionJSONrepresentation.recipientPublicKey,
      senderPubKey: transactionJSONrepresentation.refundPublicKey,
      senderAddress: transactionJSONrepresentation.refund,
      amount: transactionJSONrepresentation.amount, // atoms!!
      // lock: transactionJSONrepresentation.lock,
      lock: transactionJSONrepresentation.timeoutBlocks,
      secretHashHex: JSON.parse(transactionJSONrepresentation.secretHash)
        .secret_hash_hex,
      networkType,
    })

    // address to send funds to
    const address = htlc.p2wshAddress

    // Fund the HTLC from the frozen approval snapshot — the same UTXO set,
    // fee rate and address type the recap's estimate was quoted from. The
    // live context UTXO list is only a fallback for the corner case where
    // the recap pre-computation never ran (no displayed fee to diverge from);
    // building from it on the happy path would silently sign a different
    // transaction than the one approved (same invariant class as the
    // ConfirmBtcTransaction transfer flow).
    const currentAccount = await Account.getAccount(accountID)
    const resolvedWalletType =
      currentAccount.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT
    const feeRate = activeEscrowFeeInfo?.feeRate ?? (await getBtcFeeRate())
    const fundingUtxos = activeEscrowFeeInfo?.fundingUtxos ?? (btcUtxos || [])
    const fundingWalletType =
      activeEscrowFeeInfo?.fundingWalletType ?? resolvedWalletType

    const { btcPrivateKeys } = await Account.unlockAccount(accountID, pass, {
      wallets: ['btc'],
    })

    const getChangeAddress = () => {
      const candidate =
        unusedBtcAddresses?.changeAddress ||
        addresses?.btcAddresses?.btcChangeAddresses?.[0]

      if (typeof candidate === 'string') return candidate
      if (typeof candidate?.address === 'string') return candidate.address
      if (typeof candidate === 'object') {
        const key = Object.keys(candidate)[0]
        if (typeof key === 'string') return key
      }
      throw new Error('Missing BTC change address')
    }

    // Strict integer parse: no silent truncation between the approved
    // recap and the signed transaction.
    const amountSatoshis = parseSatoshiAmount(
      transactionJSONrepresentation.amount,
    )

    const [tx, txHex] = await BTCTransaction.buildTransaction({
      to: address,
      amount: amountSatoshis, // satoshis
      utxos: fundingUtxos,
      feeRate,
      walletType: fundingWalletType,
      changeAddress: getChangeAddress(),
      root: btcPrivateKeys,
    })
    const txId = tx?.getId()

    const requestId = state?.request?.requestId
    const method = 'signTransaction_approve'
    const result = {
      htlcAddress: htlc.p2wshAddress,
      secretHashHex: JSON.parse(transactionJSONrepresentation.secretHash)
        .secret_hash_hex,
      transactionId: txId,
      signedTxHex: txHex,
      redeemScript: htlc.redeemScriptHex,
    }

    // Save generated secret to account if this is an HTLC create transaction
    if (isHTLCCreateTx && generatedSecret && generatedSecretHash) {
      try {
        await Account.saveProvidedHtlsSecret({
          accountId: accountID,
          password: pass,
          data: {
            secret: generatedSecret,
            hash: generatedSecretHash,
            txHash: txHex,
          },
        })
      } catch (error) {
        console.error('Error saving secret:', error)
        // Continue with transaction even if secret saving fails
      }
    }

    sendPopupResponse({
      method,
      requestId,
      origin,
      result,
    })
  }

  const submitSpend = async () => {
    const pass = password

    // Fail-closed network guard (same contract as ML signing).
    const grantedNetwork = state?.request?.network
    if (!grantedNetwork || grantedNetwork !== networkType) {
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

    const transactionJSONrepresentation =
      state?.request?.data?.txData?.JSONRepresentation
    const { utxo, redeemScriptHex } = transactionJSONrepresentation

    // Everything that needs no key material runs first: the script's
    // shape, the hash the request carries, and the output on chain. A
    // request that fails here never reaches the stored secret.
    const htlc = requireParsedHtlc(redeemScriptHex)
    requireRequestedHashMatches(readRequestedSecretHash(utxo?.secretHash), htlc)
    await requireVerifiedOutpoint(utxo, redeemScriptHex)

    const { btcPrivateKeys } = await Account.unlockAccount(accountID, pass, {
      wallets: ['btc'],
    })

    // Sign ONLY with the wallet key the SPEND branch binds; a wallet key
    // that sits only on the refund branch is refused.
    const keyInfo = requireWalletKeyFor(
      'spend',
      redeemScriptHex,
      btcPrivateKeys,
    )
    const toAddress = resolveHtlcDestination(
      transactionJSONrepresentation.to,
      btcPrivateKeys.btcAddressData,
    )

    // The stored secret is looked up by the hash the SCRIPT carries —
    // never by a value the request supplies.
    let secretPresaved = null
    try {
      secretPresaved = await Account.unlockHtlsSecret({
        accountId: accountID,
        password: pass,
        hash: htlc.secretHashHex,
      })
    } catch {
      // No saved secret for this hash — the user is prompted for manual
      // input, so this fallback is expected and stays silent.
    }

    // A typed secret is taken trimmed: a trailing newline would otherwise
    // stop the hex decode early and read as a hash mismatch.
    const finalSecret = secretPresaved || revealed_secret || secret.trim()
    requireSecretMatchesHash(finalSecret, htlc)

    // The builders pin the PSBT to bitcoin.networks[networkType]: pass the
    // validated string networkType (guarded above), never the Mintlayer
    // Network enum — an enum number silently falls back to the 'testnet'
    // default and mainnet signing fails on the mainnet destination address.
    const tx = await BTCTransaction.buildHtlcClaimTx({
      networkType,
      utxo,
      toAddress,
      redeemScriptHex,
      secretHex: finalSecret,
      wif: keyInfo.wif,
    })

    const requestId = state?.request?.requestId
    const method = 'signTransaction_approve'
    const result = {
      signedTxHex: tx,
    }
    sendPopupResponse({
      method,
      requestId,
      origin,
      result,
    })
  }

  const submitRefund = async () => {
    const pass = password

    // Fail-closed network guard (same contract as ML signing).
    const grantedNetwork = state?.request?.network
    if (!grantedNetwork || grantedNetwork !== networkType) {
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

    const transactionJSONrepresentation =
      state?.request?.data?.txData?.JSONRepresentation
    const { utxo, redeemScriptHex } = transactionJSONrepresentation

    // No secret is involved, but the output must be the HTLC output the
    // request describes before any key material is used for it.
    requireParsedHtlc(redeemScriptHex)
    await requireVerifiedOutpoint(utxo, redeemScriptHex)

    const { btcPrivateKeys } = await Account.unlockAccount(accountID, pass, {
      wallets: ['btc'],
    })

    // Sign ONLY with the wallet key the REFUND branch (behind the timelock)
    // binds; a wallet key that sits only on the spend branch is refused.
    const keyInfo = requireWalletKeyFor(
      'refund',
      redeemScriptHex,
      btcPrivateKeys,
    )
    const toAddress = resolveHtlcDestination(
      transactionJSONrepresentation.to,
      btcPrivateKeys.btcAddressData,
    )

    // Same networkType contract as the claim builder above: the validated
    // string, not the Mintlayer Network enum.
    const tx = await BTCTransaction.buildHtlcRefundTx({
      networkType,
      utxo,
      toAddress,
      redeemScriptHex,
      wif: keyInfo.wif,
    })

    const requestId = state?.request?.requestId
    const method = 'signTransaction_approve'
    const result = {
      signedTxHex: tx,
    }

    sendPopupResponse({
      method,
      requestId,
      origin,
      result,
    })
  }

  const handleModalSubmit = async () => {
    if (isSigning) return
    // Defense in depth: both Approve buttons are already disabled, but the
    // modal submit must never reach the signer for a blocked request.
    if (approvalBlocked) return

    try {
      // Validate secret if it's an HTLC spend transaction and secret is manually entered
      if (isHTLCSpendTx && secret && !Secret.validateSecretHex(secret.trim())) {
        setSecretError(
          'Invalid secret format. Please enter a valid 64-character hex string.',
        )
        return
      }

      setIsSigning(true)
      setSignError('')

      // Signed by the same classifier the recap was shown by. An
      // unrecognised or ambiguous payload is never signed (it is blocked
      // above, and there is no path to a signer for it here either).
      switch (requestKind) {
        case BTC_REQUEST_KIND.REFUND:
          await submitRefund()
          break
        case BTC_REQUEST_KIND.CREATE:
          await submitCreate()
          break
        case BTC_REQUEST_KIND.SPEND:
          await submitSpend()
          break
        default:
          setIsSigning(false)
          return
      }
      // Signing done: drop the password/secret from memory — the page stays
      // mounted in the side panel after the response is returned. Skipped on
      // a throw so the open modal keeps its material for the retry.
      setPassword('')
      setSecret('')
    } catch (error) {
      console.error('Error during transaction signing:', error)
      // Keep the modal open without a message only for explicitly typed
      // secret-validation failures; surface everything else.
      const isSecretValidationError = error?.code === 'INVALID_SECRET'
      if (!isSecretValidationError) {
        setSignError(
          error?.message ||
            'Signing failed. Check your password and try again.',
        )
      }
      setIsSigning(false)
    }
  }

  const handleReject = () => {
    // Drop signing material as soon as the request is over.
    setPassword('')
    setSecret('')
    sendPopupResponse({
      method: 'signTransaction_reject',
      requestId: state?.request?.requestId,
      origin,
      error: 'Transaction rejected',
    })
  }

  const selectMock = (name) => {
    setSelectedMock(name)
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
          <h1 className="signTxTitle">Sign Transaction</h1>
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
            <div className="transaction-preview-wrapper">
              {recap && (
                <div
                  className="btc-recap"
                  data-testid="btc-sign-recap"
                >
                  <h3>{recap.title}</h3>
                  <dl>
                    {recap.rows.map((r) => (
                      <div
                        className="btc-recap-row"
                        key={r.label}
                      >
                        <dt>{r.label}</dt>
                        <dd
                          className={`${r.mono ? 'mono' : ''} ${
                            r.warn ? 'warn' : ''
                          }`}
                        >
                          {r.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {recap.warning && (
                    <p className="btc-recap-warning">⚠️ {recap.warning}</p>
                  )}
                </div>
              )}
              {approvalBlocked && <ErrorBanner error={blockedReason} />}
              <SignTransaction.JsonPreview data={state} />
            </div>
          )}

          {!state?.request?.data?.txData?.JSONRepresentation && (
            <ErrorBanner error="No pending sign request." />
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
              </div>
              <div className="secret-warning">
                <strong>⚠️ Important:</strong> Save this secret securely! You
                will need it to claim the HTLC later.
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
              <TextField
                label="Re-enter your Password"
                password
                value={password}
                onChangeHandle={passwordChangeHandler}
                placeHolder="Enter your password"
                autoFocus
              />
              {isHTLCSpendTx && !revealed_secret && (
                <>
                  <div className="htlc-secret-input">
                    <label>HTLC Secret:</label>
                    <TextField
                      value={secret}
                      onChangeHandle={secretChangeHandler}
                      placeHolder="Enter htlc secret in hex format (64 characters)"
                      autoFocus
                    />
                    {secretError && (
                      <div className="secret-error">{secretError}</div>
                    )}
                    <div className="secret-hint">
                      <small>
                        💡 Enter the 32-byte secret in hexadecimal format
                      </small>
                    </div>
                  </div>
                </>
              )}
              {/* A block that arose while the modal was already open (the
                  escrow pre-computation settling late) is stated here too. */}
              {approvalBlocked && (
                <div className="sign-error">{blockedReason}</div>
              )}
              {signError && <div className="sign-error">{signError}</div>}
              <div className="modal-buttons">
                <Button
                  onClickHandle={() => {
                    setPassword('')
                    setSecret('')
                    setIsModalOpen(false)
                  }}
                  extraStyleClasses={extraButtonStyles}
                  alternate
                >
                  Cancel
                </Button>
                <Button
                  onClickHandle={handleModalSubmit}
                  extraStyleClasses={extraButtonStyles}
                  disabled={isSigning || !password || approvalBlocked}
                >
                  {isSigning ? 'Signing…' : 'Approve'}
                </Button>
              </div>
            </div>
          </PopUp>
        )}
      </div>
    </PageWrapper>
  )
}

export default SignBitcoinTransactionPage
