/* eslint-disable no-undef */
import { Button } from '@BasicComponents'

import './GenerateSecret.css'
import { useState, useEffect } from 'react'

import { createHash } from 'crypto-browserify'
import { useLocation } from 'react-router-dom'

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
  const [secret, setSecret] = useState(new Uint8Array(32))

  useEffect(() => {
    const newSecret = crypto.getRandomValues(new Uint8Array(32))
    setSecret(newSecret)
  }, [])

  const sha256 = createHash('sha256').update(secret).digest()
  const ripemd160 = createHash('ripemd160').update(sha256).digest()

  const secret_hex = Buffer.from(secret).toString('hex')
  const secret_hash_hex = Buffer.from(ripemd160).toString('hex')

  const handleApprove = async () => {
    try {
      const requestId = state?.request?.requestId
      const method = 'requestSecretHash_approve'
      const result = {
        secret_hash_hex,
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
    const method = 'requestSecretHash_reject'
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
        <h1 className="GenerateSecretTitle">Generate Secret</h1>
      </div>

      <div className="GenerateSecretContent">
        <div>
          <div>Secret hex:</div>
          <div>{secret_hex}</div>
        </div>
        <div>
          <div>Secret hash hex:</div>
          <div>{secret_hash_hex}</div>
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
