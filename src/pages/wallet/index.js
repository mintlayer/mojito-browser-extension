import { useState, useEffect, useContext, useCallback, useRef } from 'react'
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
import { Context } from '../../ContextProvider'
import './wallet.css'
import Popup from '../../commons/components/popup/popup'
import ShowAddress from '../../commons/components/show-address'

const WalletPage = () => {
  const effectCalled = useRef(false)
  const { btcAddress } = useContext(Context)
  const [openShowAddress, setOpenShowAddress] = useState(false)
  const [transactionsList, setTransactionsList] = useState([])

  const getTransactions = useCallback(async () => {
    if (!btcAddress) return
    try {
      const response = await getAddressTransactions(btcAddress)
      const transactions = JSON.parse(response)
      const parsedTransactions = getParsedTransactions(transactions, btcAddress)
      setTransactionsList(parsedTransactions)
    } catch (error) {
      console.log(error, 'error')
    }
  }, [btcAddress])

  const balance = calculateBalanceFromUtxoList(transactionsList)

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true

    getTransactions()
  }, [getTransactions])

  return (
    <div data-testid="wallet-page">
      <VerticalGroup bigGap>
        <Header noBackButton />
        <div className="balance-transactions-wrapper">
          <Balance balance={balance} />
          <div className="transactions-buttons-wrapper">
            <TransactionButton
              title={'Send'}
              up
            />
            <TransactionButton
              title={'Receive'}
              onClick={() => setOpenShowAddress(true)}
            />
            {openShowAddress && (
              <Popup setOpen={() => setOpenShowAddress(false)}>
                <ShowAddress address={btcAddress}></ShowAddress>
              </Popup>
            )}
          </div>
        </div>
        <TransactionsList transactionsList={transactionsList} />
      </VerticalGroup>
    </div>
  )
}
export default WalletPage
