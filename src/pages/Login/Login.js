import { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { PopUp } from '@ComposedComponents'

import { Login, DeleteAccount } from '@ContainerComponents'
import { Account } from '@Entities'
import { useStyleClasses } from '@Hooks'

import { AccountContext } from '@Contexts'

import './Login.css'

const LoginPage = ({
  accounts = [
    { id: 1, name: 'ABC' },
    { id: 2, name: 'RRR' },
    { id: 3, name: 'TTT' },
  ],
  onSelect,
  onCreate,
  delay = 0,
}) => {
  const navigate = useNavigate()
  const { verifyAccountsExistence } = useContext(AccountContext)
  const [account, setAccount] = useState(undefined)
  const [deletingAccount, setDeletingAccount] = useState(undefined)
  const [removeAccountPopupOpen, setRemoveAccountPopupOpen] = useState(false)

  const { styleClasses, addStyleClass, removeStyleClass } = useStyleClasses([])

  useEffect(() => {
    if (!account) return

    removeStyleClass('animate-list-accounts')
    navigate('/set-account-password', { state: { account } })
  }, [account, removeStyleClass, navigate])

  const goNext = (account) => {
    addStyleClass('animate-list-accounts')

    delay > 0
      ? setTimeout(() => setAccount(account), delay)
      : setAccount(account)
    onSelect && onSelect()
  }

  const goCreate = () => {
    navigate('/', { state: { fromLogin: true } })
    onCreate && onCreate()
  }

  const onDeleteClick = (account) => {
    setRemoveAccountPopupOpen(true)
    setDeletingAccount(account)
  }

  const deleteAccountHandler = async () => {
    try {
      await Account.deleteAccount(deletingAccount.id)
      await verifyAccountsExistence()
      navigate('/')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div
      data-testid="generic"
      className={styleClasses}
    >
      {!account && (
        <Login.Login
          account={account}
          accounts={accounts}
          onSelect={goNext}
          onCreate={goCreate}
          onDelete={onDeleteClick}
        />
      )}
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

export default LoginPage
