import { useState, useEffect } from 'react'
import Header from '../../commons/components/advanced/header'
import Balance from '../../commons/components/balance/balance'
import TransactionButton from '../../commons/components/transaction-button/transactionButton'
import VerticalGroup from '../../commons/components/group/verticalGroup'
import TransactionsList from '../../commons/components/transactions-list/transactionsList'
import {
  getParsedTransactions,
  calculateBalanceFromUtxoList,
} from '../../commons/crypto/btc'
import { getAddressTransactions } from '../../commons/api/electrum'
import './wallet.css'

const WalletPage = () => {
  const wallet = 'n3GNqMveyvaPvUbH469vDRadqpJMPc84JA'
  const [transactionsList, setTransactionsList] = useState([])
  /* istanbul ignore next */
  const getTransactions = async () => {
    try {
      const response = await getAddressTransactions(wallet)
      const transactions = JSON.parse(response)
      const parsedTransactions = getParsedTransactions(transactions, wallet)
      setTransactionsList(parsedTransactions)
    } catch (error) {
      console.log(error, 'error')
    }
  }

  const balance = calculateBalanceFromUtxoList(transactionsList)

  useEffect(() => {
    getTransactions()
  }, [setTransactionsList])
  return (
    <div data-testid="wallet-page">
      <VerticalGroup bigGap>
        <Header />
        <div className="balance-transactions-wrapper">
          <Balance balance={balance} />
          <div className="transactions-buttons-wrapper">
            <TransactionButton
              title={'Send'}
              up
            />
            <TransactionButton title={'Receive'} />
          </div>
        </div>
        <TransactionsList transactionsList={transactionsList} />
      </VerticalGroup>
    </div>
  )
}
export default WalletPage
