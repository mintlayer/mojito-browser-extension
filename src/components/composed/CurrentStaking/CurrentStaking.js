import { useState, useContext } from 'react'
import { Button } from '@BasicComponents'
import { HelpTooltip } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'
import { Tooltip } from '@BasicComponents'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-arrow-right-top.svg'

import { MintlayerContext, SettingsContext } from '@Contexts'

import styles from './CurrentStaking.module.css'
import { useNavigate, useParams } from 'react-router'

import { ReactComponent as IconWarning } from '@Assets/images/icon-warning.svg'

const CurrentStaking = () => {
  const navigate = useNavigate()
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const { coinType } = useParams()
  const { networkType } = useContext(SettingsContext)
  const { mlDelegationsBalance, fetchingDelegations, mlDelegationList } =
    useContext(MintlayerContext)

  const walletType = {
    name: coinType,
    ticker: coinType === 'Mintlayer' ? 'ML' : 'BTC',
    network: coinType === 'Bitcoin' ? 'bitcoin' : 'mintlayer',
  }

  const delegationsLoading =
    fetchingDelegations && mlDelegationList.length === 0
  const onDelegationCreateButtonClick = () => {
    navigate('/wallet/' + walletType.name + '/staking/create-delegation')
  }
  const stakingGuideLink =
    'https://mintlayer.info/en/Guides/Staking/browser-extension'
  const poolListLink =
    networkType === 'testnet'
      ? 'https://lovelace.explorer.mintlayer.org/pools'
      : 'https://explorer.mintlayer.org/pools'

  const decommissionedPools = mlDelegationList.filter(
    (delegation) => delegation.decommissioned && delegation.balance.length > 11,
  )

  const handleScrollToPool = () => {
    const firstDecommissionedPool = mlDelegationList.find(
      (delegation) =>
        delegation.decommissioned === true && delegation.balance.length > 11,
    ).pool_id
    const poolList = document.querySelectorAll(
      `[data-poolid="${firstDecommissionedPool}"]`,
    )[0]
    poolList.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleTooltip = () => {
    setTooltipVisible(!tooltipVisible)
  }

  const tooltipMesage = `Some of your delegations are inactive. ${
    decommissionedPools.length
  }${' '} pool${
    decommissionedPools.length > 1 ? 's are' : ' is'
  } decommissioned.`

  return (
    <VerticalGroup grow>
      <div className={styles.header}>
        <div className={styles.mainInfo}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Your current staking</h1>
            <HelpTooltip
              message="Staking guide"
              link={stakingGuideLink}
            />
          </div>

          <p className={styles.totalStaked}>
            Total staked:{' '}
            <span className={styles.totalStakedValue}>
              {mlDelegationsBalance}
            </span>{' '}
            ML
          </p>
        </div>
        {decommissionedPools.length > 0 && (
          <div
            onMouseEnter={toggleTooltip}
            onMouseLeave={toggleTooltip}
          >
            <div
              className={styles.warningBadge}
              onClick={handleScrollToPool}
            >
              <IconWarning />
            </div>
            <Tooltip
              message={tooltipMesage}
              visible={tooltipVisible}
              position="left"
            />
          </div>
        )}
        <a
          href={poolListLink}
          target="_blank"
        >
          <Button
            alternate
            extraStyleClasses={[styles.poolButton]}
          >
            Pool list
            <IconArrowTopRight className={styles.poolIcon} />
          </Button>
        </a>
      </div>

      <Wallet.DelegationList
        delegationsList={mlDelegationList}
        delegationsLoading={delegationsLoading}
      />
      <CenteredLayout>
        <Button
          onClickHandle={onDelegationCreateButtonClick}
          extraStyleClasses={[styles.createButton]}
        >
          Create new delegation
        </Button>
      </CenteredLayout>
    </VerticalGroup>
  )
}

export default CurrentStaking
