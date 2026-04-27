import { useContext, useState } from 'react'
import { useNavigate } from 'react-router'
import { Toggle, PageWrapper } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'
import { AccountContext, MintlayerContext } from '@Contexts'
import { ManualSwap, SwapInterface } from '@ComposedComponents'

import styles from './OrderSwap.module.css'

const OrderSwapPage = () => {
  const { accountID } = useContext(AccountContext)
  const { ordersPairInfo, orderPairLoading } = useContext(MintlayerContext)
  const navigate = useNavigate()
  const [mode, setMode] = useState('basic') // 'basic' or 'advanced'

  const sortedOrdersByRate = ordersPairInfo.sort((a, b) => {
    return (b.quote_rate || 0) - (a.quote_rate || 0)
  })

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'basic' ? 'advanced' : 'basic'))
  }

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  return (
    <PageWrapper>
      <VerticalGroup
        grow
        midGap
      >
        <div className={styles.header}>
          <h1 className={styles.title}>Swap Assets</h1>
          <div className={styles.modeToggle}>
            <span className={styles.modeLabel}>Advanced Mode</span>
            <Toggle
              label={'Advanced Mode'}
              toggled={mode === 'pro'}
              onClick={toggleMode}
            />
          </div>
        </div>

        <div className={styles.content}>
          {mode === 'basic' ? (
            <>
              <SwapInterface />
              <Wallet.OrderList
                orderList={
                  sortedOrdersByRate.length > 0 ? sortedOrdersByRate : []
                }
                ordersLoading={orderPairLoading}
              />
            </>
          ) : (
            <ManualSwap />
          )}
        </div>
      </VerticalGroup>
    </PageWrapper>
  )
}

export default OrderSwapPage
