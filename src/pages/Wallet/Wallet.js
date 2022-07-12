import { useState, useEffect, useContext, useRef } from 'react'

import { AccountContext } from '../../contexts/AccountProvider/AccountProvider'

import Balance from '../../components/composed/Balance/Balance'
import Header from '../../components/composed/Header/Header'
import Popup from '../../components/composed/PopUp/Popup'

import ShowAddress from '../../components/containers/Wallet/ShowAddress'
import TransactionButton from '../../components/containers/Wallet/TransactionButton'
import TransactionsList from '../../components/containers/Wallet/TransactionsList'

import VerticalGroup from '../../components/layouts/VerticalGroup/VerticalGroup'

import {
  getParsedTransactions,
  calculateBalanceFromUtxoList,
} from '../../services/Crypto/BTC/BTC'
import { getAddressTransactions } from '../../services/API/Electrum/Electrum'

import './Wallet.css'

const WalletPage = () => {
  const effectCalled = useRef(false)
  const { btcAddress } = useContext(AccountContext)
  const [openShowAddress, setOpenShowAddress] = useState(false)
  const [transactionsList, setTransactionsList] = useState([])
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true

    const getTransactions = async () => {
      try {
        const response = await getAddressTransactions(btcAddress)
        const transactions = JSON.parse(response)
        const parsedTransactions = getParsedTransactions(
          transactions,
          btcAddress,
        )
        setTransactionsList(parsedTransactions)
        setBalance(calculateBalanceFromUtxoList(parsedTransactions))
      } catch (error) {
        console.log(error, 'error')
      }
    }
    getTransactions()
  }, [btcAddress])

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
              <Popup setOpen={setOpenShowAddress}>
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
