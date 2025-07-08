import React, { useState } from 'react'
import { SwapTokenLogo } from '@BasicComponents'
import { ML } from '@Helpers'

const SwapPopupContent = ({ tokens, coin, handleTokenChange }) => {
  const [search, setSearch] = useState('')

  // Filter tokens by symbol or token_id (case-insensitive)
  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      token.token_id?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="token-popup-swap">
      <h2>Swap from</h2>
      <input
        type="text"
        placeholder="Search by symbol or token id"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="swap-token-search-input"
      />
      <ul>
        <li
          onClick={() => {
            handleTokenChange(coin)
          }}
        >
          <SwapTokenLogo />
          ML Coins
        </li>
        {filteredTokens.map((token) => (
          <li
            key={token.token_id}
            onClick={() => {
              handleTokenChange(token)
            }}
          >
            <SwapTokenLogo
              tokenId={token.token_id}
              ticker={token.symbol}
            />
            {token.symbol} ({ML.formatAddress(token.token_id, 24)})
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SwapPopupContent
