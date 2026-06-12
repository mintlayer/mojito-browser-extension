import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { Login } from '@ContainerComponents'
import { PageWrapper } from '@BasicComponents'

import styles from './Login.module.css'

interface Account {
  id: string | number
  name: string
}

interface LoginPageProps {
  accounts?: Account[]
  onSelect?: () => void
  onCreate?: () => void
  delay?: number
}

const LoginPage = ({
  accounts = [],
  onSelect,
  onCreate,
  delay = 0,
}: LoginPageProps) => {
  const navigate = useNavigate()
  const [account, setAccount] = useState<Account | undefined>(undefined)

  useEffect(() => {
    if (!account) return
    navigate('/set-account-password', { state: { account } })
  }, [account, navigate])

  const goNext = (account: Account) => {
    delay > 0
      ? setTimeout(() => setAccount(account), delay)
      : setAccount(account)
    onSelect && onSelect()
  }

  const goCreate = () => {
    navigate('/create-restore', { state: { fromLogin: true } })
    onCreate && onCreate()
  }

  return (
    <PageWrapper className={styles.pageWrapper}>
      <div
        data-testid="generic"
        className={styles.page}
      >
        {!account && (
          <Login.Login
            accounts={accounts}
            onSelect={goNext}
            onCreate={goCreate}
          />
        )}
      </div>
    </PageWrapper>
  )
}

export default LoginPage
