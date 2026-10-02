import React, { useContext } from 'react'
import Decimal from 'decimal.js'
import { MintlayerContext } from '@Contexts'
import { useStyleClasses } from '@Hooks'

import { ReactComponent as SwapIcon } from '@Assets/images/icon-swap.svg'

import './TransactionAmount.css'

const formatAmount = (value) =>
  new Decimal(String(value))
    .toFixed(11)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '')

const TransactionAmount = ({ transaction, title, extraStyleClasses = [] }) => {
  const classesList = ['transaction-amount', ...extraStyleClasses]
  const { styleClasses } = useStyleClasses(classesList)
  const { tokenMap } = useContext(MintlayerContext)
  const isSwap = transaction.type === 'FillOrder'

  return (
    <>
      {isSwap ? (
        <div
          className={styleClasses}
          data-testid="transaction-amount"
        >
          <div data-testid="transaction-amount-from">
            <span>{transaction.value?.from?.amount || ''}</span>{' '}
            <span>
              {tokenMap[transaction.value?.from?.token_id] || 'Token'}
            </span>
          </div>
          <SwapIcon
            className="balance-swap-icon"
            data-testid="swap-icon"
          />
          <div data-testid="transaction-amount-to">
            <span>{transaction.value?.to?.amount}</span>{' '}
            <span>{tokenMap[transaction.value?.to?.token_id] || 'Token'}</span>
          </div>
        </div>
      ) : (
        <p
          className="transaction-amount"
          data-testid="transaction-amount"
        >
          {title && title}{' '}
          {transaction.value && formatAmount(transaction.value)}
        </p>
      )}
    </>
  )
}

export default TransactionAmount
