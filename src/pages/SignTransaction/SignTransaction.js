import { useLocation } from 'react-router-dom'
import {
  getTransactionBINrepresentation,
  getTransactionHEX,
  getTransactionIntent,
} from './helpers'
import { MOCKS } from './mocks'

import { TransactionPreview } from './components/TransactionPreview'

import './SignTransaction.css'
import { useState, useContext } from 'react'
import { Network } from '../../services/Crypto/Mintlayer/@mintlayerlib-js'

import { AppInfo } from '@Constants'
import { Account } from '@Entities'
import { ML } from '@Cryptos'
import { AccountContext, SettingsContext } from '@Contexts'

const storage =
  // eslint-disable-next-line no-undef
  typeof browser !== 'undefined' ? browser.storage : chrome.storage

const runtime =
  // eslint-disable-next-line no-undef
  typeof browser !== 'undefined' ? browser.runtime : chrome.runtime

export const SignTransactionPage = () => {
  const { state: external_state } = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')

  const [mode, setMode] = useState('json')

  const [selectedMock, setSelectedMock] = useState('transfer')

  const state = external_state || MOCKS[selectedMock]

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses

  const network = networkType === 'testnet' ? Network.Testnet : Network.Mainnet

  const handleApprove = async () => {
    setIsModalOpen(true) // Open the modal
  }

  const handleModalSubmit = async () => {
    try {
      const transactionJSONrepresentation =
        state?.request?.data?.txData?.JSONRepresentation

      const transactionBINrepresentation = getTransactionBINrepresentation(
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
        intentEncode = getTransactionIntent({
          intent,
          transactionBINrepresentation,
          transactionJSONrepresentation,
          addressesPrivateKeys: keysList,
        })
      }

      const transactionHex = getTransactionHEX(
        {
          transactionBINrepresentation,
          transactionJSONrepresentation,
          addressesPrivateKeys: keysList,
        },
        network,
      )

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

  return (
    <div className="SignTransaction">
      <div className="header">Sign transaction</div>

      <div className="content">
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

        <div
          className="switcher_view"
          onClick={() => setMode(mode === 'json' ? 'preview' : 'json')}
        >
          Switch to {mode === 'json' ? 'preview' : 'json'}
        </div>

        {state?.request?.data?.txData?.JSONRepresentation && (
          <>
            {mode === 'preview' && (
              <div className="transaction_preview">
                <TransactionPreview
                  data={state?.request?.data?.txData?.JSONRepresentation}
                />
              </div>
            )}
            {mode === 'json' && (
              <div className="transaction_raw">
                {JSON.stringify(
                  state?.request?.data?.txData?.JSONRepresentation,
                  null,
                  2,
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="footer">
        <div
          className="btn approve"
          onClick={handleApprove}
        >
          Approve and return to page
        </div>
        <div
          className="btn reject"
          onClick={handleReject}
        >
          Decline
        </div>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Re-enter Password</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button onClick={handleModalSubmit}>Submit</button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SignTransactionPage
