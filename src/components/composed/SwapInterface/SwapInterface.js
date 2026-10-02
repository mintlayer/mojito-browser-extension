import React, { useState, useContext } from 'react'
import { Button, Error } from '@BasicComponents'
import { PopUp } from '@ComposedComponents'
import { MintlayerContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow-down.svg'
import { ReactComponent as SearchIcon } from '@Assets/images/icon-search.svg'

import SwapPopupContent from './SwapPopupContent'
import SelectTokenSwap from './SelectTokenSwap'

import styles from './SwapInterface.module.css'

const SwapInterface = () => {
  const { tokenBalances, balance, allNetworkTokensData, fetchOrdersPairInfo } =
    useContext(MintlayerContext)
  const { networkType } = useContext(SettingsContext)
  const [amount, setAmount] = useState('')
  const [tokenToPopupOpen, setTokenToPopupOpen] = useState(false)
  const [tokenFromPopupOpen, setTokenFromPopupOpen] = useState(false)
  const coinTicker = networkType === 'testnet' ? 'TML' : 'ML'
  const coinData = {
    type: 'Coin',
    balance: balance,
  }

  const walletTokens = Object.values(tokenBalances).map((tb) => ({
    type: 'Token',
    balance: tb.balance,
    number_decimals: tb.token_info.number_of_decimals,
    symbol: tb.token_info.token_ticker.string,
    token_id: tb.token_info.token_id,
  }))

  const [fromToken, setFromToken] = useState(coinData)
  const [toToken, setToToken] = useState(undefined)
  const [amountError, setAmountError] = useState(false)

  // Tokens load async into the provider — fall back to the first available one
  const activeToToken = toToken ?? allNetworkTokensData[0]

  const handleToTokenClick = () => {
    setTokenToPopupOpen(true)
  }

  const handleFromTokenClick = () => {
    setTokenFromPopupOpen(true)
  }

  const handleFromTokenChange = (token) => {
    setFromToken(token)
    setTokenFromPopupOpen(false)
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setAmountError(Boolean(value) && !AppInfo.amountRegex.test(value))
    }
  }

  const handleToTokenChange = (token) => {
    setToToken(token)
    setTokenToPopupOpen(false)
  }

  const handleSwapDirection = () => {
    if (!activeToToken) return
    setFromToken(activeToToken)
    setToToken(fromToken)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (amount && !AppInfo.amountRegex.test(amount)) {
      setAmountError(true)
      console.error('Invalid amount')
      return
    }
    if (!activeToToken) return
    if (fromToken.type === 'Coin' && activeToToken.type === 'Coin') {
      console.error('Cannot swap between coins directly')
      return
    }
    if (fromToken.token_id === activeToToken.token_id) {
      console.error('Cannot swap the same token')
      return
    }

    let pair = `${fromToken.token_id}_${activeToToken.token_id}`
    if (fromToken.type === 'Coin') {
      pair = `${coinTicker}_${activeToToken.token_id}`
    }

    if (activeToToken.type === 'Coin') {
      pair = `${fromToken.token_id}_${coinTicker}`
    }

    try {
      const result = await fetchOrdersPairInfo(pair, amount)
      return result
    } catch (error) {
      console.error('Error fetching orders:', error)
      return []
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <h3 className={styles.label}>Swap From</h3>
        <div className={styles.inputsWrapper}>
          <SelectTokenSwap
            token={fromToken}
            onClick={handleFromTokenClick}
          />
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={handleInputChange}
            className={styles.amountInput}
            id="swap-amount-input"
          />
        </div>
        <p className={styles.balance}>
          Balance: {fromToken.balance}{' '}
          {fromToken.symbol || (fromToken.type === 'Coin' ? coinTicker : '')}
        </p>
        {amountError && (
          <Error error="Amount format is invalid. Use 0.00 instead." />
        )}
      </div>

      <div className={styles.arrowRow}>
        <Button
          extraStyleClasses={[styles.arrowButton]}
          onClickHandle={handleSwapDirection}
        >
          <ArrowIcon className={styles.arrowIcon} />
        </Button>
      </div>
      <div className={styles.row}>
        <h3 className={styles.label}>Swap To</h3>
        <div className={styles.inputsWrapper}>
          {activeToToken && (
            <SelectTokenSwap
              token={activeToToken}
              onClick={handleToTokenClick}
            />
          )}
          <Button
            onClickHandle={handleSubmit}
            disabled={!fromToken || !activeToToken}
            extraStyleClasses={[styles.findButton]}
          >
            <SearchIcon className={styles.findOrderIcon} />
            Find orders
          </Button>
        </div>
      </div>

      {tokenFromPopupOpen && (
        <PopUp setOpen={setTokenFromPopupOpen}>
          <SwapPopupContent
            coin={coinData}
            tokens={walletTokens}
            handleTokenChange={handleFromTokenChange}
            mode="from"
          />
        </PopUp>
      )}
      {tokenToPopupOpen && (
        <PopUp setOpen={setTokenToPopupOpen}>
          <SwapPopupContent
            coin={coinData}
            tokens={allNetworkTokensData}
            handleTokenChange={handleToTokenChange}
            mode="to"
          />
        </PopUp>
      )}
    </form>
  )
}

export default SwapInterface
