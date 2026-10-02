import { useContext, useState } from 'react'
import { useLocation } from 'react-router'

import {
  PageWrapper,
  Seg,
  ChainBadge,
  QrPlaceholder,
  QrCode,
  Tag,
  Button,
} from '@BasicComponents'
import { CopyButton } from '@ComposedComponents'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { BTC } from '@Helpers'

import styles from './ReceivePage.module.css'

const CHAINS = ['Bitcoin', 'Mintlayer']
const DEFAULT_CHAIN = 'Mintlayer'

/**
 * Receive screen from the design (doc/ be-send.jsx ReceiveScreenBE).
 * Real addresses and a real QR; the chain is seeded from the navigation
 * state when the user arrives from a specific asset screen.
 */
const ReceivePage = () => {
  const { state } = useLocation()
  const { addresses } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const [chain, setChain] = useState(
    CHAINS.includes(state?.chain) ? state.chain : DEFAULT_CHAIN,
  )

  const isBtc = chain === 'Bitcoin'
  const address = isBtc
    ? BTC.getBtcAddressString(
        addresses?.btcAddresses?.btcReceivingAddresses?.[0],
      ) || ''
    : addresses?.mlAddresses?.mlReceivingAddresses?.[0] || ''

  const copyAddress = () => {
    if (address) navigator.clipboard?.writeText(address)
  }

  return (
    <PageWrapper className={styles.pageWrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <span className={styles.title}>Receive</span>
        </div>
        <div className={styles.body}>
          <Seg
            value={chain}
            options={['Bitcoin', 'Mintlayer']}
            onChange={setChain}
          />

          <div className={styles.qrWrap}>
            {address ? (
              <QrCode
                value={address}
                size={172}
              />
            ) : (
              <QrPlaceholder
                size={172}
                label={`QR · ${chain} address`}
              />
            )}
          </div>

          <div className={styles.badges}>
            <ChainBadge chain={chain} />
            <Tag c="grey">
              {networkType === AppInfo.NETWORK_TYPES.TESTNET
                ? 'Testnet'
                : 'Mainnet'}
            </Tag>
          </div>

          <div className={styles.addressBox}>
            {address || 'Address unavailable — unlock your wallet'}
          </div>

          <div className={styles.actions}>
            <Button
              extraStyleClasses={[styles.primaryAction]}
              onClickHandle={copyAddress}
            >
              Copy address
            </Button>
            <CopyButton content={address} />
          </div>

          <div className={styles.hint}>
            {isBtc
              ? 'Native SegWit (bech32). A fresh address per payment protects your privacy.'
              : 'Use this address for ML and all Mintlayer tokens and NFTs.'}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default ReceivePage
