/* eslint-disable no-undef */
import { useLocation } from 'react-router'
import { useContext, useState } from 'react'
import { AccountContext } from '@Contexts'
import { Button, PageWrapper, SiteBadge } from '@BasicComponents'
import { ReactComponent as IconShield } from '@Assets/images/icon-shield.svg'
import { ReactComponent as IconEye } from '@Assets/images/icon-eye.svg'
import { ReactComponent as IconSign } from '@Assets/images/icon-sign.svg'
import { ReactComponent as IconLoop } from '@Assets/images/icon-loop.svg'
import PermissionItem from './PermissionItem'
import BitcoinDataNotice from './BitcoinDataNotice'
import styles from './ConnectionPage.module.css'

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
  const isUnknownOrigin = origin === website

  const connectButtonExtraStyles = [styles.actionButton]

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
                (addr) => toHexString(Object.values(addr)[0].pubkey),
              ),
              change: addresses?.btcAddresses?.btcChangeAddresses.map((addr) =>
                toHexString(Object.values(addr)[0].pubkey),
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
    <PageWrapper>
      <form
        className={styles.form}
        onSubmit={submitHandler}
        method="POST"
      >
        <div className={styles.scrollArea}>
          <div className={styles.intro}>
            <span className={styles.shield}>
              <IconShield className={styles.shieldIcon} />
            </span>
            <h2 className={styles.title}>
              Connect website to your Mojito wallet
            </h2>
            <p className={styles.subtitle}>
              This website is requesting access to your wallet.
            </p>
            <SiteBadge
              origin={origin}
              unknown={isUnknownOrigin}
            />
          </div>

          <div className={styles.card}>
            <span className={styles.cardTitle}>
              This will allow the website to
            </span>

            <ul className={styles.permissions}>
              <PermissionItem
                icon={IconEye}
                title="View your public addresses"
                description="Public addresses and keys only, never your private keys or seed phrase."
              />
              <PermissionItem
                icon={IconSign}
                title="Request transaction signing"
                description="Every request opens in Mojito and needs your approval."
              />
              <PermissionItem
                icon={IconLoop}
                title="Track connection status"
                description="Check whether your wallet is still connected to this website."
              />
            </ul>

            {requireBTC && (
              <div className={styles.bitcoinSlot}>
                <BitcoinDataNotice
                  provideBitcoinData={provideBitcoinData}
                  onToggle={setProvideBitcoinData}
                />
              </div>
            )}
          </div>

          <p className={styles.disclaimer}>
            Only connect to websites you trust. You can reject this request and
            nothing will be shared.
          </p>
        </div>

        {/* // TODO: Make this work */}
        {/* <label className="connect-page__remember">
          <input
            type="checkbox"
            className="connect-page__checkbox"
          />
          <span>Always allow this app</span>
        </label> */}

        <div className={styles.actions}>
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
      </form>
    </PageWrapper>
  )
}

export default ConnectionPage
