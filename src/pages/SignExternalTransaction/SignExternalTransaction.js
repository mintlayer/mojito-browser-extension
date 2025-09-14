/* eslint-disable no-undef */
import { useLocation } from 'react-router-dom'
import { SignTransaction as SignTxHelpers, Secret } from '@Helpers'
import { MOCKS } from './mocks'
import { Button } from '@BasicComponents'
import { PopUp, TextField } from '@ComposedComponents'
import { SignTransaction } from '@ContainerComponents'

import './SignExternalTransaction.css'
import { useState, useContext, useEffect } from 'react'
import { Network } from '../../services/Crypto/Mintlayer/@mintlayerlib-js'

import { AppInfo } from '@Constants'
import { Account } from '@Entities'
import { ML } from '@Cryptos'
import { AccountContext, SettingsContext } from '@Contexts'

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

export const SignTransactionPage = () => {
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

  const state = external_state || MOCKS[selectedMock]

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses

  const network = networkType === 'testnet' ? Network.Testnet : Network.Mainnet

  const isHTLCCreateTx =
    state?.request?.data?.txData?.JSONRepresentation?.outputs?.some(
      (output) => output?.type === 'Htlc',
    )

  const isHTLCTx =
    state?.request?.data?.txData?.JSONRepresentation?.inputs?.some(
      (input) => input?.utxo?.type === 'Htlc',
    )

  const HtlcInput =
    state?.request?.data?.txData?.JSONRepresentation?.inputs.find(
      (input) => input?.utxo?.type === 'Htlc',
    )

  const HtlcOutput =
    state?.request?.data?.txData?.JSONRepresentation?.outputs?.find(
      (output) => output?.type === 'Htlc',
    )

  const isHTLCClaim =
    isHTLCTx &&
    state?.request?.data?.txData?.JSONRepresentation?.outputs?.some(
      (output) => output?.destination === HtlcInput.utxo.htlc.spend_key,
    )

  const handleApprove = async () => {
    setIsModalOpen(true) // Open the modal
  }

  useEffect(() => {
    // SECRET FOR HTLC
    // Check if this is a create HTLC transaction and if secret_hash needs to be filled in
    const transactionJSON = state?.request?.data?.txData?.JSONRepresentation

    if (!transactionJSON || !transactionJSON.outputs) {
      return
    }

    // Find HTLC outputs that need secret generation
    const htlcOutputsNeedingSecret = transactionJSON.outputs.filter(
      (output) => {
        return (
          output.type === 'Htlc' &&
          output.htlc &&
          (!output.htlc.secret_hash ||
            !output.htlc.secret_hash.hex ||
            output.htlc.secret_hash.hex === null)
        )
      },
    )

    // If we found HTLC outputs that need secrets, generate one
    if (htlcOutputsNeedingSecret.length > 0 && !generatedSecret) {
      try {
        const secretObj = Secret.generateSecretObject()
        setGeneratedSecret(secretObj.secretHex)
        setGeneratedSecretHash(secretObj.secretHashHex)

        // Update the transaction JSON to fill in the secret_hash
        htlcOutputsNeedingSecret.forEach((output) => {
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

        console.log('Generated secret for HTLC transaction:', {
          secret: secretObj.secretHex,
          secretHash: secretObj.secretHashHex,
          affectedOutputs: htlcOutputsNeedingSecret.length,
        })
      } catch (error) {
        console.error('Failed to generate secret for HTLC transaction:', error)
      }
    }
  }, [state, generatedSecret])

  const handleModalSubmit = async () => {
    try {
      // Validate secret if it's an HTLC claim transaction
      if (isHTLCClaim && secret && !Secret.validateSecretHex(secret.trim())) {
        setSecretError(
          'Invalid secret format. Please enter a valid 64-character hex string.',
        )
        return
      }

      const transactionJSONrepresentation =
        state?.request?.data?.txData?.JSONRepresentation

      const transactionBINrepresentation =
        SignTxHelpers.getTransactionBINrepresentation(
          transactionJSONrepresentation,
          network,
        )

      const pass = password

      const unlockedAccount = await Account.unlockAccount(accountID, pass)

      const mlPrivKeys = unlockedAccount.mlPrivKeys

      const privKey =
        networkType === 'mainnet'
          ? mlPrivKeys.mlMainnetPrivateKey
          : mlPrivKeys.mlTestnetPrivateKey

      const changeAddressesLength = currentMlAddresses.mlChangeAddresses.length

      const walletPrivKeys = ML.getWalletPrivKeysList(
        privKey,
        networkType,
        changeAddressesLength,
      )

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

      const secretPresaved = HtlcInput?.utxo?.htlc
        ? Account.unlockHtlsSecret({
            accountId: accountID,
            password: pass,
            hash: HtlcInput.utxo.htlc.secret_hash.hex,
          })
        : null

      const secret_ = secretPresaved || secret

      const transactionHex = SignTxHelpers.getTransactionHEX(
        {
          transactionBINrepresentation,
          transactionJSONrepresentation,
          addressesPrivateKeys: keysList,
          secret: secret_
            ? new Uint8Array(Buffer.from(secret_, 'hex'))
            : undefined,
        },
        network,
      )

      let refundTx

      console.log('isHTLCCreateTx', isHTLCCreateTx)

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

        console.log('isHTLCCreateTx')
        refundTx = {
          transactionJSONrepresentation: null,
          transactionBINrepresentation: null,
          witness: null,
        }

        refundTx.transactionJSONrepresentation = {
          id: null,
          inputs: [
            {
              input: {
                index: 0,
                input_type: 'UTXO',
                source_id: transactionJSONrepresentation.id,
                source_type: 'Transaction',
              },
              utxo: HtlcOutput,
            },
          ],
          outputs: [
            {
              destination: HtlcOutput.htlc.refund_key,
              type: 'Transfer',
              value: {
                amount: {
                  atoms: HtlcOutput.value.amount.atoms,
                  decimal: HtlcOutput.value.amount.decimal,
                },
                type: 'Coin',
              },
            },
          ],
        }

        refundTx.transactionBINrepresentation =
          SignTxHelpers.getTransactionBINrepresentation(
            refundTx.transactionJSONrepresentation,
            network,
          )

        refundTx.transactionHex = SignTxHelpers.getTransactionHEX(
          {
            transactionBINrepresentation: refundTx.transactionBINrepresentation,
            transactionJSONrepresentation:
              refundTx.transactionJSONrepresentation,
            addressesPrivateKeys: keysList,
          },
          network,
        )
      }

      console.log('refundTx', refundTx)

      const requestId = state?.request?.requestId
      const method = 'signTransaction_approve'
      let result
      if (intentEncode) {
        result = {
          transactionHex,
          intentEncode,
        }
      } else if (refundTx?.transactionHex) {
        result = {
          transactionHex,
          refundTx,
        }
      } else {
        result = transactionHex
      }
      console.log('result', result)
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
    } catch (error) {
      console.error('Error during transaction signing:', error)
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
                <SignTransaction.ExternalTransactionPreview data={state} />
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
              <div className="secret-actions">
                {/* TODO: Add "Save Secret" button functionality here */}
                <p>
                  <em>
                    💡 Save this secret - you'll need it to claim the HTLC
                    later!
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
              placeholder="Enter your password"
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

export default SignTransactionPage
