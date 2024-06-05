import { useState, useContext } from 'react'

import { Button } from '@BasicComponents'
import { PopUp } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { DeleteAccount } from '@ContainerComponents'

import { ReactComponent as BinIcon } from '@Assets/images/icon-bin.svg'
import { AccountContext } from '@Contexts'
import { Account } from '@Entities'
import { useNavigate } from 'react-router-dom'

import './SettingsDelete.css'

const SettingsDelete = () => {
  const buttonExtraClasses = ['settings-delete-button']

  const navigate = useNavigate()
  const [deletingAccount, setDeletingAccount] = useState(undefined)
  const [removeAccountPopupOpen, setRemoveAccountPopupOpen] = useState(false)
  const { verifyAccountsExistence, logout, accountID, accountName } =
    useContext(AccountContext)

  const currentAccount = { id: accountID, name: accountName }

  const onDeleteClick = (account) => {
    setRemoveAccountPopupOpen(true)
    setDeletingAccount(account)
  }

  const deleteAccountHandler = async () => {
    try {
      await Account.deleteAccount(deletingAccount.id)
      await verifyAccountsExistence()
      logout()
      navigate('/')
    } catch (e) {
      console.error(e)
    }
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

      {removeAccountPopupOpen && (
        <PopUp setOpen={setRemoveAccountPopupOpen}>
          <DeleteAccount
            onDelete={deleteAccountHandler}
            onCancel={() => setRemoveAccountPopupOpen(false)}
            account={deletingAccount}
          />
        </PopUp>
      )}
    </div>
  )
}

export default SettingsDelete
