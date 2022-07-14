import React, { useNavigate } from 'react-router-dom'
import { useState, useContext } from 'react'

import { Balance, Header, PopUp } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'

import { useWalletInfo } from '@Hooks'
import { AccountContext } from '@Contexts'
import { BTC } from '@Cryptos'

import './Wallet.css'

const WalletPage = () => {
  const navigate = useNavigate()
  const { btcAddress } = useContext(AccountContext)
  const [openShowAddress, setOpenShowAddress] = useState(false)

  const { transactionsList, balance } = useWalletInfo(btcAddress)

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
