import { useLocation } from 'react-router'
import { SignTransaction as SignTxHelpers, Secret } from '@Helpers'
import { MOCKS } from './mocks'
import { Button, Error, PageWrapper, SiteBadge } from '@BasicComponents'
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

  const { currentHeight } = useContext(MintlayerContext)
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

  const network = networkType === 'testnet' ? Network.Testnet : Network.Mainnet

  const hasIntent = Boolean(state?.request?.data?.txData?.intent)
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

  const isHTLCClaim =
    isHTLCTx &&
    state?.request?.data?.txData?.JSONRepresentation?.outputs?.some(
      (output) => output?.destination === HtlcInput.utxo.htlc.spend_key,
    )

  const handleApprove = () => {
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
              output.type === 'Htlc' &&
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

      const secretPresaved =
        HtlcInput?.utxo?.htlc &&
        !secret &&
        state?.request?.data?.txData?.htlc?.witness_input === undefined
          ? await Account.unlockHtlsSecret({
              accountId: accountID,
              password: pass,
              hash: HtlcInput.utxo.htlc.secret_hash.hex,
            })
          : null

      const secret_ = secretPresaved || secret

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
            disabled={!state?.request?.data?.txData?.JSONRepresentation}
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
                      disabled={isSigning || !password}
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
