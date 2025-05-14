import './ConnectionPage.css'
import { useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AccountContext } from '@Contexts'

const storage =
  // eslint-disable-next-line no-undef
  typeof browser !== 'undefined' ? browser.storage : chrome.storage

const runtime =
  // eslint-disable-next-line no-undef
  typeof browser !== 'undefined' ? browser.runtime : chrome.runtime

export const ConnectionPage = () => {
  const { state: external_state } = useLocation()

  const { addresses } = useContext(AccountContext)

  const website = 'example.com' // This should be replaced with the actual website name or URL

  const state = external_state
  const origin = state?.request?.origin || website

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

  return (
    <div>
      <div className="connect-page">
        <div className="connect-page__container">
          <h2 className="connect-page__title">
            Connect Website to Your Mojito Wallet
          </h2>
          <p className="connect-page__description">
            The website <span className="connect-page__host">{origin}</span> is
            requesting access to your wallet.
          </p>

          <ul className="connect-page__permissions">
            <li>View your public addresses</li>
            <li>Request transaction signing</li>
            <li>Track connection status</li>
          </ul>

          <label className="connect-page__remember">
            <input
              type="checkbox"
              className="connect-page__checkbox"
            />
            <span>Always allow this app</span>
          </label>

          <div className="connect-page__actions">
            <button
              onClick={handleReject}
              className="connect-page__button connect-page__button--reject"
            >
              Reject
            </button>
            <button
              onClick={handleConnect}
              className="connect-page__button connect-page__button--connect"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectionPage
