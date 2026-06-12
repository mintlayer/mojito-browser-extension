import { SwapTokenLogo } from '@BasicComponents'
import { ML } from '@Helpers'
import { ReactComponent as ChevronDownIcon } from '@Assets/images/icon-chevron-down.svg'

import styles from './SelectTokenSwap.module.css'

const SelectTokenSwap = ({ token, onClick }) => {
  return (
    <div
      className={styles.selectWrapper}
      data-testid="select-token-swap"
    >
      <div
        className={styles.tokenSelect}
        onClick={onClick}
        data-testid="select-token-swap-content"
      >
        <SwapTokenLogo
          tokenId={token.token_id}
          ticker={token.symbol}
        />
        {token.type !== 'Coin'
          ? `${token.symbol} (${ML.formatAddress(token.token_id, 16)})`
          : 'ML (Mintlayer)'}
      </div>
      <ChevronDownIcon
        className={styles.chevronIcon}
        data-testid="chevron-down-icon"
      />
    </div>
  )
}

export default SelectTokenSwap
