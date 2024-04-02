import { useContext } from 'react'
import { Button } from '@BasicComponents'
import { HelpTooltip } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'
import { useMlWalletInfo } from '@Hooks'
import { ML } from '@Helpers'
import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'

import { TransactionContext, SettingsContext, AccountContext } from '@Contexts'

import './CurrentStaking.css'
import Timer from '../../basic/Timer/Timer'
import { useEffectOnce } from '../../../hooks/etc/useEffectOnce'

const CurrentStaking = ({ addressList }) => {
  const { networkType } = useContext(SettingsContext)
  const { setDelegationStep } = useContext(TransactionContext)
  const { walletType } = useContext(AccountContext)

  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
  const isUncofermedTransaction =
    LocalStorageService.getItem(unconfirmedTransactionString) &&
    walletType.name === 'Mintlayer'

  const unconfirmedTransactions = LocalStorageService.getItem(
    unconfirmedTransactionString,
  )

  const revalidate =
    isUncofermedTransaction &&
    unconfirmedTransactions.mode === AppInfo.ML_TRANSACTION_MODES.DELEGATION
  const {
    mlDelegationList,
    mlDelegationsBalance,
    getDelegations,
    getTransactions,
  } = useMlWalletInfo(addressList)

  useEffectOnce(() => {
    getDelegations()
  })

  const onNextButtonClick = () => {
    setDelegationStep(2)
  }
  const stakingGuideLink =
    'https://mintlayer.info/en/Guides/Staking/browser-extension'
  const poolListLink =
    networkType === 'testnet'
      ? 'https://lovelace.explorer.mintlayer.org/pools'
      : 'https://explorer.mintlayer.org/pools'

  return (
    <VerticalGroup>
      <div className="staking-title-wrapper">
        <div className="main-info">
          <div className="guide-wraper">
            <h1 className="staking-title">Your current staking</h1>
            <HelpTooltip
              message="Staking guide"
              link={stakingGuideLink}
            />
          </div>

          <p className="total-staked">
            Total staked: {ML.getAmountInCoins(mlDelegationsBalance)} ML
          </p>
        </div>
        <div>
          {revalidate && (
            <Timer
              onTimerEnd={() => {
                getDelegations()
                getTransactions()
              }}
              duration={10000}
              repeat={revalidate}
            />
          )}
        </div>
        <a
          href={poolListLink}
          target="_blank"
        >
          <Button extraStyleClasses={['pool-button']}>Pool list</Button>
        </a>
      </div>

      <Wallet.DelegationList delegationsList={mlDelegationList} />
      <div className="delegation-button-wrapper">
        <Button
          onClickHandle={onNextButtonClick}
          extraStyleClasses={['delegation-button']}
          disabled={isUncofermedTransaction}
        >
          Create new delegation
        </Button>
      </div>
    </VerticalGroup>
  )
}

export default CurrentStaking
