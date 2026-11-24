import { useContext, useRef, useState, useEffect } from 'react'
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

import { Error, PageWrapper } from '@BasicComponents'
import styles from './SendBtcTransaction.module.css'

const SendBtcTransactionPage = () => {
  const { accountID } = useContext(AccountContext)
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

  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [feeError, setFeeError] = useState('')
  // Monotonic id per fee quote: only the most recently started quote may
  // write preview state, otherwise overlapping in-flight quotes (amount/
  // fee edits racing the network round-trips) interleave setStates and the
  // send page displays a stale fee. The confirm page is unaffected — it
  // broadcasts the frozen approval record, not these preview figures.
  const feeQuoteSeqRef = useRef(0)
  const navigate = useNavigate()

  const { balance } = useBtcWalletInfo()

  const tokenName = 'BTC'
  const fiatName = 'USD'
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const [isFormValid, setFormValid] = useState(false)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)

  const maxValueToken = balance

  useEffect(() => {
    if (!accountID) {
      navigate('/dashboard')
    }
  }, [accountID, navigate])

  if (!accountID) {
    return null
  }

  const calculateBtcTotalFee = async (transactionInfo) => {
    const requestSeq = ++feeQuoteSeqRef.current
    try {
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

      const formatedFee = Format.BTCValue(
        BTCHelper.convertSatoshiToBtc(totalFee),
      )
      const freshTotalFeeFiat = Format.fiatValue(formatedFee * exchangeRate)

      // The confirmation page must broadcast what the user approved here.
      // Freeze the exact UTXO set, raw satoshi fee and address type this
      // quote was derived from, so the confirm step re-selects inputs from
      // this snapshot instead of the poll-refreshed live UTXO list.
      const quote = {
        totalFeeFiat: freshTotalFeeFiat,
        totalFeeCrypto: formatedFee,
        totalFeeSatoshi: totalFee,
        approvedUtxos: btcUtxos || [],
        btcWalletType,
      }

      // A newer quote superseded this one while it was in flight — leave
      // the fresher figures on screen (the returned record stays self-
      // consistent for the confirmation route state).
      if (requestSeq !== feeQuoteSeqRef.current) {
        return quote
      }

      setTotalFeeCrypto(formatedFee)
      setFeeError('')

      return quote
    } catch (e) {
      console.error('Failed to calculate BTC transaction fee:', e)
      if (requestSeq !== feeQuoteSeqRef.current) {
        return null
      }
      setTotalFeeCrypto(0)
      setFeeError(e?.message || 'Failed to calculate the transaction fee')
      return null
    }
  }

  const createTransaction = async (transactionInfo) => {
    return calculateBtcTotalFee(transactionInfo)
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
            totalFeeCrypto={totalFeeCrypto}
            transactionData={transactionData}
            exchangeRate={exchangeRate}
            maxValueInToken={maxValueToken}
            onSendTransaction={createTransaction}
            calculateTotalFee={calculateBtcTotalFee}
            setFormValidity={setFormValid}
            isFormValid={isFormValid}
            walletType={walletType}
          />
          {feeError && <Error error={feeError} />}
        </VerticalGroup>
      </div>
    </PageWrapper>
  )
}

export default SendBtcTransactionPage
