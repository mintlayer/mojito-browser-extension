import { useLocation } from 'react-router'
import { MOCKS } from './mocks'
import { Button, Error, PageWrapper, SiteBadge } from '@BasicComponents'
import { PopUp, TextField } from '@ComposedComponents'
import { SignTransaction } from '@ContainerComponents'

import './SignBitcoinTransaction.css'
import { useState, useContext, useMemo, useEffect } from 'react'
import { Network } from '../../services/Crypto/Mintlayer/@mintlayerlib-js'
import * as bitcoin from 'bitcoinjs-lib'
import { Account } from '@Entities'
import { AccountContext, BitcoinContext, SettingsContext } from '@Contexts'
import { BTCTransaction, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { BTC as BTCHelpers, Secret } from '@Helpers'
import { Electrum } from '@APIs'
import { sendPopupResponse } from '@Browser'

import { buildBtcSignRecap, parseSatoshiAmount } from './recap'

const isDevelopment = process.env.NODE_ENV === 'development'

// sat/vB used when the fee service is unreachable
const FALLBACK_BTC_FEE_RATE = 10

// bitcoinjs boundary helpers (the Buffer polyfill fails its exact
// Uint8Array validation — see BTCTransaction.js).
const u8FromHex = (hex) => new Uint8Array(Buffer.from(hex, 'hex'))

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

function parseSecretHashFromRedeemScript(redeemScriptHex) {
  // Decompile the redeem script hex into chunks (plain Uint8Array input —
  // this bitcoinjs build rejects the Buffer polyfill).
  const chunks = bitcoin.script.decompile(u8FromHex(redeemScriptHex))
  if (!chunks) throw new Error('Invalid redeemScript')

  // HTLC script structure:
  // OP_IF
  //   OP_HASH160
  //   <secretHash>        <- This is at index 2
  //   OP_EQUALVERIFY
  //   <receiverPubKey>
  // OP_ELSE
  //   <lockBlockCount>
  //   OP_CHECKSEQUENCEVERIFY
  //   OP_DROP
  //   <senderPubKey>
  // OP_ENDIF
  // OP_CHECKSIG

  // Verify the script starts with OP_IF and has OP_HASH160
  if (chunks[0] !== bitcoin.opcodes.OP_IF) {
    throw new Error('Invalid HTLC script: does not start with OP_IF')
  }

  if (chunks[1] !== bitcoin.opcodes.OP_HASH160) {
    throw new Error(
      'Invalid HTLC script: OP_HASH160 not found at expected position',
    )
  }

  // The secret hash should be at index 2 (this bitcoinjs build returns
  // plain Uint8Array chunks — Buffer.isBuffer is always false here).
  const secretHashChunk = chunks[2]

  if (!ArrayBuffer.isView(secretHashChunk)) {
    throw new Error(
      'Secret hash not found at expected position in redeemScript',
    )
  }

  return Buffer.from(secretHashChunk).toString('hex')
}

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
      const isCreate = transactionJSON?.secretHash

      if (!transactionJSON || !isCreate) {
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
  const origin = state?.request?.origin

  const revealed_secret =
    state?.request?.data?.txData?.JSONRepresentation?.secret

  const { addresses, accountID } = useContext(AccountContext)
  const { btcUtxos, unusedAddresses: unusedBtcAddresses } =
    useContext(BitcoinContext)
  const { networkType } = useContext(SettingsContext)

  const network = networkType === 'testnet' ? Network.Testnet : Network.Mainnet

  // Pre-computed, password-free facts for the HTLC create recap: the escrow
  // address (from the dApp's script params) and the fee estimate (from the
  // fee service + the wallet's UTXO set). Whatever this effect computes is
  // exactly what signing later uses — the displayed fee can't drift from
  // the charged one.
  const [escrowFeeInfo, setEscrowFeeInfo] = useState(null)
  const requestJSON = state?.request?.data?.txData?.JSONRepresentation
  const isCreateRequest = Boolean(requestJSON?.secretHash)

  useEffect(() => {
    let active = true
    if (!isCreateRequest || !requestJSON) return undefined
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
        try {
          const currentAccount = await Account.getAccount(accountID)
          const walletType =
            currentAccount?.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT
          estimatedFee = await BTCTransaction.calculateBtcTransactionFee({
            to: htlc.p2wshAddress,
            amount: parseSatoshiAmount(requestJSON.amount),
            utxos: btcUtxos || [],
            feeRate,
            walletType,
          })
        } catch {
          estimatedFee = null
        }
        if (active) setEscrowFeeInfo({ htlc, feeRate, estimatedFee })
      } catch {
        // Malformed request data: the recap falls back to warnings and
        // signing will fail with the same error.
        if (active) setEscrowFeeInfo(null)
      }
    })()
    return () => {
      active = false
    }
  }, [isCreateRequest, requestJSON, btcUtxos, accountID, networkType])

  // Human-readable approval summary — parsed facts, not raw JSON.
  const recap = buildBtcSignRecap({
    json: requestJSON,
    networkType,
    escrowFeeInfo,
  })

  // Helper functions to detect transaction types
  const isHTLCCreateTx =
    state?.request?.data?.txData?.JSONRepresentation?.secretHash
  const isHTLCSpendTx =
    state?.request?.data?.txData?.JSONRepresentation?.type === 'spendHtlc'
  // const isHTLCRefundTx = state?.request?.data?.txData?.JSONRepresentation?.type === 'refundHtlc'

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

  // Signs only when the redeem script actually binds a key from this
  // wallet — otherwise our signature is meaningless and the request is
  // either malformed or an attempt to abuse the signing oracle.
  const requireWalletKeyFor = (redeemScriptHex, btcPrivateKeys) => {
    const keyInfo = BTCTransaction.findWalletKeyForRedeemScript({
      redeemScriptHex,
      btcAddressData: btcPrivateKeys.btcAddressData,
      btcHDWallet: btcPrivateKeys.btcHDWallet,
    })
    if (!keyInfo) {
      throw Object.assign(
        new Error('This HTLC script does not bind any key from this wallet.'),
        { code: 'HTLC_SCRIPT_NOT_OURS' },
      )
    }
    return keyInfo
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

    // Fund the HTLC the same way ConfirmBtcTransaction funds a transfer:
    // wallet UTXOs + feeRate + change address + the HD root for signing.
    const currentAccount = await Account.getAccount(accountID)
    const btcWalletType =
      currentAccount.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT

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

    // Reuse the fee rate the recap displayed; only refetch when the
    // pre-computation was unavailable.
    const feeRate = escrowFeeInfo?.feeRate ?? (await getBtcFeeRate())

    const [tx, txHex] = await BTCTransaction.buildTransaction({
      to: address,
      amount: amountSatoshis, // satoshis
      utxos: btcUtxos || [],
      feeRate,
      walletType: btcWalletType,
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

    const { btcPrivateKeys } = await Account.unlockAccount(accountID, pass, {
      wallets: ['btc'],
    })

    // Sign ONLY with the wallet key the redeem script binds; reject
    // scripts that bind foreign keys instead of feeding them our signer.
    const keyInfo = requireWalletKeyFor(
      transactionJSONrepresentation.redeemScriptHex,
      btcPrivateKeys,
    )
    const toAddress = resolveHtlcDestination(
      transactionJSONrepresentation.to,
      btcPrivateKeys.btcAddressData,
    )

    // Parse secret hash from redeem script as fallback
    const secretHashFromRedeemScript = parseSecretHashFromRedeemScript(
      transactionJSONrepresentation.redeemScriptHex,
    )

    // Try to retrieve previously saved secret for HTLC spend transactions
    let secretPresaved = null
    if (isHTLCSpendTx) {
      try {
        // Use secret hash from utxo if available, otherwise use parsed from redeem script
        const secretHash = transactionJSONrepresentation.utxo?.secretHash
          ? typeof transactionJSONrepresentation.utxo.secretHash === 'string'
            ? JSON.parse(transactionJSONrepresentation.utxo.secretHash)
                .secret_hash_hex
            : transactionJSONrepresentation.utxo.secretHash.secret_hash_hex
          : secretHashFromRedeemScript

        secretPresaved = await Account.unlockHtlsSecret({
          accountId: accountID,
          password: pass,
          hash: secretHash,
        })
      } catch {
        // No saved secret for this hash — the user is prompted for manual
        // input below, so this fallback is expected and stays silent.
      }
    }

    const finalSecret = secretPresaved || revealed_secret || secret

    const tx = await BTCTransaction.buildHtlcClaimTx({
      network,
      utxo: transactionJSONrepresentation.utxo,
      toAddress,
      redeemScriptHex: transactionJSONrepresentation.redeemScriptHex,
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

    const { btcPrivateKeys } = await Account.unlockAccount(accountID, pass, {
      wallets: ['btc'],
    })

    const keyInfo = requireWalletKeyFor(
      transactionJSONrepresentation.redeemScriptHex,
      btcPrivateKeys,
    )
    const toAddress = resolveHtlcDestination(
      transactionJSONrepresentation.to,
      btcPrivateKeys.btcAddressData,
    )

    const tx = await BTCTransaction.buildHtlcRefundTx({
      network,
      utxo: transactionJSONrepresentation.utxo,
      toAddress,
      redeemScriptHex: transactionJSONrepresentation.redeemScriptHex,
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

      const transactionJSONrepresentation =
        state?.request?.data?.txData?.JSONRepresentation

      if (transactionJSONrepresentation.type === 'refundHtlc') {
        await submitRefund()
        return
      }

      if (transactionJSONrepresentation.secretHash) {
        await submitCreate()
        return
      }

      if (!transactionJSONrepresentation.secretHash) {
        await submitSpend()
        return
      }
      // Signing done: drop the password/secret from memory — the page stays
      // mounted in the side panel after the response is returned.
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
              <SignTransaction.JsonPreview data={state} />
            </div>
          )}

          {!state?.request?.data?.txData?.JSONRepresentation && (
            <Error error="No pending sign request." />
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
            disabled={!state?.request?.data?.txData?.JSONRepresentation}
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
                      placeholder="Enter htlc secret in hex format (64 characters)"
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
                  disabled={isSigning || !password}
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
