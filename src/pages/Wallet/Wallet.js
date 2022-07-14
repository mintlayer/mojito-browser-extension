import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { Balance, Header, PopUp } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'

import { AccountContext } from '@Contexts'
import { BTC } from '@Cryptos'
import { BTC as BTCHelper } from '@Helpers'
import { Electrum } from '@APIs'

import './Wallet.css'

const WalletPage = () => {
  const effectCalled = useRef(false)
  const { btcAddress } = useContext(AccountContext)
  const [openShowAddress, setOpenShowAddress] = useState(false)
  const [transactionsList, setTransactionsList] = useState([])
  const [balance, setBalance] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true

    const getTransactions = async () => {
      try {
        const response = await Electrum.getAddressTransactions(btcAddress)
        const transactions = JSON.parse(response)
        const parsedTransactions = BTC.getParsedTransactions(
          transactions,
          btcAddress,
        )
        setTransactionsList(parsedTransactions)

        const utxos = await Electrum.getAddressUtxo(btcAddress)
        const satoshiBalance = BTC.calculateBalanceFromUtxoList(
          JSON.parse(utxos),
        )
        setBalance(
          BTCHelper.formatBTCValue(BTC.convertSatoshiToBtc(satoshiBalance)),
        )
      } catch (error) {
        console.log(error, 'error')
      }
    }
    getTransactions()
  }, [btcAddress])

  const setOpenTransactionForm = () => navigate('/send-transaction')

  return (
    <div data-testid="wallet-page">
      <VerticalGroup bigGap>
        <Header noBackButton />
        <div className="balance-transactions-wrapper">
          <Balance balance={balance} />
          <div className="transactions-buttons-wrapper">
            <Wallet.TransactionButton
              title={'Send'}
              up
              onClick={setOpenTransactionForm}
            />
            <Wallet.TransactionButton
              title={'Receive'}
              onClick={() => setOpenShowAddress(true)}
            />
            {openShowAddress && (
              <PopUp setOpen={setOpenShowAddress}>
                <Wallet.ShowAddress address={btcAddress}></Wallet.ShowAddress>
              </PopUp>
            )}
          </div>
        </div>
        <Wallet.TransactionsList
          transactionsList={transactionsList}
          getConfirmations={BTC.getConfirmationsAmount}
        />
      </VerticalGroup>
    </div>
  )
}
export default WalletPage
