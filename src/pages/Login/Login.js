import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Login } from '@ContainerComponents'
import { useStyleClasses } from '@Hooks'

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
  const [account, setAccount] = useState(undefined)

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
        />
      )}
    </div>
  )
}

export default LoginPage
