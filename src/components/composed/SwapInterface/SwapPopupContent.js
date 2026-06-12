import React, { useState } from 'react'
import { SwapTokenLogo } from '@BasicComponents'
import { ML } from '@Helpers'

import styles from './SwapPopupContent.module.css'

const SwapPopupContent = ({ tokens, coin, handleTokenChange, mode }) => {
  const [search, setSearch] = useState('')

  // Filter tokens by symbol or token_id (case-insensitive)
  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol?.toLowerCase().includes(search.toLowerCase()) ||
      token.token_id?.toLowerCase().includes(search.toLowerCase()),
  )
  const title = mode === 'from' ? 'Swap from' : 'Swap to'

  return (
    <div
      className={styles.popup}
      data-testid="swap-popup-content"
    >
      <h2 data-testid="swap-popup-title">{title}</h2>
      <input
        type="text"
        placeholder="Search by symbol or token id"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchInput}
      />
      <ul
        className={styles.tokenList}
        data-testid="swap-token-list"
      >
        <li
          onClick={() => {
            handleTokenChange(coin)
          }}
          className={styles.tokenItem}
          key={coin.coin}
        >
          <SwapTokenLogo />
          ML Coins
        </li>
        {filteredTokens.map((token, index) => (
          <li
            key={token.token_id || `token-${index}`}
            onClick={() => {
              handleTokenChange(token)
            }}
            className={styles.tokenItem}
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
