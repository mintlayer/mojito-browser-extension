/* eslint-disable no-undef */
import './ConnectionPage.css'
import { useLocation } from 'react-router'
import { useContext, useState } from 'react'
import { AccountContext } from '@Contexts'
import { Button, Toggle } from '@BasicComponents'
import { ReactComponent as IconShield } from '@Assets/images/icon-shield.svg'

const toHexString = (obj) => {
  return Object.values(obj)
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
}

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
  const website = 'Unknown Website' // This should be replaced with the actual website name or URL
  const [, setProvideBitcoinData] = useState(false)

  const provideBitcoinData = true

  const state = external_state
  const origin = state?.request?.origin || website
  const permissions = state?.request?.permissions || []

  const requireBTC = permissions.includes('bitcoin')

  const connectButtonExtraStyles = ['connectButton']

  const handleConnect = () => {
    const remember = document.querySelector('.connect-page__checkbox')?.checked
    const sessionKey = `session_${origin}`
    const sessionData = {
      origin,
      connected: true,
      address: {
        mainnet: {
          receiving: addresses?.mlAddresses?.mlReceivingAddresses,
          change: addresses?.mlAddresses?.mlChangeAddresses,
        },
        testnet: {
          receiving: addresses?.mlAddresses?.mlReceivingAddresses,
          change: addresses?.mlAddresses?.mlChangeAddresses,
        },
      },
      addressesByChain: {
        mintlayer: {
          receiving: addresses?.mlAddresses?.mlReceivingAddresses,
          change: addresses?.mlAddresses?.mlChangeAddresses,
          publicKeys: {
            receiving:
              addresses?.mlAddresses?.mlReceivingPublicKeys.map(toHexString),
            change: addresses?.mlAddresses?.mlChangePublicKeys.map(toHexString),
          },
        },
        ...(provideBitcoinData && {
          bitcoin: {
            receiving: addresses?.btcAddresses?.btcReceivingAddresses.map(
              (addr) => Object.keys(addr)[0],
            ),
            change: addresses?.btcAddresses?.btcChangeAddresses.map(
              (addr) => Object.keys(addr)[0],
            ),
            publicKeys: {
              receiving: addresses?.btcAddresses?.btcReceivingAddresses.map(
                (addr) =>
                  Buffer.from(Object.values(addr)[0].pubkey).toString('hex'),
              ),
              change: addresses?.btcAddresses?.btcChangeAddresses.map((addr) =>
                Buffer.from(Object.values(addr)[0].pubkey).toString('hex'),
              ),
            },
          },
        }),
      },
      timestamp: Date.now(),
    }

    const requestId = state?.request?.requestId
    const response = {
      action: 'popupResponse',
      method: 'connect',
      requestId,
      origin,
      result: sessionData,
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
        <div>
          <ul className="connect-page__permissions">
            <IconShield className="connect-page__icon" />
            <li>View your public addresses</li>
            <li>Request transaction signing</li>
            <li>Track connection status</li>
          </ul>

          {requireBTC && (
            <>
              <div className="connect-page__bitcoin-section">
                <div className="connect-page__bitcoin-toggle">
                  <div>Provide Bitcoin data (addresses AND public keys)</div>
                  <Toggle
                    label="Provide Bitcoin data (addresses AND public keys)"
                    name="provideBitcoinData"
                    toggled={provideBitcoinData}
                    onClick={setProvideBitcoinData}
                  />
                </div>

                <div className="connect-page__info-block">
                  <div className="connect-page__info-icon">i</div>
                  <p className="connect-page__info-text">
                    <strong>Note:</strong> This option is mandatory when
                    connecting to HTLC Atomic Swaps dApps. It provides both
                    Bitcoin addresses and public keys required for cross-chain
                    transactions.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

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
