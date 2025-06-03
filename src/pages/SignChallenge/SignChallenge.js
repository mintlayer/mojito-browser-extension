/* eslint-disable no-undef */
import { useLocation } from 'react-router-dom'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import { MOCKS } from './mocks'
import { Button } from '@BasicComponents'
import { PopUp, TextField } from '@ComposedComponents'

import './SignChallenge.css'
import { useState, useContext } from 'react'
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

export const SignChallengePage = () => {
  const { state: external_state } = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')

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

  const handleApprove = async () => {
    setIsModalOpen(true) // Open the modal
  }

  const handleModalSubmit = async () => {
    try {
      const transactionJSONrepresentation =
        state?.request?.data?.txData?.JSONRepresentation
      console.log(
        'transactionJSONrepresentation',
        transactionJSONrepresentation,
      )
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

      const transactionHex = SignTxHelpers.getTransactionHEX(
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

  const switchHandle = () => {
    setMode(mode === 'json' ? 'preview' : 'json')
  }

  const passwordChangeHandler = (value) => {
    setPassword(value)
  }

  return (
    <div className="SignChallenge">
      <div className="header">
        <h1 className="signChallengeTitle">Sign Challenge</h1>
        <Button onClickHandle={switchHandle}>
          {`Switch to ${mode === 'json' ? 'preview' : 'json'}`}
        </Button>
      </div>

      <div className="SignChallengeContent">
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

        {state?.request?.data && (
          <>{JSON.stringify(state?.request?.data, null, 2)}</>
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
          Sign and return to page
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

export default SignChallengePage
