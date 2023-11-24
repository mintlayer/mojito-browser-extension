import React, { useNavigate } from 'react-router-dom'
import { useState, useContext } from 'react'

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
  const { addresses, walletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const currentBtcAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress

  // TODO: has to be changed to use all addresses
  const getCurrentMlAddress = (addresses, networkType) => {
    const getFirstAddress = (addressList) =>
      addressList ? addressList[0] : false

    const mlTestnetAddress = getFirstAddress(addresses.mlTestnetAddresses)
    const mlMainnetAddress = getFirstAddress(addresses.mlMainnetAddresses)

    return networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? mlMainnetAddress
      : mlTestnetAddress
  }
  const currentMlAddress = getCurrentMlAddress(addresses, networkType)

  const [openShowAddress, setOpenShowAddress] = useState(false)
  const { btcTransactionsList, btcBalance } =
    useBtcWalletInfo(currentBtcAddress)
  const { mlTransactionsList, mlBalance } = useMlWalletInfo(currentMlAddress)
  const { exchangeRate: btcExchangeRate } = useExchangeRates('btc', 'usd')
  const { exchangeRate: mlExchangeRate } = useExchangeRates('ml', 'usd')

  const setOpenTransactionForm = () => navigate('/send-transaction')

  const walletExangeRate =
    walletType.name === 'Mintlayer' ? mlExchangeRate : btcExchangeRate
  const walletBalance = walletType.name === 'Mintlayer' ? mlBalance : btcBalance
  const walletAddress =
    walletType.name === 'Mintlayer' ? currentMlAddress : currentBtcAddress
  const walletTransactionList =
    walletType.name === 'Mintlayer' ? mlTransactionsList : btcTransactionsList

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
