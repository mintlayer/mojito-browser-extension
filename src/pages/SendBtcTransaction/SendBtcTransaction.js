import { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { SendBtcTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useBtcWalletInfo } from '@Hooks'
import { AccountContext, BitcoinContext } from '@Contexts'
import { BTCTransaction } from '@Cryptos'
import { Account } from '@Entities'
import { BTC as BTCHelper, Format } from '@Helpers'
import { Electrum } from '@APIs'
import { BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

import './SendBtcTransaction.css'

const SendBtcTransactionPage = () => {
  const { addresses, accountID } = useContext(AccountContext)
  const { fetchAllData } = useContext(BitcoinContext)

  const { coinType } = useParams()
  const walletType = {
    name: coinType,
    ticker: 'BTC',
    chain: 'bitcoin',
    tokenId: ['Mintlayer', 'Bitcoin'].includes(coinType) ? null : coinType,
  }

  const { unusedAddresses: unusedBtcAddresses, btcUtxos } =
    useContext(BitcoinContext)

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
  const [transactionInformation, setTransactionInformation] = useState(null)

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
    setTransactionInformation(transactionInfo)
  }

  const getChangeAddress = () => {
    const candidate =
      unusedBtcAddresses?.changeAddress ||
      addresses?.btcAddresses?.btcChangeAddresses?.[0]

    if (typeof candidate === 'string') return candidate
    if (typeof candidate?.address === 'string') return candidate.address
    if (typeof candidate === 'object') {
      const key = Object.keys(candidate)[0]
      if (typeof key === 'string') return key
    }
    throw new Error('Missing BTC change address')
  }

  const confirmBtcTransaction = async (password) => {
    // eslint-disable-next-line no-unused-vars
    const { btcPrivateKeys } = await Account.unlockAccount(accountID, password)
    const transactionAmountInSatoshi = BTCHelper.convertBtcToSatoshi(
      transactionInformation.amount,
    )

    const currentAccount = await Account.getAccount(accountID)
    const btcWalletType =
      currentAccount.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT

    // eslint-disable-next-line no-unused-vars
    const [__, transactionHex] = await BTCTransaction.buildTransaction({
      to: transactionInformation.to,
      amount: transactionAmountInSatoshi,
      utxos: btcUtxos || [],
      feeRate: transactionInformation.fee,
      walletType: btcWalletType,
      changeAddress: getChangeAddress(),
      root: btcPrivateKeys,
    })

    const result = await Electrum.broadcastTransaction(transactionHex)
    return result
  }

  const goBackToWallet = async () => {
    navigate('/wallet/Bitcoin')
    await fetchAllData(true)
  }

  return (
    <>
      <div className="page">
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
            confirmTransaction={confirmBtcTransaction}
            goBackToWallet={goBackToWallet}
            walletType={walletType}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendBtcTransactionPage
