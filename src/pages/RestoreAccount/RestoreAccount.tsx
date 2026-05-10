import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { AccountContext } from '@Contexts'
import { Account } from '@Entities'
import { BTC } from '@Cryptos'

import { Loading } from '@ComposedComponents'
import { PageWrapper, OptionCard } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { RestoreAccount } from '@ContainerComponents'
import { ReactComponent as IconDocumentFilled } from '@Assets/images/icon-document-filled.svg'
import { ReactComponent as IconUpload } from '@Assets/images/icon-upload.svg'

import styles from './RestoreAccount.module.css'

const RestoreAccountPage = () => {
  const [step, setStep] = useState(1)
  const [restoreMethod, setRestoreMethod] = useState('')
  const [creatingWallet, setCreatingWallet] = useState(false)
  const { setWalletInfo, setCustomBackAction } = useContext(AccountContext)

  const navigate = useNavigate()

  const createAccount = (
    accountName: string,
    accountPassword: string,
    mnemonic: string,
    btcAddressType: string,
    selectedWallets: string[],
    // eslint-disable-next-line max-params
  ) => {
    setCreatingWallet(true)
    let accountID: string | null = null
    const data = {
      name: accountName,
      password: accountPassword,
      mnemonic,
      walletType: btcAddressType,
      walletsToCreate: selectedWallets,
    }
    Account.saveAccount(data)
      .then((id: string) => {
        accountID = id
        return Account.unlockAccount(id, accountPassword)
      })
      .then(({ addresses }) => {
        setWalletInfo(addresses, accountID, accountName)
        navigate('/dashboard')
      })
  }

  const goToPrevStep = () => {
    setRestoreMethod('')
    navigate('/')
  }

  useEffect(() => {
    setCustomBackAction(() => goToPrevStep)
    return () => setCustomBackAction(null)
  }, [])

  return (
    <PageWrapper className={styles.restoreAccountPage}>
      {creatingWallet ? (
        <div className={styles.loadingWrapper}>
          <CenteredLayout>
            <VerticalGroup bigGap>
              <h1 className={styles.loadingText}>
                Just a sec, we are restoring your wallet...
              </h1>
              <Loading extraStyleClasses={[styles.loadingBig]} />
            </VerticalGroup>
          </CenteredLayout>
        </div>
      ) : (
        <>
          {!restoreMethod && (
            <div className={styles.page}>
              <h2 className={styles.title}>Restore wallet</h2>
              <p className={styles.subtitle}>
                Choose how you&apos;d like to recover access
              </p>
              <div className={styles.cards}>
                <OptionCard
                  icon={<IconDocumentFilled />}
                  title="Seed Phrase"
                  description="Restore using your 12 or 24 word recovery phrase"
                  onClick={() => setRestoreMethod('mnemonic')}
                />
                <OptionCard
                  icon={<IconUpload />}
                  title="Backup file"
                  description="Restore from a JSON backup file exported from Mojito"
                  onClick={() => setRestoreMethod('json')}
                />
              </div>
            </div>
          )}
          {restoreMethod === 'mnemonic' && (
            <RestoreAccount.RestoreAccountMnemonic
              step={step}
              setStep={setStep}
              onStepsFinished={createAccount}
              validateMnemonicFn={BTC.validateMnemonic}
              defaultBTCWordList={BTC.getWordList()}
            />
          )}
          {restoreMethod === 'json' && <RestoreAccount.RestoreAccountJson />}
        </>
      )}
    </PageWrapper>
  )
}
export default RestoreAccountPage
