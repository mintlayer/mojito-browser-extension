import { useLocation } from 'react-router'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import { MOCKS } from './mocks'
import { Button, PageWrapper, SiteBadge } from '@BasicComponents'
import { PopUp, TextField } from '@ComposedComponents'

import './SignChallenge.css'
import { useState, useContext } from 'react'

import { Account } from '@Entities'
import { ML } from '@Cryptos'
import { AccountContext, SettingsContext } from '@Contexts'
import { sendPopupResponse } from '@Browser'

const isDevelopment = process.env.NODE_ENV === 'development'

export const SignChallengePage = () => {
  const { state: external_state } = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [isSigning, setIsSigning] = useState(false)
  const [signError, setSignError] = useState('')

  const [selectedMock, setSelectedMock] = useState('transfer')
  const extraButtonStyles = ['buttonSignTransaction']

  const state = external_state || (isDevelopment ? MOCKS[selectedMock] : null)
  const origin = state?.request?.origin

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const currentMlAddresses = addresses.mlAddresses

  const handleApprove = () => {
    setSignError('')
    setIsModalOpen(true) // Open the modal
  }

  const handleModalSubmit = async () => {
    if (isSigning) return

    setIsSigning(true)
    setSignError('')

    try {
      const message = state?.request?.data?.message
      const address =
        state?.request?.data?.address ||
        currentMlAddresses.mlReceivingAddresses[0]

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

      const signature = SignTxHelpers.signChallenge(message, address, keysList)

      const signatureHex = signature.reduce(
        (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
        '',
      )

      sendPopupResponse({
        method: 'signChallenge_approve',
        requestId: state?.request?.requestId,
        origin,
        result: {
          message,
          address,
          signature: signatureHex,
        },
      })
    } catch (error) {
      console.error('Error during challenge signing:', error)
      setSignError(
        error?.message || 'Signing failed. Check your password and try again.',
      )
      setIsSigning(false)
    }
  }

  const handleReject = () => {
    sendPopupResponse({
      method: 'signChallenge_reject',
      requestId: state?.request?.requestId,
      origin,
      error: 'Challenge signing rejected',
    })
  }

  const selectMock = (name) => {
    setSelectedMock(name)
  }

  const passwordChangeHandler = (value) => {
    setPassword(value)
  }

  return (
    <PageWrapper>
      <div className="SignChallenge">
        <div className="header">
          <h1 className="signChallengeTitle">Sign Challenge</h1>
        </div>

        <div className="requestOrigin">
          <SiteBadge
            origin={origin || 'Unknown Website'}
            unknown={!origin}
          />
        </div>

        <div className="SignChallengeContent">
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

          {state?.request?.data && (
            <div className="challenge_details">
              <div className="challenge_message">
                <div className="label">Message to sign:</div>
                <div className="value">
                  {state?.request?.data?.message || 'No message provided'}
                </div>
              </div>
              <div className="challenge_address">
                <div className="label">Address to sign with:</div>
                <div className="">
                  {state?.request?.data?.address || 'No address provided'}
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
                placeHolder="Enter your password"
                autoFocus
              />
              {signError && <div className="sign-error">{signError}</div>}
              <div className="modal-buttons">
                <Button
                  onClickHandle={() => setIsModalOpen(false)}
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

export default SignChallengePage
