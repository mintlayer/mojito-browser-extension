import { useContext, useState } from 'react'
import { useNavigate } from 'react-router'
import { Toggle } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'
import { AccountContext, MintlayerContext } from '@Contexts'
import { ManualSwap, SwapInterface } from '@ComposedComponents'

import './OrderSwap.css'

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
    <VerticalGroup
      grow
      midGap
    >
      <div className="swap-header">
        <h1 className="swap-header-title">Swap Assets</h1>
        <div className="swap-mode-toggle">
          <span className="swap-mode-label">Advanced Mode</span>
          <Toggle
            label={'Advanced Mode'}
            toggled={mode === 'pro'}
            onClick={toggleMode}
          />
        </div>
      </div>

      {/* swap interface  */}
      <div className="swap-content">
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
  )
}

export default OrderSwapPage
