import React, { useNavigate, useParams } from 'react-router-dom'
import { useContext, useState } from 'react'

import { Balance, PopUp } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'

import {
  useExchangeRates,
  useBtcWalletInfo,
  useMlWalletInfo,
  useMediaQuery,
} from '@Hooks'
import { AccountContext, SettingsContext } from '@Contexts'
import { BTC } from '@Helpers'
import { AppInfo } from '@Constants'

import './Wallet.css'
import { StakingWarning } from '../../components/composed/StakingWarning/StakingWarning'

const ActionButtons = ({ data }) => {
  return (
    <div className="transactions-buttons-wrapper">
      {data.walletType.name === 'Mintlayer' && (
        <>
          <StakingWarning addressList={data.currentMlAddresses} />
          <Wallet.TransactionButton
            title={'Staking'}
            mode={'staking'}
            onClick={data.setOpenStaking}
          />
          <Wallet.TransactionButton
            title={'Sign/Verify'}
            mode={'sign'}
            onClick={data.setOpenSignPage}
          />
          <Wallet.TransactionButton
            title={'Nft'}
            mode={'nft'}
            onClick={data.setOpenNftPage}
          />
        </>
      )}
      <Wallet.TransactionButton
        title={'Send'}
        mode={'up'}
        onClick={data.setOpenTransactionForm}
      />
      <Wallet.TransactionButton
        title={'Receive'}
        onClick={() => data.setOpenShowAddress(true)}
      />
      {data.openShowAddress && (
        <PopUp setOpen={data.setOpenShowAddress}>
          <Wallet.ShowAddress
            address={data.walletAddress}
            unusedAddress={data.unusedAddresses?.receive}
            transactions={data.walletTransactionList}
          ></Wallet.ShowAddress>
        </PopUp>
      )}
    </div>
  )
}

const WalletPage = () => {
  const navigate = useNavigate()

  const { coinType } = useParams()
  const walletType = {
    name: coinType,
    ticker: coinType === 'Bitcoin' ? 'BTC' : 'ML',
    chain: coinType === 'Bitcoin' ? 'bitcoin' : 'mintlayer',
  }

  const isExtendedView = useMediaQuery('(min-width: 801px)')

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
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses

  const checkAddresses =
    walletType.chain === 'bitcoin' ? btcAddress : currentMlAddresses

  const [openShowAddress, setOpenShowAddress] = useState(false)

  const { transactions, balance, lockedBalance, unusedAddresses } = datahook(
    checkAddresses,
    coinType,
  )

  const setOpenTransactionForm = () => {
    navigate('/wallet/' + walletType.name + '/send-transaction')
  }
  const setOpenStaking = () => {
    navigate('/wallet/' + walletType.name + '/staking')
  }
  const setOpenSignPage = () => {
    navigate('/wallet/' + walletType.name + '/sign-message')
  }
  const setOpenNftPage = () => {
    navigate('/wallet/' + walletType.name + '/nft')
  }

  const { exchangeRate } = useExchangeRates(
    walletType.ticker.toLowerCase(),
    'usd',
  )

  const mlAddress =
    currentMlAddresses && currentMlAddresses.mlReceivingAddresses[0]

  const walletBalance = balance
  const walletBalanceLocked = lockedBalance || 0
  const walletAddress = walletType.name === 'Bitocin' ? btcAddress : mlAddress
  const walletTransactionList = transactions

  const actionButtonData = {
    walletType,
    currentMlAddresses,
    setOpenStaking,
    setOpenTransactionForm,
    setOpenShowAddress,
    setOpenSignPage,
    setOpenNftPage,
    openShowAddress,
    walletAddress,
    unusedAddresses,
    walletTransactionList,
  }

  return (
    <div
      className="wallet-page"
      data-testid="wallet-page"
    >
      <VerticalGroup
        bigGap
        grow
      >
        <div className="balance-transactions-wrapper">
          <Balance
            balance={walletBalance}
            balanceLocked={walletBalanceLocked}
            exchangeRate={exchangeRate}
            walletType={walletType}
          />
          {!isExtendedView && <ActionButtons data={actionButtonData} />}
        </div>
        {isExtendedView && <ActionButtons data={actionButtonData} />}
        <Wallet.TransactionsList
          transactionsList={walletTransactionList}
          getConfirmations={BTC.getConfirmationsAmount}
        />
      </VerticalGroup>
    </div>
  )
}

export default WalletPage
