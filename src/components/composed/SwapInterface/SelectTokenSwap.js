import { SwapTokenLogo } from '@BasicComponents'
import { ML } from '@Helpers'
import { ReactComponent as ChevronDownIcon } from '@Assets/images/icon-chevron-down.svg'

import './SelectTokenSwap.css'

const SelectTokenSwap = ({ token, onClick }) => {
  return (
    <div className="swap-select-wrapper">
      <div
        className="swap-token-select"
        onClick={onClick}
      >
        <SwapTokenLogo
          tokenId={token.token_id}
          ticker={token.symbol}
        />
        {token.type !== 'Coin'
          ? `${token.symbol} (${ML.formatAddress(token.token_id, 16)})`
          : 'ML (Mintlayer)'}
      </div>
      <ChevronDownIcon className="icon-chevron-down" />
    </div>
  )
}

export default SelectTokenSwap
