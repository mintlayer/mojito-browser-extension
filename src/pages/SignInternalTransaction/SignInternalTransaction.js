/* eslint-disable no-undef */
import { useLocation, useNavigate } from 'react-router-dom'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import { MOCKS } from './mocks'
import { Button, Error } from '@BasicComponents'
import { PopUp, TextField, Loading } from '@ComposedComponents'
import { SignTransaction } from '@ContainerComponents'
import { Mintlayer } from '@APIs'
import { LocalStorageService } from '@Storage'

import './SignInternalTransaction.css'
import { useState, useContext } from 'react'
import { Network } from '../../services/Crypto/Mintlayer/@mintlayerlib-js'

import { AppInfo } from '@Constants'
import { Account } from '@Entities'
import { ML } from '@Cryptos'
import { AccountContext, SettingsContext, MintlayerContext } from '@Contexts'
import { VerticalGroup, CenteredLayout } from '@LayoutComponents'

const TxResult = ({ transactionTxid }) => {
  const navigate = useNavigate()
  const goBackToWallet = () => {
    navigate('/wallet/Mintlayer')
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

export const SignTransactionPage = () => {
  const { state: external_state } = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [sendingTransaction, setSendingTransaction] = useState(false)
  const [transactionId, setTransactionId] = useState(null)
  const [txErrorMessage, setTxErrorMessage] = useState(null)
  const loadingExtraClasses = ['loading-big']
  const navigate = useNavigate()

  const [mode, setMode] = useState('preview')

  const [selectedMock, setSelectedMock] = useState('transfer')
  const extraButtonStyles = ['buttonSignTransaction']

  const state = external_state || MOCKS[selectedMock]

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const { txPreviewInfo, fetchAllData, fetchDelegations, currentHeight } =
    useContext(MintlayerContext)

  const blockHeight = currentHeight ? BigInt(currentHeight) : 0n

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses

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

  const handleModalSubmit = async () => {
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
        unlockedAccount = await Account.unlockAccount(accountID, password)
      } catch (unlockError) {
        setTxErrorMessage('Incorrect password')
        setPassword('')
        return
      }

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

      const order_info = {}

      // if fill order then check for order id and fetch data
      if (
        transactionJSONrepresentation.inputs.find(
          (input) => input.input.command === 'FillOrder',
        )
      ) {
        const order_id = transactionJSONrepresentation.inputs.find(
          (input) => input.input.command === 'FillOrder',
        ).input.order_id
        const orderdata = JSON.parse(await Mintlayer.getOrderById(order_id))

        console.log('orderdata', orderdata)

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
        const account = LocalStorageService.getItem('unlockedAccount')
        const accountName = account.name
        const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkName}`
        const unconfirmedTransactions =
          LocalStorageService.getItem(unconfirmedTransactionString) || []

        unconfirmedTransactions.push({
          direction: 'out',
          type: 'Unconfirmed',
          destAddress: txPreviewInfo.destination || JSON.parse(result).tx_id,
          value: txPreviewInfo.amount || 0,
          confirmations: 0,
          date: '',
          txid: JSON.parse(result).tx_id,
          fee: txPreviewInfo.fee || '',
          isConfirmed: false,
          mode: txPreviewInfo.action || 'transfer',
          poolId: '',
          delegationId: '',
        })
        LocalStorageService.setItem(
          unconfirmedTransactionString,
          unconfirmedTransactions,
        )
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
    navigate('/wallet/Mintlayer')
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
                <SignTransaction.InternalTransactionPreview data={state} />
              </div>
            )}
            {mode === 'json' && <SignTransaction.JsonPreview data={state} />}
          </>
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
            <div className="modal-content">
              <TextField
                label="Re-enter your Password"
                password
                value={password}
                onChangeHandle={passwordChangeHandler}
                placeholder="Enter your password"
                autoFocus
              />
              {txErrorMessage ? (
                <>
                  <Error error={txErrorMessage} />
                </>
              ) : (
                <></>
              )}
              <div className="modal-buttons">
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
        </PopUp>
      )}
    </div>
  )
}

export default SignTransactionPage
