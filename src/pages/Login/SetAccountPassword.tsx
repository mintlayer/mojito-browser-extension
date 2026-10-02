import { useContext, useEffect, useState } from 'react'
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
  const { accountID, setWalletInfo } = useContext(AccountContext)
  const navigate = useNavigate()
  const [hasPasskey, setHasPasskey] = useState(false)

  useEffect(() => {
    if (!accountID) return
    let cancelled = false
    Account.getPasskeyBlob(accountID).then((blob) => {
      if (!cancelled) setHasPasskey(Boolean(blob))
    })
    return () => {
      cancelled = true
    }
  }, [accountID])

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
        hasPasskey={hasPasskey}
        unlockWithPasskey={Account.unlockAccountWithPasskey}
      />
    </PageWrapper>
  )
}

export default SetAccountPasswordPage
