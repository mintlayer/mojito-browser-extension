import React from 'react'

import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-arrow-right-top.svg'
import { Button } from '@BasicComponents'
import { Carousel } from '@ComposedComponents'

import './Login.css'

const Login = ({ accounts, onSelect, onCreate }) => {
  const onSelectAccount = (account) => onSelect && onSelect(account)
  const onCreateAccount = () => onCreate && onCreate()

  return (
    <div
      data-testid="list-accounts"
      className="list-accounts"
    >
      <h2 className="subtitle">
        Available wallet{accounts.length > 1 ? 's' : ''}
      </h2>
      <VerticalGroup bigGap>
        <div className="content">
          <Carousel
            accounts={accounts}
            onClick={onSelectAccount}
          />
        </div>
        <CenteredLayout>
          <Button
            onClickHandle={onCreateAccount}
            extraStyleClasses={['add-wallet-button']}
            dataTestId="add-wallet-button"
          >
            Add Wallet <IconArrowTopRight className="add-wallet-button-icon" />
          </Button>
        </CenteredLayout>
      </VerticalGroup>
    </div>
  )
}

export default Login
