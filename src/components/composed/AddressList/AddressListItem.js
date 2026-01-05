import { useContext, useState } from 'react'
import { SettingsContext } from '@Contexts'
import { ML, BTC } from '@Helpers'
import { Button } from '@BasicComponents'
import { PopUp } from '@ComposedComponents'
import { Wallet } from '@ContainerComponents'
import { ReactComponent as IconQr } from '@Assets/images/icons-qr.svg'
import { useParams } from 'react-router'

import './AddressListItem.css'

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

  const toggleTokens = () => {
    setTokensExpanded(!tokensExpanded)
  }

  const ticker = isBitcoin ? 'BTC' : 'ML'

  return (
    <tr
      className="address-row"
      data-testid={`address-row-${index}`}
    >
      <td className="address-cell">
        <div className="address-content">
          <span
            className="address-value"
            title={address.id}
          >
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ML.formatAddress(address.id, 18)}
            </a>
          </span>
          <Button
            extraStyleClasses={['qr-button']}
            onClickHandle={() => setOpenShowAddress(true)}
          >
            <IconQr className="icon-qr" />
          </Button>
        </div>
      </td>
      <td className="used-cell">
        <span className={`used-status ${address.used ? 'used' : 'unused'}`}>
          {address.used ? 'Used' : 'Unused'}
        </span>
      </td>
      <td className="balance-cell">
        <div className="balance-content">
          <span className="balance-value">
            {address.coin_balance.available || '0.00'} {ticker}
          </span>

          {address.coin_balance.locked > 0 && (
            <span className="locked-balance">
              (Locked: {address.coin_balance.locked} {ticker})
            </span>
          )}

          {hasTokens && (
            <div className="tokens-section">
              <button
                className={`tokens-toggle ${tokensExpanded ? 'expanded' : 'collapsed'}`}
                onClick={toggleTokens}
                type="button"
              >
                <span className="tokens-count">
                  {address.tokens.length} token
                  {address.tokens.length !== 1 ? 's' : ''}
                </span>
                <span className="toggle-icon">
                  {tokensExpanded ? '▼' : '▶'}
                </span>
              </button>

              {/* Tokens list - shown when expanded */}
              {tokensExpanded && (
                <div
                  className={`tokens-list ${tokensExpanded ? 'tokens-list-expanded' : 'tokens-list-collapsed'}`}
                >
                  {address.tokens.map((token, tokenIndex) => (
                    <div
                      key={tokenIndex}
                      className="token-item"
                    >
                      <span className="token-amount">
                        {token.amount.decimal || '0.00'}
                      </span>
                      <span className="token-id">
                        ({ML.formatAddress(token.token_id, 12)})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </td>
      {openShowAddress && (
        <PopUp setOpen={setOpenShowAddress}>
          <Wallet.ShowAddress address={address.id}></Wallet.ShowAddress>
        </PopUp>
      )}
    </tr>
  )
}

export default AddressListItem
