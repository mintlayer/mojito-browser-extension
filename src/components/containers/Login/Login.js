import React from 'react'

import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
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
      <h2 className="subtitle">wallet available</h2>
      <VerticalGroup bigGap>
        <div className="content">
          <Carousel
            accounts={accounts}
            onClick={onSelectAccount}
          />
        </div>
        <CenteredLayout>
          <Button onClickHandle={onCreateAccount}>Create Wallet</Button>
        </CenteredLayout>
      </VerticalGroup>
    </div>
  )
}

export default Login
