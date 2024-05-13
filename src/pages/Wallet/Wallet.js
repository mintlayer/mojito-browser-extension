import React, { useNavigate, useParams } from 'react-router-dom'
import { useContext, useState } from 'react'

import { Balance, PopUp } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'

import { useExchangeRates, useBtcWalletInfo, useMlWalletInfo } from '@Hooks'
import { AccountContext, SettingsContext } from '@Contexts'
import { BTC } from '@Helpers'
import { AppInfo } from '@Constants'

import './Wallet.css'

const WalletPage = () => {
  const navigate = useNavigate()

  const { coinType } = useParams()
  const walletType = {
    name: coinType,
    ticker: coinType === 'Bitcoin' ? 'BTC' : 'ML',
    chain: coinType === 'Bitcoin' ? 'bitcoin' : 'mintlayer',
  }

  const datahook =
    walletType.chain === 'bitcoin' ? useBtcWalletInfo : useMlWalletInfo

  const { addresses } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const btcAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddresses

  const checkAddresses =
    walletType.chain === 'bitcoin' ? btcAddress : currentMlAddresses

  const [openShowAddress, setOpenShowAddress] = useState(false)

  const { transactions, balance, lockedBalance } = datahook(
    checkAddresses,
    coinType,
  )

  const setOpenTransactionForm = () => {
    navigate('/wallet/' + walletType.name + '/send-transaction')
  }
  const setOpenStaking = () => {
    navigate('/wallet/' + walletType.name + '/staking')
  }

  const { exchangeRate } = useExchangeRates(
    walletType.ticker.toLowerCase(),
    'usd',
  )

  const mlAddress =
    currentMlAddresses && currentMlAddresses.mlReceivingAddresses[0]

  const walletBalance = balance
  const walletBalanceLocked = lockedBalance || 0
  const walletAddress = walletType.name === 'Mintlayer' ? mlAddress : btcAddress
  const walletTransactionList = transactions

  return (
    <div data-testid="wallet-page">
      <VerticalGroup bigGap>
        <div className="balance-transactions-wrapper">
          <Balance
            balance={walletBalance}
            balanceLocked={walletBalanceLocked}
            exchangeRate={exchangeRate}
            walletType={walletType}
          />
          <div className="transactions-buttons-wrapper">
            {walletType.name === 'Mintlayer' && (
              <Wallet.TransactionButton
                title={'Staking'}
                mode={'staking'}
                onClick={setOpenStaking}
              />
            )}
            <Wallet.TransactionButton
              title={'Send'}
              mode={'up'}
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
