import React, { useNavigate, useParams } from 'react-router'
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
import { AccountContext, MintlayerContext, BitcoinContext } from '@Contexts'
import { BTC } from '@Helpers'
import './Wallet.css'
import { StakingWarning } from '@ComposedComponents'

const ActionButtons = ({ data }) => {
  const { unusedAddresses: mintlayerUnusedAddresses } =
    useContext(MintlayerContext)
  const { unusedAddresses: bitcoinUnusedAddresses } = useContext(BitcoinContext)
  const requredAddress =
    data.walletType.name === 'Mintlayer'
      ? mintlayerUnusedAddresses.receive
      : bitcoinUnusedAddresses.receivingAddress.address
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
            title={'Sign'}
            mode={'sign'}
            onClick={data.setOpenSignPage}
          />
          <Wallet.TransactionButton
            title={'Nft'}
            mode={'nft'}
            onClick={data.setOpenNftPage}
          />
          <Wallet.TransactionButton
            title={'Swap'}
            mode={'swap'}
            onClick={data.setOpenSwapPage}
          />
        </>
      )}
      <Wallet.TransactionButton
        title={'Addresses'}
        onClick={data.setOpenAddressPage}
        mode={'addresses'}
      />
      {data.walletType.chain === 'mintlayer' && (
        <Wallet.TransactionButton
          title={'Send'}
          mode={'up'}
          onClick={data.setOpenMlTransactionForm}
        />
      )}

      {data.walletType.name === 'Bitcoin' && (
        <Wallet.TransactionButton
          title={'Send'}
          mode={'up'}
          onClick={data.setOpenBtcTransactionForm}
        />
      )}
      <Wallet.TransactionButton
        title={'Receive'}
        onClick={() => data.setOpenShowAddress(true)}
      />
      {data.openShowAddress && (
        <PopUp setOpen={data.setOpenShowAddress}>
          <Wallet.ShowAddress address={requredAddress}></Wallet.ShowAddress>
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
  const btcAddress = addresses.btcAddresses
  const currentMlAddresses = addresses.mlAddresses

  const checkAddresses =
    walletType.chain === 'bitcoin' ? btcAddress : currentMlAddresses

  const [openShowAddress, setOpenShowAddress] = useState(false)

  const { transactions, balance, lockedBalance, unusedAddresses } = datahook(
    checkAddresses,
    coinType,
  )

  const setOpenBtcTransactionForm = () => {
    navigate('/wallet/' + walletType.name + '/send-btc-transaction')
  }
  const setOpenMlTransactionForm = () => {
    navigate('/wallet/' + walletType.name + '/send-ml-transaction')
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
  const setOpenSwapPage = () => {
    navigate('/wallet/' + walletType.name + '/order-swap')
  }
  const setOpenAddressPage = () => {
    navigate('/wallet/' + walletType.name + '/address')
  }

  const { exchangeRate } = useExchangeRates(
    walletType.ticker.toLowerCase(),
    'usd',
  )

  const mlAddress =
    currentMlAddresses && currentMlAddresses.mlReceivingAddresses[0]

  const walletBalance = balance
  const walletBalanceLocked = lockedBalance || 0
  const walletAddress = walletType.name === 'Bitcoin' ? btcAddress : mlAddress
  const walletTransactionList = transactions

  const actionButtonData = {
    walletType,
    currentMlAddresses,
    setOpenStaking,
    setOpenBtcTransactionForm,
    setOpenMlTransactionForm,
    setOpenShowAddress,
    setOpenSignPage,
    setOpenNftPage,
    setOpenSwapPage,
    setOpenAddressPage,
    walletAddress,
    openShowAddress,
    unusedAddresses,
    walletTransactionList,
  }

  return (
    <div
      className="wallet-page"
      data-testid="wallet-page"
    >
      <VerticalGroup
        bigGap={isExtendedView}
        grow
      >
        <div className="balance-transactions-wrapper">
          <Balance
            balance={walletBalance}
            balanceLocked={walletBalanceLocked}
            exchangeRate={exchangeRate}
            walletType={walletType}
          />
        </div>
        <ActionButtons data={actionButtonData} />
        <Wallet.TransactionsList
          transactionsList={walletTransactionList}
          getConfirmations={BTC.getConfirmationsAmount}
        />
      </VerticalGroup>
    </div>
  )
}

export default WalletPage
