import React, { useNavigate } from 'react-router-dom'
import { useState, useContext } from 'react'

import { Balance, Header, PopUp } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'

import { useExchangeRates, useBtcWalletInfo, useMlWalletInfo } from '@Hooks'
import { AccountContext } from '@Contexts'
import { BTC } from '@Helpers'

import './Wallet.css'

const WalletPage = () => {
  const navigate = useNavigate()
  const { btcAddress, mlAddress, walletType } = useContext(AccountContext)

  const [openShowAddress, setOpenShowAddress] = useState(false)
  const { btcTransactionList, btcBalance } = useBtcWalletInfo(btcAddress)
  const { mlTransactionsList, mlBalance } = useMlWalletInfo(mlAddress)
  const { exchangeRate: btcExchangeRate } = useExchangeRates('btc', 'usd')
  const { exchangeRate: mlExchangeRate } = useExchangeRates('ml', 'usd')

  const setOpenTransactionForm = () => navigate('/send-transaction')

  const walletExangeRate =
    walletType.name === 'Mintlayer' ? mlExchangeRate : btcExchangeRate
  const walletBalance = walletType.name === 'Mintlayer' ? mlBalance : btcBalance
  const walletAddress = walletType.name === 'Mintlayer' ? mlAddress : btcAddress
  const walletTransactionList =
    walletType.name === 'Mintlayer' ? mlTransactionsList : btcTransactionList

  return (
    <div data-testid="wallet-page">
      <VerticalGroup bigGap>
        <Header />
        <div className="balance-transactions-wrapper">
          <Balance
            balance={walletBalance}
            exchangeRate={walletExangeRate}
          />
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
                <Wallet.ShowAddress
                  address={walletAddress}
                ></Wallet.ShowAddress>
              </PopUp>
            )}
          </div>
        </div>
        <Wallet.TransactionsList
          transactionsList={walletTransactionList}
          getConfirmations={BTC.getConfirmationsAmount}
        />
      </VerticalGroup>
    </div>
  )
}

export default WalletPage
