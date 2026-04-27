import { useContext, useState } from 'react'
import Decimal from 'decimal.js'
import { SettingsContext } from '@Contexts'
import { ML, BTC } from '@Helpers'
import { Button } from '@BasicComponents'
import { PopUp } from '@ComposedComponents'
import { Wallet } from '@ContainerComponents'
import { ReactComponent as IconQr } from '@Assets/images/icons-qr.svg'
import { useParams } from 'react-router'

import styles from './AddressListItem.module.css'

const formatTokenAmount = (value) => {
  const d = new Decimal(value || 0)
  return d.isInteger() ? d.toFixed(0) : d.toFixed(4)
}

const AddressListItem = ({ address, index }) => {
  const { networkType } = useContext(SettingsContext)
  const [tokensExpanded, setTokensExpanded] = useState(false)
  const [openShowAddress, setOpenShowAddress] = useState(false)
  const { coinType } = useParams()
  const isBitcoin = coinType === 'Bitcoin'

  const explorerLink = isBitcoin
    ? BTC.getBtcAddressLink(address.id, networkType)
    : ML.getMlAddressLink(address.id, networkType)
  const hasTokens = address.tokens && address.tokens.length > 0

  const ticker = isBitcoin ? 'BTC' : 'ML'
  const hasBalance =
    address.coin_balance.available && Number(address.coin_balance.available) > 0

  return (
    <>
      <tr
        className={`${styles.row} ${address.used ? styles.rowUsed : ''}`}
        data-testid={`address-row-${index}`}
      >
        <td className={`${styles.cell} ${styles.colAddress}`}>
          <a
            className={styles.addressValue}
            href={explorerLink}
            target="_blank"
            rel="noopener noreferrer"
            title={address.id}
          >
            {ML.formatAddress(address.id, 18)}
          </a>
        </td>
        <td className={`${styles.cell} ${styles.colStatus}`}>
          <span
            className={`${styles.statusBadge} ${address.used ? styles.statusUsed : styles.statusUnused}`}
          >
            {address.used ? 'Used' : 'Unused'}
          </span>
        </td>
        <td className={`${styles.cell} ${styles.colBalance}`}>
          {hasBalance ? (
            <span className={styles.balanceAmount}>
              <strong>{address.coin_balance.available}</strong>{' '}
              <span className={styles.balanceTicker}>{ticker}</span>
            </span>
          ) : address.used && Number(address.coin_balance.available) === 0 ? (
            <span className={styles.balanceAmount}>
              0 <span className={styles.balanceTicker}>{ticker}</span>
            </span>
          ) : (
            <span className={styles.balanceDash}>&mdash;</span>
          )}

          {address.coin_balance.locked > 0 && (
            <span className={styles.lockedBalance}>
              (Locked: {address.coin_balance.locked} {ticker})
            </span>
          )}

          {hasTokens && (
            <div className={styles.tokensSection}>
              <button
                className={
                  tokensExpanded
                    ? styles.tokensToggleExpanded
                    : styles.tokensToggle
                }
                onClick={() => setTokensExpanded(!tokensExpanded)}
                type="button"
              >
                <span className={styles.tokensCount}>
                  {address.tokens.length} token
                  {address.tokens.length !== 1 ? 's' : ''}
                </span>
                <span className={styles.toggleIcon}>
                  {tokensExpanded ? '\u25BC' : '\u25B6'}
                </span>
              </button>

              {tokensExpanded && (
                <div className={styles.tokensList}>
                  {address.tokens.map((token, tokenIndex) => (
                    <div
                      key={tokenIndex}
                      className={styles.tokenItem}
                    >
                      <span className={styles.tokenAmount}>
                        {formatTokenAmount(token.amount.decimal)}
                      </span>
                      <span className={styles.tokenId}>
                        ({ML.formatAddress(token.token_id, 12)})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </td>
        <td className={`${styles.cell} ${styles.colAction}`}>
          <Button
            extraStyleClasses={[styles.qrButton]}
            onClickHandle={() => setOpenShowAddress(true)}
          >
            <IconQr />
          </Button>
        </td>
      </tr>
      {openShowAddress && (
        <PopUp setOpen={setOpenShowAddress}>
          <Wallet.ShowAddress address={address.id}></Wallet.ShowAddress>
        </PopUp>
      )}
    </>
  )
}

export default AddressListItem
