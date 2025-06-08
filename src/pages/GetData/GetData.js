/* eslint-disable no-undef */
import { Button } from '@BasicComponents'

import './GetData.css'
import { useContext } from 'react'

import { useLocation } from 'react-router-dom'
import { AccountContext } from '@Contexts'

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
  const { state } = useLocation()

  const { addresses } = useContext(AccountContext)

  const address = addresses?.btcTestnetAddress
  const publicKey = addresses?.btcMainnetPublicKey.data.map(b => b.toString(16).padStart(2, '0')).join('')

  console.log('addresses', addresses)

  const handleApprove = async () => {
    try {
      const requestId = state?.request?.requestId
      const method = 'getData_approve'
      const result = {
        btcAddress: address,
        btcPublicKey: publicKey,
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
      console.error('Error during challenge signing:', error)
    }
  }

  const handleReject = () => {
    const requestId = state?.request?.requestId
    const method = 'getData_reject'
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

  return (
    <div className="GenerateSecret">
      <div className="header">
        <h1 className="GenerateSecretTitle">Provide Bitcoin Data</h1>
      </div>

      <div className="GenerateSecretContent">
        <div>
          <div>Address:</div>
          <div>{address}</div>
        </div>
        <div>
          <div>Public Key:</div>
          <div>{publicKey}</div>
        </div>
      </div>

      <div className="footer">
        <Button
          onClickHandle={handleReject}
          alternate
        >
          Decline
        </Button>
        <Button onClickHandle={handleApprove}>Approve</Button>
      </div>
    </div>
  )
}

export default SignChallengePage
