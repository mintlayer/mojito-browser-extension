/* eslint-disable no-undef */
import './ConnectionPage.css'
import { useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AccountContext } from '@Contexts'
import { Button } from '@BasicComponents'
import { ReactComponent as IconShield } from '@Assets/images/icon-shield.svg'

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

export const ConnectionPage = () => {
  const { state: external_state } = useLocation()
  const { addresses } = useContext(AccountContext)
  const website = 'example.com' // This should be replaced with the actual website name or URL

  const state = external_state
  const origin = state?.request?.origin || website

  const connectButtonExtraStyles = ['connectButton']

  const handleConnect = () => {
    const remember =
      document.querySelector <
      HTMLInputElement >
      '.connect-page__checkbox'?.checked

    const sessionKey = `session_${origin}`
    const sessionData = {
      origin,
      connected: true,
      address: {
        mainnet: {
          receiving: addresses?.mlMainnetAddresses?.mlReceivingAddresses,
          change: addresses?.mlMainnetAddresses?.mlChangeAddresses,
        },
        testnet: {
          receiving: addresses?.mlTestnetAddresses?.mlReceivingAddresses,
          change: addresses?.mlTestnetAddresses?.mlChangeAddresses,
        },
      },
      timestamp: Date.now(),
    }

    const requestId = state?.request?.requestId
    const response = {
      action: 'popupResponse',
      method: 'connect',
      requestId,
      origin,
      result: sessionData.address,
    }

    const saveAndClose = () => {
      storage.local.remove('pendingRequest', () => {
        if (runtime.lastError) {
          console.error(
            '[Mojito Popup] Error removing pendingRequest:',
            runtime.lastError,
          )
        }
        window.close()
      })
    }

    if (remember) {
      // Save session only if checkbox is checked
      storage.local.set({ [sessionKey]: sessionData }, () => {
        console.log('[Mojito Popup] Session saved for', origin)
        runtime.sendMessage(response, () => {
          console.log('[Popup] Response sent:', response)
          saveAndClose()
        })
      })
    } else {
      // No session save
      runtime.sendMessage(response, () => {
        console.log('[Popup] Response sent:', response)
        saveAndClose()
      })
    }
  }

  const handleReject = () => {
    const requestId = state?.request?.requestId
    const response = {
      action: 'popupResponse',
      method: 'connect',
      requestId,
      origin,
      result: null,
    }
    runtime.sendMessage(response, () => {
      console.log('[Popup] Response sent:', response)
      // Remove pendingRequest after sending response
      storage.local.remove('pendingRequest', () => {
        if (runtime.lastError) {
          console.error(
            '[Mojito Popup] Error removing pendingRequest:',
            runtime.lastError,
          )
        }
        window.close()
      })
    })
  }

  const submitHandler = (e) => {
    e.preventDefault()
    handleConnect()
  }

  return (
    <form
      className="connect-page__form"
      onSubmit={submitHandler}
      method="POST"
    >
      <div className="connect-page__title">
        <h2 className="connect-page__title">
          Connect Website to Your Mojito Wallet
        </h2>
        <p className="connect-page__description">
          The website <span className="connect-page__host">{origin}</span> is
          requesting access to your wallet.
        </p>
      </div>

      <div className="connect-page__content">
        <ul className="connect-page__permissions">
          <IconShield className="connect-page__icon" />
          <li>View your public addresses</li>
          <li>Request transaction signing</li>
          <li>Track connection status</li>
        </ul>

        {/* // TODO: Make this work */}
        {/* <label className="connect-page__remember">
            <input
              type="checkbox"
              className="connect-page__checkbox"
            />
            <span>Always allow this app</span>
          </label> */}

        <div className="connect-page__actions">
          <Button
            onClickHandle={handleReject}
            extraStyleClasses={connectButtonExtraStyles}
            alternate
          >
            Reject
          </Button>
          <Button
            onClickHandle={handleConnect}
            extraStyleClasses={connectButtonExtraStyles}
          >
            Connect
          </Button>
        </div>
      </div>
    </form>
  )
}

export default ConnectionPage
