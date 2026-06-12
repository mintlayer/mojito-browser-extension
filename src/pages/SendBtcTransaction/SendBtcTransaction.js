import { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { SendBtcTransaction } from '@ContainerComponents'
import { SendPageHeader } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useBtcWalletInfo } from '@Hooks'
import { AccountContext, BitcoinContext, SettingsContext } from '@Contexts'
import { BTCTransaction } from '@Cryptos'
import { Account } from '@Entities'
import { BTC as BTCHelper, Format } from '@Helpers'
import { BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { AppInfo } from '@Constants'

import { PageWrapper } from '@BasicComponents'
import styles from './SendBtcTransaction.module.css'

const SendBtcTransactionPage = () => {
  const { addresses, accountID } = useContext(AccountContext)
  const { btcUtxos } = useContext(BitcoinContext)
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET

  const { coinType } = useParams()
  const walletType = {
    name: coinType,
    ticker: 'BTC',
    chain: 'bitcoin',
    tokenId: ['Mintlayer', 'Bitcoin'].includes(coinType) ? null : coinType,
  }

  const currentBtcAddress = addresses.btcAddresses.btcReceivingAddresses[0]
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const navigate = useNavigate()

  const { balance } = useBtcWalletInfo(currentBtcAddress, coinType)

  const tokenName = 'BTC'
  const fiatName = 'USD'
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const [isFormValid, setFormValid] = useState(false)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)

  const maxValueToken = balance

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const calculateBtcTotalFee = async (transactionInfo) => {
    const currentAccount = await Account.getAccount(accountID)
    const btcWalletType =
      currentAccount.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT

    const totalFee = await BTCTransaction.calculateBtcTransactionFee({
      to: transactionInfo.to,
      amount: BTCHelper.convertBtcToSatoshi(transactionInfo.amount),
      utxos: btcUtxos || [],
      feeRate: transactionInfo.fee,
      walletType: btcWalletType,
    })

    const formatedFee = Format.BTCValue(BTCHelper.convertSatoshiToBtc(totalFee))

    setTotalFeeFiat(Format.fiatValue(formatedFee * exchangeRate))
    setTotalFeeCrypto(formatedFee)
  }

  const createTransaction = async (transactionInfo) => {
    await calculateBtcTotalFee(transactionInfo)
  }

  return (
    <PageWrapper>
      <div className={styles.page}>
        <SendPageHeader
          ticker="BTC"
          networkName="Bitcoin"
          isTestnet={isTestnet}
        />
        <VerticalGroup smallGap>
          <SendBtcTransaction
            totalFeeFiat={totalFeeFiat}
            totalFeeCrypto={totalFeeCrypto}
            setTotalFeeCrypto={setTotalFeeCrypto}
            transactionData={transactionData}
            exchangeRate={exchangeRate}
            maxValueInToken={maxValueToken}
            onSendTransaction={createTransaction}
            calculateTotalFee={calculateBtcTotalFee}
            setFormValidity={setFormValid}
            isFormValid={isFormValid}
            walletType={walletType}
          />
        </VerticalGroup>
      </div>
    </PageWrapper>
  )
}

export default SendBtcTransactionPage
