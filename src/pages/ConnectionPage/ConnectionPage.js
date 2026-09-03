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
import { sendPopupResponse } from '@Browser'
import styles from './ConnectionPage.module.css'

const toHexString = (obj) => {
  return Object.values(obj)
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
}

const UNKNOWN_WEBSITE = 'Unknown Website'

export const ConnectionPage = () => {
  const { state: external_state } = useLocation()
  const { addresses } = useContext(AccountContext)
  const [provideBitcoinData, setProvideBitcoinData] = useState(true)

  const state = external_state
  const origin = state?.request?.origin || UNKNOWN_WEBSITE
  const permissions = state?.request?.permissions || []

  const requireBTC = permissions.includes('bitcoin')
  const isUnknownOrigin = origin === UNKNOWN_WEBSITE

  const connectButtonExtraStyles = [styles.actionButton]

  const handleConnect = () => {
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

    sendPopupResponse({
      method: 'connect',
      requestId: state?.request?.requestId,
      origin,
      result: sessionData,
    })
  }

  const handleReject = () => {
    sendPopupResponse({
      method: 'connect',
      requestId: state?.request?.requestId,
      origin,
      result: null,
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
