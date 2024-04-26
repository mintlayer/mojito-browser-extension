import React, { useNavigate, useParams } from 'react-router-dom'
import { useContext, useState } from 'react'

import { Balance, Header, PopUp } from '@ComposedComponents'
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
    ticker: coinType === 'Mintlayer' ? 'ML' : 'BTC',
    network: coinType === 'Bitcoin' ? 'bitcoin' : 'mintlayer',
  }
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
  const [openShowAddress, setOpenShowAddress] = useState(false)
  const { btcTransactionsList, btcBalance } = useBtcWalletInfo(btcAddress)
  const { mlTransactionsList, mlBalance, mlBalanceLocked } =
    useMlWalletInfo(currentMlAddresses)

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

  const walletBalance = walletType.name === 'Mintlayer' ? mlBalance : btcBalance
  const walletBalanceLocked =
    walletType.name === 'Mintlayer' ? mlBalanceLocked : 0
  const walletAddress = walletType.name === 'Mintlayer' ? mlAddress : btcAddress
  const walletTransactionList =
    walletType.name === 'Mintlayer' ? mlTransactionsList : btcTransactionsList

  const backToDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <div data-testid="wallet-page">
      <VerticalGroup bigGap>
        <Header customBackAction={backToDashboard} />
        <div className="balance-transactions-wrapper">
          <Balance
            balance={walletBalance}
            balanceLocked={walletBalanceLocked}
            exchangeRate={exchangeRate}
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
