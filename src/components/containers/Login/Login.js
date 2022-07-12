import React from 'react'

import CenteredLayout from '../../layouts/CenteredLayout/CenteredLayout'
import VerticalGroup from '../../layouts/VerticalGroup/VerticalGroup'

import Button from '../../basic/Button/Button'

import Carousel from '../../composed/Carousel/Carousel'

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
      <CenteredLayout>
        <VerticalGroup bigGap>
          <div className="content">
            <Carousel
              accounts={accounts}
              onClick={onSelectAccount}
            />
          </div>

          <Button onClickHandle={onCreateAccount}>Create Wallet</Button>
        </VerticalGroup>
      </CenteredLayout>
    </div>
  )
}

export default Login
