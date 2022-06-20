import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Carousel from '../../commons/components/carousel/carousel'
import './index.css'

// Container Component
export function ListAccountsContainer({
  accounts = [{ id: 1, name: 'ABC' }],
  onSelect,
  onCreate,
  delay = 0,
}) {
  const navigate = useNavigate()
  const componentRef = useRef(null)

  const [account, setAccount] = useState(undefined)

  useEffect(() => {
    if (account) {
      removeAnimate(componentRef.current)
    }
  }, [account])

  function goNext(account) {
    addAnimate(componentRef.current)

    delay > 0
      ? setTimeout(() => setAccount(account), delay)
      : setAccount(account)
    onSelect && onSelect()
  }

  function addAnimate(element) {
    element.classList.add('animate-list-accounts')
  }
  function removeAnimate(element) {
    element.classList.remove('animate-list-accounts')
  }

  function goCreate() {
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

// Presentational Component
export default function ListAccounts({ accounts, onSelect, onCreate }) {
  function onSelectAccount(account) {
    onSelect && onSelect(account)
  }

  function onCreateAccount() {
    onCreate && onCreate()
  }

  return (
    <div
      data-testid="list-accounts"
      className="list-accounts"
    >
      <div className="subtitle">
        <h2>wallet available</h2>
      </div>

      <div className="content">
        <Carousel
          accounts={accounts}
          onClick={onSelectAccount}
        />
      </div>

      <div className="footer">
        <button onClick={onCreateAccount}>create wallet</button>
      </div>
    </div>
  )
}
