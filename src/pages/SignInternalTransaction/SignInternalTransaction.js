import { useLocation, useNavigate } from 'react-router'
import { SignTransaction as SignTxHelpers, ML as MLHelpers } from '@Helpers'
import { MOCKS } from './mocks'
import { Button, Error, PageWrapper } from '@BasicComponents'
import { PopUp, TextField, Loading } from '@ComposedComponents'
import { SignTransaction } from '@ContainerComponents'
import { Mintlayer } from '@APIs'
import { LocalStorageService } from '@Storage'

import styles from './SignInternalTransaction.module.css'
import { useState, useContext, useEffect } from 'react'
import { Network } from '../../services/Crypto/Mintlayer/@mintlayerlib-js'

import { AppInfo } from '@Constants'
import { Account } from '@Entities'
import { ML } from '@Cryptos'
import { AccountContext, SettingsContext, MintlayerContext } from '@Contexts'
import { VerticalGroup, CenteredLayout } from '@LayoutComponents'

const TxResult = ({ transactionTxid }) => {
  const navigate = useNavigate()
  const goBackToWallet = () => {
    navigate('/dashboard')
  }
  return (
    <VerticalGroup bigGap>
      <h2>Your transaction was sent.</h2>
      <h3 className="result-title">Txid: {transactionTxid.tx_id}</h3>
      <CenteredLayout>
        <Button onClickHandle={goBackToWallet}>Back to wallet</Button>
      </CenteredLayout>
    </VerticalGroup>
  )
}

// Optimistic local bookkeeping after a successful broadcast: a failure here
// must never make an already-sent transaction look like a failure to the user.
const recordUnconfirmedTransaction = ({
  txPreviewInfo,
  broadcastResult,
  transactionJSONrepresentation,
  networkName,
}) => {
  try {
    const account = LocalStorageService.getItem('unlockedAccount')

    if (!account?.name) {
      return
    }

    const unconfirmedTransactionString = MLHelpers.getUnconfirmedTransactionKey(
      account.name,
      networkName,
    )
    const unconfirmedTransactions =
      LocalStorageService.getItem(unconfirmedTransactionString) || []

    unconfirmedTransactions.push({
      direction: 'out',
      type: 'Unconfirmed',
      destAddress: txPreviewInfo.destination || broadcastResult.tx_id,
      value: txPreviewInfo.amount || 0,
      confirmations: 0,
      date: '',
      txid: broadcastResult.tx_id,
      fee: txPreviewInfo.fee || '',
      isConfirmed: false,
      mode: txPreviewInfo.action || 'transfer',
      poolId: '',
      delegationId: '',
      usedUtxosOutpoints: transactionJSONrepresentation.inputs
        .filter(({ input }) => input.input_type === 'UTXO')
        .map(({ input: { index, source_id } }) => ({ index, source_id })),
    })
    LocalStorageService.setItem(
      unconfirmedTransactionString,
      unconfirmedTransactions,
    )
  } catch (bookkeepingError) {
    console.error(
      'Failed to record the unconfirmed transaction locally:',
      bookkeepingError,
    )
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
  const [sendingTransaction, setSendingTransaction] = useState(false)
  const [transactionId, setTransactionId] = useState(null)
  const [txErrorMessage, setTxErrorMessage] = useState(null)
  const loadingExtraClasses = ['loading-big']
  const navigate = useNavigate()

  const [selectedMock, setSelectedMock] = useState('transfer')
  const extraButtonStyles = [styles.buttonSignTransaction]

  const state =
    external_state ||
    (process.env.NODE_ENV === 'development' ? MOCKS[selectedMock] : null)

  const { networkType } = useContext(SettingsContext)
  const { txPreviewInfo, fetchAllData, fetchDelegations, currentHeight } =
    useContext(MintlayerContext)

  const blockHeight = currentHeight ? BigInt(currentHeight) : 0n
  const currentMlAddresses = addresses.mlAddresses

  const network =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? Network.Mainnet
      : Network.Testnet
  const networkName =
    networkType === AppInfo.NETWORK_TYPES.MAINNET ? 'mainnet' : 'testnet'

  const handleApprove = async () => {
    setIsModalOpen(true) // Open the modal
  }

  const handleUpodateInfo = () => {
    fetchAllData()
    fetchDelegations()
  }

  const handleModalSubmit = async ({ usePasskey = false } = {}) => {
    setSendingTransaction(true)
    try {
      const transactionJSONrepresentation =
        state?.request?.data?.txData?.JSONRepresentation
      const transactionBINrepresentation =
        SignTxHelpers.getTransactionBINrepresentation(
          transactionJSONrepresentation,
          network,
          blockHeight,
        )

      let unlockedAccount
      try {
        unlockedAccount = usePasskey
          ? await Account.unlockAccountWithPasskey(accountID, {
              wallets: ['ml'],
            })
          : await Account.unlockAccount(accountID, password, {
              wallets: ['ml'],
            })
      } catch {
        // a passkey cancellation falls back to the password form
        if (usePasskey) {
          setPasswordEntry(true)
          setTxErrorMessage(
            'Passkey unlock failed — use your password instead.',
          )
        } else {
          setTxErrorMessage('Incorrect password')
        }
        setPassword('')
        return
      }

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

      const order_info = {}

      // if fill/conclude order then check for order id and fetch data
      const orderInput = transactionJSONrepresentation.inputs.find((input) =>
        ['FillOrder', 'ConcludeOrder'].includes(input.input.command),
      )

      if (orderInput) {
        const order_id = orderInput.input.order_id
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
        },
        network,
        blockHeight,
        {
          pool_info: {},
          order_info,
        },
      )

      const result = await Mintlayer.broadcastTransaction(transactionHex)
      setTransactionId(JSON.parse(result))
      handleUpodateInfo()

      if (txPreviewInfo) {
        recordUnconfirmedTransaction({
          txPreviewInfo,
          broadcastResult: JSON.parse(result),
          transactionJSONrepresentation,
          networkName,
        })
      }
    } catch (error) {
      SignTxHelpers.handleTxError(error, setTxErrorMessage, setPassword)
    } finally {
      setSendingTransaction(false)
    }
  }

  const handleDecline = () => {
    setPassword('')
    setSendingTransaction(false)
    setTxErrorMessage('')
    setIsModalOpen(false)
  }

  const handleReject = () => {
    navigate('/dashboard')
  }

  const selectMock = (name) => {
    setSelectedMock(name)
  }

  const passwordChangeHandler = (value) => {
    setPassword(value)
  }

  return (
    <PageWrapper>
      <div className={styles.signTransaction}>
        <div className={styles.header}>
          <h1 className={styles.signTxTitle}>Sign transaction</h1>
        </div>

        <div className={styles.signTxContent}>
          {!external_state && process.env.NODE_ENV === 'development' && (
            <div className={styles.mockSelector}>
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
                <SignTransaction.InternalTransactionPreview data={state} />
              }
              rawJsonNode={<SignTransaction.JsonPreview data={state} />}
            />
          )}

          {!state?.request?.data?.txData?.JSONRepresentation && (
            <Error error="No pending transaction to sign." />
          )}
        </div>

        <div className={styles.footer}>
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
            {sendingTransaction && (
              <VerticalGroup bigGap>
                <h2 className="loading-text">
                  Your transaction broadcasting to network.
                </h2>
                <CenteredLayout>
                  <Loading extraStyleClasses={loadingExtraClasses} />
                </CenteredLayout>
              </VerticalGroup>
            )}

            {!sendingTransaction && transactionId && (
              <TxResult transactionTxid={transactionId} />
            )}

            {!sendingTransaction && !transactionId && (
              <div className={styles.modalContent}>
                {hasPasskey && !usePasswordEntry ? (
                  <div className={styles.modalContent}>
                    <p className={styles.passkeyHint}>
                      Confirm with this device (biometrics or screen lock).
                    </p>
                    <div className={styles.modalButtons}>
                      <Button
                        onClickHandle={handleDecline}
                        extraStyleClasses={extraButtonStyles}
                        alternate
                      >
                        Decline
                      </Button>
                      <Button
                        onClickHandle={() =>
                          handleModalSubmit({ usePasskey: true })
                        }
                        extraStyleClasses={extraButtonStyles}
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.modalContent}>
                    <div className={styles.modalTitle}>
                      <TextField
                        label="Re-enter your Password"
                        password
                        value={password}
                        onChangeHandle={passwordChangeHandler}
                        placeHolder="Enter your password"
                        autoFocus
                      />
                      {txErrorMessage ? (
                        <Error error={txErrorMessage} />
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className={styles.modalButtons}>
                      <Button
                        onClickHandle={handleDecline}
                        extraStyleClasses={extraButtonStyles}
                        alternate
                      >
                        Decline
                      </Button>
                      <Button
                        onClickHandle={handleModalSubmit}
                        extraStyleClasses={extraButtonStyles}
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </PopUp>
        )}
      </div>
    </PageWrapper>
  )
}
export default SignTransactionPage
