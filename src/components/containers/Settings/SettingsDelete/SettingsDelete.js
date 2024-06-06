import { useContext } from 'react'

import { Button } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'


import { ReactComponent as BinIcon } from '@Assets/images/icon-bin.svg'
import { AccountContext } from '@Contexts'

import './SettingsDelete.css'

const SettingsDelete = () => {
  const buttonExtraClasses = ['settings-delete-button']
  const {
    accountID,
    accountName,
    setRemoveAccountPopupOpen,
    setDeletingAccount,
  } = useContext(AccountContext)

  const currentAccount = { id: accountID, name: accountName }

  const onDeleteClick = (account) => {
    setRemoveAccountPopupOpen(true)
    setDeletingAccount(account)
  }

  return (
    <div
      className="settings-delete"
      data-testid="settings-testnet"
    >
      <div className="delete-description">
        <VerticalGroup>
          <h2 data-testid="title">DELETE WALLET</h2>
          <p>
            If you delete a wallet, you may lose access to all the funds
            associated with it. Please make sure you have backed up your wallet
            before proceeding.
          </p>
        </VerticalGroup>
      </div>
      <Button
        onClickHandle={() => onDeleteClick(currentAccount)}
        extraStyleClasses={buttonExtraClasses}
      >
        <BinIcon className="icon-bin" />
      </Button>
    </div>
  )
}

export default SettingsDelete
