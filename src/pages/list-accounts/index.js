import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../commons/components/basic/button'
import Carousel from '../../commons/components/carousel/carousel'
import CenteredLayout from '../../commons/components/group/centeredLayout'
import './index.css'

export default function ListAccounts({ accounts, onSelect, onCreate }) {
  const onSelectAccount = (account) => {
    onSelect && onSelect(account)
  }

  const onCreateAccount = () => {
    onCreate && onCreate()
  }

  return (
    <div
      data-testid="list-accounts"
      className="list-accounts"
    >
      <h2 className="subtitle">wallet available</h2>

      <div className="content">
        <Carousel
          accounts={accounts}
          onClick={onSelectAccount}
        />
      </div>

      <div className="footer">
        <CenteredLayout>
          <Button onClickHandle={onCreateAccount}>Create Wallet</Button>
        </CenteredLayout>
      </div>
    </div>
  )
}

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
