import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ListAccounts from '../../commons/components/list-accounts'
import './index.css'

const ListAccountsPage = ({
  accounts = [{ id: 1, name: 'ABC' }],
  onSelect,
  onCreate,
  delay = 0,
}) => {
  const navigate = useNavigate()
  const componentRef = useRef(null)

  const [account, setAccount] = useState(undefined)

  useEffect(() => {
    if (account) {
      removeAnimate(componentRef.current)
    }
  }, [account])

  const goNext = (account) => {
    addAnimate(componentRef.current)

    delay > 0
      ? setTimeout(() => setAccount(account), delay)
      : setAccount(account)
    onSelect && onSelect()
  }

  const addAnimate = (element) => {
    element.classList.add('animate-list-accounts')
  }
  const removeAnimate = (element) => {
    element.classList.remove('animate-list-accounts')
  }

  const goCreate = () => {
    navigate('/set-account')
    onCreate && onCreate()
  }

  const SetAccountPassword = () => <div>Set password</div>

  return (
    <div
      data-testid="generic"
      ref={componentRef}
    >
      {account ? (
        <SetAccountPassword />
      ) : (
        <ListAccounts
          accounts={accounts}
          onSelect={goNext}
          onCreate={goCreate}
        />
      )}
    </div>
  )
}

export default ListAccountsPage
