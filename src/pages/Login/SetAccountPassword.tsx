import { useContext } from 'react'
import { useNavigate } from 'react-router'

import { Login } from '@ContainerComponents'
import { Account } from '@Entities'
import { AccountContext } from '@Contexts'
import { PageWrapper } from '@BasicComponents'

import styles from './SetAccountPassword.module.css'

interface NextAfterUnlock {
  route: string
  state?: Record<string, unknown>
}

interface SetAccountPasswordPageProps {
  nextAfterUnlock?: NextAfterUnlock | null
}

const SetAccountPasswordPage = ({
  nextAfterUnlock,
}: SetAccountPasswordPageProps) => {
  const { setWalletInfo } = useContext(AccountContext)
  const navigate = useNavigate()

  const login = (addresses: unknown, id: string | number, name: string) => {
    setWalletInfo(addresses, id, name)
    if (nextAfterUnlock) {
      navigate(nextAfterUnlock.route, { state: nextAfterUnlock.state })
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <PageWrapper className={styles.pageWrapper}>
      <Login.SetPassword
        onSubmit={login}
        checkPassword={Account.unlockAccount}
      />
    </PageWrapper>
  )
}

export default SetAccountPasswordPage
