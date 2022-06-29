import React from 'react'
import Button from '../basic/button'
import CenteredLayout from '../group/centeredLayout'
import VerticalGroup from '../group/verticalGroup'

import Carousel from '../carousel/carousel'

import './index.css'

const ListAccounts = ({ accounts, onSelect, onCreate }) => {
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

export default ListAccounts
