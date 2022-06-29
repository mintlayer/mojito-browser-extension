import React from 'react'
import Button from '../basic/button'
import CenteredLayout from '../group/centeredLayout'
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
        <div className="content">
          <Carousel
            accounts={accounts}
            onClick={onSelectAccount}
          />
        </div>

        <div className="footer">
          <Button onClickHandle={onCreateAccount}>Create Wallet</Button>
        </div>
      </CenteredLayout>
    </div>
  )
}

export default ListAccounts
