import React, { useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'

import { Balance, Header, PopUp } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'

import { useExchangeRates, useBtcWalletInfo, useMlWalletInfo } from '@Hooks'
import { AccountContext, SettingsContext } from '@Contexts'
import { BTC } from '@Helpers'
import { AppInfo } from '@Constants'
import { LocalStorageService } from '@Storage'

import './Wallet.css'

const WalletPage = () => {
  const navigate = useNavigate()
  const { addresses, walletType } = useContext(AccountContext)
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
  const { exchangeRate: btcExchangeRate } = useExchangeRates('btc', 'usd')
  const { exchangeRate: mlExchangeRate } = useExchangeRates('ml', 'usd')

  const setOpenTransactionForm = () => navigate('/send-transaction')

  const walletExangeRate =
    walletType.name === 'Mintlayer' ? mlExchangeRate : btcExchangeRate

  const mlAddress =
    currentMlAddresses && currentMlAddresses.mlReceivingAddresses[0]

  const walletBalance = walletType.name === 'Mintlayer' ? mlBalance : btcBalance
  const walletBalanceLocked =
    walletType.name === 'Mintlayer' ? mlBalanceLocked : 0
  const walletAddress = walletType.name === 'Mintlayer' ? mlAddress : btcAddress
  const walletTransactionList =
    walletType.name === 'Mintlayer' ? mlTransactionsList : btcTransactionsList

  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
  const isUncofermedTransaction =
    LocalStorageService.getItem(unconfirmedTransactionString) &&
    walletType.name === 'Mintlayer'

  return (
    <div data-testid="wallet-page">
      <VerticalGroup bigGap>
        <Header />
        <div className="balance-transactions-wrapper">
          <Balance
            balance={walletBalance}
            balanceLocked={walletBalanceLocked}
            exchangeRate={walletExangeRate}
          />
          <div className="transactions-buttons-wrapper">
            <Wallet.TransactionButton
              title={'Send'}
              up
              onClick={setOpenTransactionForm}
              disabled={isUncofermedTransaction}
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
