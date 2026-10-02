import { useContext, useState } from 'react'
import { useNavigate } from 'react-router'

import { Wallet } from '@ContainerComponents'
import { MintlayerContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ML } from '@Helpers'
import { useMlWalletInfo } from '@Hooks'
import {
  PageWrapper,
  Eyebrow,
  Sparkline,
  Button,
  ChainBadge,
  Tooltip,
} from '@BasicComponents'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-arrow-right-top.svg'
import { ReactComponent as IconWarning } from '@Assets/images/icon-warning.svg'

import styles from './StakePage.module.css'

/**
 * Staking screen (dark design). Real delegation data from MintlayerContext.
 * The growth chart is rebuilt from the wallet's on-chain staking
 * transactions ('DelegateStaking' / 'Delegate Withdrawal') and anchored to
 * the live delegation total, so the gap to the contributions is the rewards
 * accrued while staking.
 */
const StakePage = () => {
  const { networkType } = useContext(SettingsContext)
  const { mlDelegationList, mlDelegationsBalance, fetchingDelegations } =
    useContext(MintlayerContext)
  const { transactions } = useMlWalletInfo()

  const { series, contributed, withdrawn } = ML.buildStakeGrowthSeries(
    transactions,
    mlDelegationsBalance || 0,
  )
  const earned = Math.max(
    0,
    (mlDelegationsBalance || 0) - (contributed - withdrawn),
  )

  const navigate = useNavigate()
  const [tooltipVisible, setTooltipVisible] = useState(false)

  const confirmed = mlDelegationList.filter(
    (d) => d.type !== 'Unconfirmed' && d.balance?.decimal,
  )
  const activeCount = confirmed.filter((d) => !d.decommissioned).length
  const inactiveCount = confirmed.length - activeCount
  const delegationsLoading = fetchingDelegations && !mlDelegationList.length

  // Delegations still holding funds in decommissioned pools: they no longer
  // earn rewards, so the funds should be withdrawn and re-delegated.
  const inactiveDelegations = confirmed.filter(
    (d) => d.decommissioned && Number(d.balance?.decimal ?? 0) >= 1,
  )

  const createDelegation = () => {
    navigate('/wallet/Mintlayer/staking/create-delegation')
  }

  const scrollToInactive = () => {
    const poolId = inactiveDelegations[0]?.pool_id
    if (!poolId) return
    document
      .querySelector(`[data-poolid="${poolId}"]`)
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  const poolListLink =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? 'https://lovelace.explorer.mintlayer.org/pools'
      : 'https://explorer.mintlayer.org/pools'

  return (
    <PageWrapper className={styles.pageWrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <span className={styles.title}>Staking</span>
          <ChainBadge chain="Mintlayer" />
        </div>

        <div className={styles.balanceCard}>
          <Eyebrow>Total staked</Eyebrow>
          <div className={styles.balanceRow}>
            <span className={styles.balanceValue}>
              {(mlDelegationsBalance || 0).toLocaleString(undefined, {
                maximumFractionDigits: 8,
              })}
            </span>
            <span className={styles.balanceTicker}>ML</span>
          </div>
          <div className={styles.statsRow}>
            <span className={styles.stat}>
              <span className={styles.statValueEarned}>
                +
                {earned.toLocaleString(undefined, { maximumFractionDigits: 8 })}
              </span>{' '}
              earned
            </span>
            <span className={styles.statDot}>·</span>
            <span className={styles.stat}>
              {activeCount} active
              {inactiveCount > 0 ? ` · ${inactiveCount} inactive` : ''}
            </span>
          </div>
        </div>

        {series.length > 1 && (
          <div className={styles.chartCard}>
            <Eyebrow>Stake growth</Eyebrow>
            <div className={styles.chartWrap}>
              <Sparkline
                data={series}
                width={320}
                height={70}
                color="var(--be-amber)"
                responsive
              />
            </div>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionTitleRow}>
            <div className={styles.sectionTitle}>Delegations</div>
            {inactiveDelegations.length > 0 && (
              <button
                type="button"
                className={styles.warningBadge}
                data-testid="inactive-warning"
                onClick={scrollToInactive}
                onMouseEnter={() => setTooltipVisible(true)}
                onMouseLeave={() => setTooltipVisible(false)}
              >
                <IconWarning className={styles.warningIcon} />
                <Tooltip
                  message={`${inactiveDelegations.length} pool${
                    inactiveDelegations.length > 1 ? 's are' : ' is'
                  } decommissioned — those funds no longer earn rewards.`}
                  visible={tooltipVisible}
                  position="top"
                />
              </button>
            )}
          </div>
          <Wallet.DelegationList
            delegationsList={mlDelegationList}
            delegationsLoading={delegationsLoading}
          />
        </div>

        <div className={styles.actions}>
          <Button
            onClickHandle={createDelegation}
            extraStyleClasses={[styles.actionButton]}
            dataTestId="create-delegation"
          >
            Create new delegation
          </Button>
          <a
            href={poolListLink}
            target="_blank"
            rel="noreferrer"
          >
            <Button
              extraStyleClasses={[styles.actionSecondary]}
              alternate
            >
              Pool list
              <IconArrowTopRight className={styles.poolIcon} />
            </Button>
          </a>
        </div>
      </div>
    </PageWrapper>
  )
}

export default StakePage
