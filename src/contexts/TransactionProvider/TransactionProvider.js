import React, { createContext, useState } from 'react'

const TransactionContext = createContext()

const TransactionProvider = ({ value: propValue, children }) => {
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [feeLoading, setFeeLoading] = useState(false)
  const [delegationsLoading, setDelegationsLoading] = useState(false)
  const [transactionMode, setTransactionMode] = useState('transaction')
  const [delegationStep, setDelegationStep] = useState(1)
  const [currentDelegationInfo, setCurrentDelegationInfo] = useState({})

  const value = {
    transactionsLoading,
    setTransactionsLoading,
    feeLoading,
    setFeeLoading,
    delegationsLoading,
    setDelegationsLoading,
    transactionMode,
    setTransactionMode,
    delegationStep,
    setDelegationStep,
    currentDelegationInfo,
    setCurrentDelegationInfo,
  }

  return (
    <TransactionContext.Provider value={propValue || value}>
      {children}
    </TransactionContext.Provider>
  )
}

export { TransactionContext, TransactionProvider }
