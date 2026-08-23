import { useState, useEffect, useContext, useCallback } from 'react'

import { Error } from '@BasicComponents'
import { TextField } from '@ComposedComponents'
import { AccountContext } from '@Contexts'
import { Account } from '@Entities'
import { Passkey } from '@Cryptos'
import { ReactComponent as PasskeyIcon } from '@Assets/images/icon-passkey.svg'
import { ReactComponent as PlusIcon } from '@Assets/images/icon-plus.svg'

import styles from './SettingsPasskey.module.css'

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'This device'

const SettingsPasskey = () => {
  const { accountID } = useContext(AccountContext)
  const [passkeys, setPasskeys] = useState([])
  const [password, setPassword] = useState('')
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const supported = Passkey.isSupported()

  const refresh = useCallback(async () => {
    if (!accountID) return
    setPasskeys(await Account.getPasskeys(accountID))
  }, [accountID])

  useEffect(() => {
    refresh()
  }, [refresh])

  const closeForm = () => {
    setAdding(false)
    setPassword('')
    setError('')
  }

  const submitAdding = async () => {
    setBusy(true)
    setError('')

    try {
      await Account.enrollPasskey({
        accountId: accountID,
        password,
        label: `Passkey ${passkeys.length + 1}`,
      })
      setAdding(false)
      setPassword('')
      await refresh()
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Could not add the passkey')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (credentialId) => {
    setError('')

    try {
      await Account.removePasskey({ accountId: accountID, credentialId })
      await refresh()
    } catch {
      setError('Could not remove the passkey')
    }
  }

  return (
    <div
      className={styles.container}
      data-testid="settings-passkey-component"
    >
      <h2 data-testid="title">Passkeys</h2>

      {!supported ? (
        <p className={styles.notice}>
          This browser cannot use passkeys for a wallet.
        </p>
      ) : (
        <>
          <p className={styles.description}>
            Your password keeps working and stays the only way to recover the
            wallet. Removing a passkey stops it opening this wallet, but backups
            exported earlier still accept it.
          </p>

          {passkeys.length ? (
            <ul className={styles.list}>
              {passkeys.map((passkey) => (
                <li
                  key={passkey.credentialId}
                  className={styles.item}
                >
                  <PasskeyIcon className={styles.itemIcon} />
                  <span className={styles.itemText}>
                    <span className={styles.itemLabel}>{passkey.label}</span>
                    <span className={styles.itemMeta}>
                      Added {formatDate(passkey.createdAt)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={() => remove(passkey.credentialId)}
                    data-testid={`remove-passkey-${passkey.credentialId}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No passkeys yet.</p>
          )}

          {adding ? (
            <div className={styles.form}>
              <h3 className={styles.formTitle}>Confirm with your password</h3>
              <TextField
                value={password}
                onChangeHandle={setPassword}
                password
                placeHolder="Password"
              />
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={closeForm}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirm}
                  onClick={submitAdding}
                  disabled={busy || !password}
                  data-testid="confirm-passkey"
                >
                  {busy ? 'Waiting for your device...' : 'Confirm'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.add}
              onClick={() => {
                setError('')
                setAdding(true)
              }}
              data-testid="add-passkey"
            >
              <PlusIcon />
              Add passkey
            </button>
          )}

          <Error error={error} />
        </>
      )}
    </div>
  )
}

export default SettingsPasskey
