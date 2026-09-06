import { useLocation } from 'react-router'
import { useContext, useState } from 'react'
import { AccountContext, SettingsContext } from '@Contexts'
import { Button, PageWrapper, SiteBadge } from '@BasicComponents'
import { ReactComponent as IconShield } from '@Assets/images/icon-shield.svg'
import { ReactComponent as IconEye } from '@Assets/images/icon-eye.svg'
import { ReactComponent as IconSign } from '@Assets/images/icon-sign.svg'
import { ReactComponent as IconLoop } from '@Assets/images/icon-loop.svg'
import PermissionItem from './PermissionItem'
import BitcoinDataNotice from './BitcoinDataNotice'
import { sendPopupResponse } from '@Browser'
import { BTC } from '@Helpers'
import styles from './ConnectionPage.module.css'

const toHexString = (obj) => {
  return Object.values(obj)
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')
}

const btcPubKeyOf = (entry) => {
  if (!entry || typeof entry === 'string') return undefined
  const { pubkey } = Object.values(entry)[0] ?? {}
  return pubkey ? toHexString(pubkey) : undefined
}

const UNKNOWN_WEBSITE = 'Unknown Website'

export const ConnectionPage = () => {
  const { state: external_state } = useLocation()
  const { addresses } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const [provideBitcoinData, setProvideBitcoinData] = useState(true)

  const state = external_state
  const origin = state?.request?.origin || UNKNOWN_WEBSITE
  const permissions = state?.request?.permissions || []

  const requireBTC = permissions.includes('bitcoin')
  const isUnknownOrigin = origin === UNKNOWN_WEBSITE

  const ml = addresses?.mlAddresses ?? {}
  const btc = addresses?.btcAddresses ?? {}

  const btcReceiving = Array.isArray(btc.btcReceivingAddresses)
    ? btc.btcReceivingAddresses
    : []
  const btcChange = Array.isArray(btc.btcChangeAddresses)
    ? btc.btcChangeAddresses
    : []

  const hasWalletAddresses =
    Array.isArray(ml.mlReceivingAddresses) && ml.mlReceivingAddresses.length > 0

  const connectButtonExtraStyles = [styles.actionButton]

  const handleConnect = () => {
    if (!hasWalletAddresses) return

    const includeBitcoin =
      provideBitcoinData && btcReceiving.length + btcChange.length > 0

    // The addresses belong to the wallet's ACTIVE network only — filing them
    // under both network keys would hand a dApp testnet addresses labeled
    // mainnet (or vice versa). `network` records the grant's network so the
    // sign flow can reject a wrong-chain request.
    const sessionData = {
      origin,
      connected: true,
      network: networkType,
      address: {
        [networkType]: {
          receiving: ml.mlReceivingAddresses,
          change: ml.mlChangeAddresses,
        },
      },
      addressesByChain: {
        mintlayer: {
          receiving: ml.mlReceivingAddresses,
          change: ml.mlChangeAddresses,
          publicKeys: {
            receiving: ml.mlReceivingPublicKeys?.map(toHexString) ?? [],
            change: ml.mlChangePublicKeys?.map(toHexString) ?? [],
          },
        },
        ...(includeBitcoin && {
          bitcoin: {
            receiving: btcReceiving
              .map(BTC.getBtcAddressString)
              .filter(Boolean),
            change: btcChange.map(BTC.getBtcAddressString).filter(Boolean),
            publicKeys: {
              receiving: btcReceiving.map(btcPubKeyOf).filter(Boolean),
              change: btcChange.map(btcPubKeyOf).filter(Boolean),
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

          {!hasWalletAddresses && (
            <p
              className={styles.warning}
              data-testid="incomplete-data-warning"
            >
              Wallet data incomplete — unlock your wallet and try again
            </p>
          )}

          <p className={styles.disclaimer}>
            Only connect to websites you trust. You can reject this request and
            nothing will be shared.
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            onClickHandle={handleReject}
            extraStyleClasses={connectButtonExtraStyles}
            dataTestId="reject-button"
            alternate
          >
            Reject
          </Button>
          <Button
            onClickHandle={handleConnect}
            extraStyleClasses={connectButtonExtraStyles}
            disabled={!hasWalletAddresses}
            dataTestId="connect-button"
          >
            Connect
          </Button>
        </div>
      </form>
    </PageWrapper>
  )
}

export default ConnectionPage
