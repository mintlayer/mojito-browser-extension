import React, { useNavigate } from 'react-router-dom'
import { useState, useContext } from 'react'

import { Balance, Header, PopUp } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'

import { useExchangeRates, useWalletInfo } from '@Hooks'
import { AccountContext } from '@Contexts'
import { BTC } from '@Helpers'

import './Wallet.css'

const WalletPage = () => {
  const navigate = useNavigate()
  const { btcAddresses, nextAddress } = useContext(AccountContext)

  const [openShowAddress, setOpenShowAddress] = useState(false)
  const { transactionsList, balance } = useWalletInfo(btcAddresses)
  const { exchangeRate } = useExchangeRates('btc', 'usd')

  const setOpenTransactionForm = () => navigate('/send-transaction')

  return (
    <div data-testid="wallet-page">
      <VerticalGroup bigGap>
        <Header />
        <div className="balance-transactions-wrapper">
          <Balance
            balance={balance}
            exchangeRate={exchangeRate}
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
                <Wallet.ShowAddress address={nextAddress}></Wallet.ShowAddress>
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
