import { useLocation, useNavigate } from 'react-router'
import { useState, useContext, useEffect } from 'react'
import { Button, Error as ErrorBanner, PageWrapper } from '@BasicComponents'
import { PopUp, TextField, Loading } from '@ComposedComponents'
import { AccountContext, BitcoinContext, SettingsContext } from '@Contexts'
import { BTCTransaction } from '@Cryptos'
import { Account } from '@Entities'
import { BTC as BTCHelper } from '@Helpers'
import { Electrum } from '@APIs'
import { AppInfo } from '@Constants'
import { VerticalGroup, CenteredLayout } from '@LayoutComponents'

import styles from './ConfirmBtcTransaction.module.css'

const ConfirmBtcTransactionPage = () => {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [sendingTransaction, setSendingTransaction] = useState(false)
  const [transactionTxid, setTransactionTxid] = useState(null)
  const [txErrorMessage, setTxErrorMessage] = useState(null)
  const loadingExtraClasses = ['loading-big']

  const extraButtonStyles = [styles.buttonSignTransaction]

  const { accountID, addresses } = useContext(AccountContext)
  const [hasPasskey, setHasPasskey] = useState(false)

  useEffect(() => {
    let cancelled = false
    Account.hasPasskey(accountID).then((has) => {
      if (!cancelled) setHasPasskey(has)
    })
    return () => {
      cancelled = true
    }
  }, [accountID])
  const { unusedAddresses: unusedBtcAddresses, fetchAllData } =
    useContext(BitcoinContext)
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET

  const {
    address,
    amountInCrypto,
    amountInFiat,
    fee,
    totalFeeFiat,
    totalFeeCrypto,
    totalFeeSatoshi,
    approvedUtxos,
    btcWalletType,
    walletType,
    poolData,
  } = state || {}

  const amountFiat = isTestnet ? '0,00' : amountInFiat
  const feeFiat = isTestnet ? '0,00' : totalFeeFiat
  const ticker = walletType?.name === 'Bitcoin' ? 'BTC' : 'ML'

  const isLowReward =
    poolData &&
    (poolData[0].cost_per_block.decimal > AppInfo.APPROPRIATE_COST_PER_BLOCK ||
      parseFloat(poolData[0].margin_ratio_per_thousand) >
        AppInfo.APPROPRIATE_MARGIN_RATIO_PER_THOUSAND)

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

  const handleApprove = () => {
    setIsModalOpen(true)
  }

  const handleDecline = () => {
    navigate(-1)
  }

  const handleModalDecline = () => {
    setPassword('')
    setSendingTransaction(false)
    setTxErrorMessage('')
    setIsModalOpen(false)
  }

  const handleModalSubmit = async () => {
    if (!password) {
      setTxErrorMessage('Password must be set.')
      return
    }

    setSendingTransaction(true)
    try {
      // The user approved the recap (amount, fee) quoted from a UTXO
      // snapshot frozen on the send form. Rebuilding from the live
      // BitcoinContext UTXO list here would silently sign a different
      // transaction (different inputs, different fee) whenever a background
      // refresh changed the set in between. Broadcast is therefore built
      // from the approved snapshot only, and fails closed if that snapshot
      // no longer reproduces the approved fee.
      // The gate covers every approval figure the signed transaction
      // depends on: a crafted route state that freezes the UTXO trio but
      // drops the recipient would otherwise unlock keys and let
      // buildTransaction silently fold the missing recipient output into
      // the wallet change address (an approved-looking self-send).
      if (
        !Array.isArray(approvedUtxos) ||
        typeof totalFeeSatoshi !== 'number' ||
        typeof btcWalletType !== 'string' ||
        typeof address !== 'string' ||
        !address ||
        fee == null
      ) {
        throw new Error(
          'Approved transaction data is missing. Please review the transaction and try again.',
        )
      }

      const transactionAmountInSatoshi = BTCHelper.convertBtcToSatoshi(
        state.transactionAmount,
      )

      const approvedFee = await BTCTransaction.calculateBtcTransactionFee({
        to: address,
        amount: transactionAmountInSatoshi,
        utxos: approvedUtxos,
        feeRate: fee,
        walletType: btcWalletType,
      })
      if (approvedFee !== totalFeeSatoshi) {
        throw new Error(
          'Fee changed since approval. Please review the transaction and confirm again.',
        )
      }

      const unwrappedPassword = hasPasskey
        ? await Account.getPasswordWithPasskey(accountID)
        : password
      const { btcPrivateKeys } = await Account.unlockAccount(
        accountID,
        unwrappedPassword,
        { wallets: ['btc'] },
      )

      // eslint-disable-next-line no-unused-vars
      const [__, transactionHex] = await BTCTransaction.buildTransaction({
        to: address,
        amount: transactionAmountInSatoshi,
        utxos: approvedUtxos,
        feeRate: fee,
        walletType: btcWalletType,
        changeAddress: getChangeAddress(),
        root: btcPrivateKeys,
      })

      const result = await Electrum.broadcastTransaction(transactionHex)
      const txid = JSON.parse(result).txid
      setTransactionTxid(txid)
      setTxErrorMessage('')
      setPassword('')

      if (fetchAllData) {
        await fetchAllData(true)
      }
    } catch (e) {
      // Account.unlockAccount rejects with a sentinel object (not an Error)
      // when the password is wrong. Prefer an explicitly typed flag when the
      // entity ever grows one, then fall back to the known rejection shapes.
      const isWrongPassword =
        e?.wrongPassword === true ||
        e?.code === 'WRONG_PASSWORD' ||
        e?.name === '' ||
        e?.address === ''
      if (isWrongPassword) {
        setTxErrorMessage('Incorrect password')
        setPassword('')
      } else if (typeof e === 'string' && e.includes('Invalid amount')) {
        setTxErrorMessage('Balance is not enough to cover the transaction')
        setIsModalOpen(false)
      } else {
        setTxErrorMessage(e.message || 'Transaction failed')
        setPassword('')
      }
    } finally {
      setSendingTransaction(false)
    }
  }

  const goBackToWallet = async () => {
    navigate('/dashboard')
  }

  const passwordChangeHandler = (value) => {
    setPassword(value)
  }

  useEffect(() => {
    if (!state) {
      navigate('/dashboard')
    }
  }, [state, navigate])

  if (!state) {
    return null
  }

  return (
    <PageWrapper>
      <div className={styles.signTransaction}>
        <div className={styles.header}>
          <h1 className={styles.signTxTitle}>Confirm Transaction</h1>
        </div>

        <div className={styles.signTxContent}>
          <div className={styles.transactionPreviewWrapper}>
            <div className={styles.transactionDetails}>
              <div className={styles.signTxSection}>
                <h4>Recipient address</h4>
                <p>{address}</p>
              </div>

              <div className={styles.signTxSection}>
                <h4>Amount</h4>
                <p>{amountInCrypto} BTC</p>
                <p>{amountFiat} USD</p>
              </div>

              <div className={styles.signTxSection}>
                <h4>Network fee</h4>
                <p>
                  {totalFeeCrypto} {ticker}
                </p>
                <p>
                  {feeFiat} USD
                  {walletType?.name !== 'Mintlayer' && ` · ${fee} sat/B`}
                </p>
              </div>
            </div>

            {isLowReward && (
              <p className={styles.poolWarning}>
                Please note: The pool you are using has a high cost per block
                and/or margin ratio. This may result in lower rewards.
              </p>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <Button
            onClickHandle={handleDecline}
            extraStyleClasses={extraButtonStyles}
            alternate
          >
            Decline
          </Button>
          <Button
            onClickHandle={handleApprove}
            extraStyleClasses={extraButtonStyles}
          >
            Confirm
          </Button>
        </div>

        {isModalOpen && (
          <PopUp setOpen={setIsModalOpen}>
            {sendingTransaction && (
              <VerticalGroup bigGap>
                <h2 className="loading-text">
                  Your transaction broadcasting to network.
                </h2>
                <CenteredLayout>
                  <Loading extraStyleClasses={loadingExtraClasses} />
                </CenteredLayout>
              </VerticalGroup>
            )}

            {!sendingTransaction && transactionTxid && (
              <VerticalGroup bigGap>
                <h2>Your transaction was sent.</h2>
                <h3>Txid: {transactionTxid}</h3>
                <CenteredLayout>
                  <Button onClickHandle={goBackToWallet}>Back to wallet</Button>
                </CenteredLayout>
              </VerticalGroup>
            )}

            {!sendingTransaction && !transactionTxid && (
              <div className={styles.modalContent}>
                <div className={styles.modalTitle}>
                  <TextField
                    label="Enter your password"
                    password
                    value={password}
                    onChangeHandle={passwordChangeHandler}
                    placeHolder="Enter your password"
                    autoFocus
                  />
                  {txErrorMessage && <ErrorBanner error={txErrorMessage} />}
                </div>
                <div className={styles.modalButtons}>
                  <Button
                    onClickHandle={handleModalDecline}
                    extraStyleClasses={extraButtonStyles}
                    alternate
                  >
                    Decline
                  </Button>
                  <Button
                    onClickHandle={handleModalSubmit}
                    extraStyleClasses={extraButtonStyles}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </PopUp>
        )}
      </div>
    </PageWrapper>
  )
}

export default ConfirmBtcTransactionPage
