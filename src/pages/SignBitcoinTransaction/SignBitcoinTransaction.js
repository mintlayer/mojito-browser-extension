/* eslint-disable no-undef */
import { useLocation } from 'react-router-dom'
import { MOCKS } from './mocks'
import { Button } from '@BasicComponents'
import { PopUp, TextField } from '@ComposedComponents'
import { SignTransaction } from '@ContainerComponents'

import './SignBitcoinTransaction.css'
import { useState, useContext, useEffect } from 'react'
import { Network } from '../../services/Crypto/Mintlayer/@mintlayerlib-js'
import * as bitcoin from 'bitcoinjs-lib'
import { Account } from '@Entities'
import { AccountContext, SettingsContext } from '@Contexts'
import { BTCTransaction } from '@Cryptos'
import { Secret } from '@Helpers'

const storage =
  typeof browser !== 'undefined' && browser.storage
    ? browser.storage
    : typeof chrome !== 'undefined' && chrome.storage
      ? chrome.storage
      : null

const runtime =
  typeof browser !== 'undefined' && browser.runtime
    ? browser.runtime
    : typeof chrome !== 'undefined' && chrome.runtime
      ? chrome.runtime
      : null

function parseSecretHashFromRedeemScript(redeemScriptHex) {
  // Decompile the redeem script hex into chunks
  const chunks = bitcoin.script.decompile(Buffer.from(redeemScriptHex, 'hex'))
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

  // The secret hash should be at index 2
  const secretHashChunk = chunks[2]

  if (!Buffer.isBuffer(secretHashChunk)) {
    throw new Error(
      'Secret hash not found at expected position in redeemScript',
    )
  }

  // Convert the secret hash buffer to hex string
  return secretHashChunk.toString('hex')
}

export const SignBitcoinTransactionPage = () => {
  const { state: external_state } = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [secret, setSecret] = useState('')

  // Secret management state for HTLC transactions
  const [generatedSecret, setGeneratedSecret] = useState(null)
  const [generatedSecretHash, setGeneratedSecretHash] = useState(null)
  const [secretError, setSecretError] = useState('')

  const [mode, setMode] = useState('preview')

  const [selectedMock, setSelectedMock] = useState('transfer')
  const extraButtonStyles = ['buttonSignTransaction']

  // State to hold the potentially modified transaction data
  const [transactionState, setTransactionState] = useState(null)

  const state = transactionState || external_state || MOCKS[selectedMock]

  const revealed_secret =
    state?.request?.data?.txData?.JSONRepresentation.secret

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentBtcAddress = addresses.btcAddresses
  const network = networkType === 'testnet' ? Network.Testnet : Network.Mainnet

  // Helper functions to detect transaction types
  const isHTLCCreateTx =
    state?.request?.data?.txData?.JSONRepresentation?.secretHash
  const isHTLCSpendTx =
    state?.request?.data?.txData?.JSONRepresentation?.type === 'spendHtlc'
  // const isHTLCRefundTx = state?.request?.data?.txData?.JSONRepresentation?.type === 'refundHtlc'

  useEffect(() => {
    // SECRET FOR HTLC
    // Check if this is a create HTLC transaction and if secret needs to be generated
    const currentState =
      transactionState || external_state || MOCKS[selectedMock]
    const transactionJSON =
      currentState?.request?.data?.txData?.JSONRepresentation

    if (!transactionJSON) {
      return
    }

    // If this is an HTLC create transaction and we haven't generated a secret yet
    if (isHTLCCreateTx && !generatedSecret) {
      try {
        const secretObj = Secret.generateSecretObject()
        setGeneratedSecret(secretObj.secretHex)
        setGeneratedSecretHash(secretObj.secretHashHex)

        // Create a deep copy of the current state to avoid mutation
        const updatedState = JSON.parse(JSON.stringify(currentState))
        const updatedTransactionJSON =
          updatedState.request.data.txData.JSONRepresentation

        // Update the transaction with the generated secret hash
        if (updatedTransactionJSON.secretHash) {
          updatedTransactionJSON.secretHash = JSON.stringify({
            secret_hash_hex: secretObj.secretHashHex,
          })
        }

        // Update the transaction state
        setTransactionState(updatedState)
      } catch (error) {
        console.error('Error generating secret:', error)
      }
    }
  }, [
    external_state,
    selectedMock,
    transactionState,
    isHTLCCreateTx,
    generatedSecret,
  ])

  const handleApprove = async () => {
    setIsModalOpen(true) // Open the modal
  }

  const submitCreate = async () => {
    const pass = password

    const transactionJSONrepresentation =
      state?.request?.data?.txData?.JSONRepresentation

    const { WIF } = await Account.unlockAccount(accountID, pass)

    const htlc = await BTCTransaction.buildHTLCAndFundingAddress({
      receiverPubKey: transactionJSONrepresentation.recipientPublicKey,
      senderPubKey: transactionJSONrepresentation.refundPublicKey,
      senderAddress: transactionJSONrepresentation.refund,
      amount: transactionJSONrepresentation.amount, // atoms!!
      // lock: transactionJSONrepresentation.lock,
      lock: transactionJSONrepresentation.timeoutBlocks,
      secretHashHex: JSON.parse(transactionJSONrepresentation.secretHash)
        .secret_hash_hex,
      wif: WIF,
      networkType,
      fundingKeyPair: {
        publicKey: Buffer.from(
          transactionJSONrepresentation.refundPublicKey,
          'hex',
        ),
      }, // TODO: take another key from the wallet
    })

    // address to send funds to
    const address = htlc.p2wshAddress

    const [, txHex, txId] = await BTCTransaction.buildTransaction({
      to: address,
      amount: parseInt(transactionJSONrepresentation.amount), // atoms
      fee: 2000, // TODO: update calculation of fee
      wif: WIF,
      from: currentBtcAddress,
      networkType,
    })

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

    // eslint-disable-next-line no-undef
    runtime.sendMessage(
      {
        action: 'popupResponse',
        method,
        requestId,
        origin,
        result,
      },
      () => {
        // eslint-disable-next-line no-undef
        storage.local.remove('pendingRequest', () => {
          window.close()
        })
      },
    )
  }

  const submitSpend = async () => {
    const pass = password

    const transactionJSONrepresentation =
      state?.request?.data?.txData?.JSONRepresentation

    const { WIF } = await Account.unlockAccount(accountID, pass)

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
      } catch (error) {
        console.log(
          'No saved secret found, will use manual input:',
          error.message,
        )
      }
    }

    const finalSecret = secretPresaved || revealed_secret || secret

    const tx = await BTCTransaction.buildHtlcClaimTx({
      network,
      utxo: transactionJSONrepresentation.utxo,
      toAddress: transactionJSONrepresentation.to,
      redeemScriptHex: transactionJSONrepresentation.redeemScriptHex,
      secretHex: finalSecret,
      wif: WIF,
    })

    const requestId = state?.request?.requestId
    const method = 'signTransaction_approve'
    const result = {
      signedTxHex: tx,
    }
    // eslint-disable-next-line no-undef
    runtime.sendMessage(
      {
        action: 'popupResponse',
        method,
        requestId,
        origin,
        result,
      },
      () => {
        // eslint-disable-next-line no-undef
        storage.local.remove('pendingRequest', () => {
          window.close()
        })
      },
    )
  }

  const submitRefund = async () => {
    const pass = password

    const transactionJSONrepresentation =
      state?.request?.data?.txData?.JSONRepresentation

    const { WIF } = await Account.unlockAccount(accountID, pass)

    const tx = await BTCTransaction.buildHtlcRefundTx({
      network,
      utxo: transactionJSONrepresentation.utxo,
      toAddress: transactionJSONrepresentation.to,
      redeemScriptHex: transactionJSONrepresentation.redeemScriptHex,
      wif: WIF,
    })

    const requestId = state?.request?.requestId
    const method = 'signTransaction_approve'
    const result = {
      signedTxHex: tx,
    }

    // eslint-disable-next-line no-undef
    runtime.sendMessage(
      {
        action: 'popupResponse',
        method,
        requestId,
        origin,
        result,
      },
      () => {
        // eslint-disable-next-line no-undef
        storage.local.remove('pendingRequest', () => {
          window.close()
        })
      },
    )
  }

  const handleModalSubmit = async () => {
    try {
      // Validate secret if it's an HTLC spend transaction and secret is manually entered
      if (isHTLCSpendTx && secret && !Secret.validateSecretHex(secret.trim())) {
        setSecretError(
          'Invalid secret format. Please enter a valid 64-character hex string.',
        )
        return
      }

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
    } catch (error) {
      console.error('Error during transaction signing:', error)
      // If it's a secret validation error, keep the modal open
      if (error.message && error.message.includes('secret')) {
        return
      }
      setIsModalOpen(false)
    }
  }

  const handleReject = () => {
    const requestId = state?.request?.requestId
    const method = 'signTransaction_reject'
    const result = 'null'
    // eslint-disable-next-line no-undef
    runtime.sendMessage(
      {
        action: 'popupResponse',
        method,
        requestId,
        origin,
        result,
      },
      () => {
        // eslint-disable-next-line no-undef
        storage.local.remove('pendingRequest', () => {
          window.close()
        })
      },
    )
  }

  const selectMock = (name) => {
    setSelectedMock(name)
  }

  const switchHandle = () => {
    setMode(mode === 'json' ? 'preview' : 'json')
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
    <div className="SignTransaction">
      <div className="header">
        <h1 className="signTxTitle">Sign Transaction</h1>
        <Button onClickHandle={switchHandle}>
          {`Switch to ${mode === 'json' ? 'preview' : 'json'}`}
        </Button>
      </div>

      <div className="SignTxContent">
        {!external_state && (
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
          <>
            {mode === 'preview' && (
              <div className="transaction-preview-wrapper">
                <SignTransaction.JsonPreview data={state} />
                {/*<SignTransaction.TransactionPreview data={state} />*/}
              </div>
            )}
            {mode === 'json' && <SignTransaction.JsonPreview data={state} />}
          </>
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
              <strong>⚠️ Important:</strong> Save this secret securely! You will
              need it to claim the HTLC later.
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
        >
          Approve and return to page.
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
              placeholder="Enter your password"
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
            <div className="modal-buttons">
              <Button
                onClickHandle={() => setIsModalOpen(false)}
                extraStyleClasses={extraButtonStyles}
                alternate
              >
                Decline
              </Button>
              <Button
                onClickHandle={handleModalSubmit}
                extraStyleClasses={extraButtonStyles}
              >
                Approve
              </Button>
            </div>
          </div>
        </PopUp>
      )}
    </div>
  )
}

export default SignBitcoinTransactionPage
