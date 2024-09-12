import { useContext } from 'react'

import { Button } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'

import { ReactComponent as JsonIcon } from '@Assets/images/icon-json.svg'
import { AccountContext } from '@Contexts'
import { Account } from '@Entities'

import './SettingsBackup.css'

const SettingsBackup = () => {
  const buttonExtraClasses = ['settings-backup-button']
  const { accountID, accountName } = useContext(AccountContext)

  const accountObj = {
    id: accountID,
    name: accountName,
  }

  const onBackupWallet = (account) => {
    Account.backupAccountToJSON(account)
  }

  return (
    <div
      className="settings-backup"
      data-testid="settings-testnet"
    >
      <div className="backup-description">
        <VerticalGroup>
          <h2 data-testid="title">BACKUP WALLET</h2>
          <p>
            Backup your wallet to a JSON file. This file contains all the
            information needed to restore your wallet. Keep it safe and secure.
            To restore your wallet, you will need this file and your password.
          </p>
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
