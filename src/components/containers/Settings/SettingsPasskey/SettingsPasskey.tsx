import { useContext, useEffect, useState } from 'react'

import { Button } from '@BasicComponents'
import { TextField } from '@ComposedComponents'
import { Account } from '@Entities'
import { AccountContext } from '@Contexts'
import * as Passkey from '@Cryptos/Passkey/Passkey'

import styles from './SettingsPasskey.module.css'

/**
 * Passkey unlock enrollment (Chromium with a platform authenticator only).
 * The passkey wraps the account password: unlocking or confirming a
 * transaction can then be done with the device biometrics instead of
 * typing the password. The password remains the fallback everywhere.
 */
const SettingsPasskey = () => {
  const { accountID } = useContext(AccountContext)
  const [supported, setSupported] = useState(null)
  const [enrolled, setEnrolled] = useState(false)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setSupported(Passkey.isSupported())
  }, [])

  const refreshEnrolled = () => {
    if (!accountID) return
    Account.getPasskeyBlob(accountID).then((blob) => setEnrolled(Boolean(blob)))
  }

  useEffect(() => {
    if (supported) refreshEnrolled()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountID, supported])

  const run = async (action) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      setPassword('')
    } catch (e) {
      setError(e?.message || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const enableHandle = () =>
    run(async () => {
      await Account.enrollPasskey(accountID, password)
      setMessage('Passkey unlock enabled.')
      refreshEnrolled()
    })

  const removeHandle = () =>
    run(async () => {
      await Account.removePasskey(accountID, password)
      setMessage('Passkey unlock removed.')
      refreshEnrolled()
    })

  if (supported === null) return null
  if (!supported) return null

  return (
    <div
      className={styles.section}
      data-testid="settings-passkey"
    >
      <p className={styles.description}>
        Unlock the wallet and confirm transactions with this device&apos;s
        biometrics or screen lock, instead of typing the password. The password
        keeps working as a fallback.
      </p>

      {enrolled ? (
        <>
          <p
            className={styles.status}
            data-testid="passkey-status"
          >
            Passkey unlock is enabled.
          </p>
          <div className={styles.row}>
            <TextField
              label="Password"
              password
              value={password}
              onChangeHandle={setPassword}
            />
            <Button
              onClickHandle={removeHandle}
              disabled={busy || !password}
            >
              Remove passkey
            </Button>
          </div>
        </>
      ) : (
        <>
          <p
            className={styles.status}
            data-testid="passkey-status"
          >
            Passkey unlock is not set up for this account.
          </p>
          <div className={styles.row}>
            <TextField
              label="Password"
              password
              value={password}
              onChangeHandle={setPassword}
            />
            <Button
              onClickHandle={enableHandle}
              disabled={busy || !password}
            >
              Enable passkey unlock
            </Button>
          </div>
        </>
      )}

      {error && (
        <p
          className={styles.error}
          data-testid="passkey-error"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          className={styles.message}
          data-testid="passkey-message"
        >
          {message}
        </p>
      )}
    </div>
  )
}

export default SettingsPasskey
