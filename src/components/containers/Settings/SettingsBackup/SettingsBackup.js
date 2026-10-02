import { useState, useContext } from 'react'

import { Button, Error } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'

import { ReactComponent as JsonIcon } from '@Assets/images/icon-json.svg'
import { AccountContext } from '@Contexts'
import { Account } from '@Entities'

import './SettingsBackup.css'

const SettingsBackup = () => {
  const buttonExtraClasses = ['settings-backup-button']
  const { accountID, accountName } = useContext(AccountContext)
  const [errorMessage, setErrorMessage] = useState('')

  const accountObj = {
    id: accountID,
    name: accountName,
  }

  const onBackupWallet = async (account) => {
    setErrorMessage('')
    if (!account.id) {
      setErrorMessage('No wallet is available to back up.')
      return
    }
    try {
      await Account.backupAccountToJSON(account)
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error?.code === 'ENCRYPTION_OUTDATED'
          ? error.message
          : 'Backup failed. Please try again.',
      )
    }
  }

  return (
    <div
      className="settings-backup"
      data-testid="settings-backup-component"
    >
      <div className="backup-description">
        <VerticalGroup>
          <h2 data-testid="title">Backup wallet</h2>
          <p>
            Backup your wallet to a JSON file. This file contains all the
            information needed to restore your wallet. Keep it safe and secure.
            To restore your wallet, you will need this file and your password.
          </p>
          {errorMessage && <Error error={errorMessage} />}
        </VerticalGroup>
      </div>
      <Button
        onClickHandle={() => onBackupWallet(accountObj)}
        extraStyleClasses={buttonExtraClasses}
      >
        <JsonIcon className="icon-json" />
      </Button>
    </div>
  )
}

export default SettingsBackup
