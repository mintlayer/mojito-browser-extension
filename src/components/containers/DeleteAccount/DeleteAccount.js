import { useState } from 'react'

import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { Button } from '@BasicComponents'
import { Login } from '@ContainerComponents'

import { Account } from '@Entities'

import './DeleteAccount.css'

const DeleteAccount = ({ onDelete, onCancel, account }) => {
  const [step, setStep] = useState(1)
  const nextButonClickHandler = () => setStep(2)
  const buttonExtraStyleClasses = ['popup-delete-button']

  return (
    <CenteredLayout>
      {step === 1 && (
        <VerticalGroup bigGap>
          <VerticalGroup>
            <h2 className="remove-title">
              Are you sure you want to permanently delete your wallet?
            </h2>
            <p className="remove-paragraph">
              All local data associated with this wallet will be permanently
              lost.
            </p>
            <p className="remove-paragraph">This action cannot be undone.</p>
            <p className="remove-paragraph">
              Please make sure that you have securely saved your seed phrase
              before proceeding.
            </p>
            <p className="remove-paragraph">
              Please confirm that you wish to proceed.
            </p>
          </VerticalGroup>
          <VerticalGroup>
            <Button
              onClickHandle={onCancel}
              extraStyleClasses={buttonExtraStyleClasses}
            >
              Cancel
            </Button>
            <Button
              onClickHandle={nextButonClickHandler}
              extraStyleClasses={buttonExtraStyleClasses}
            >
              Continue
            </Button>
          </VerticalGroup>
        </VerticalGroup>
      )}
      {step === 2 && (
        <Login.SetPassword
          onSubmit={onDelete}
          checkPassword={Account.unlockAccount}
          selectedAccount={account}
          buttonTitle="Delete Wallet"
        />
      )}
    </CenteredLayout>
  )
}

export default DeleteAccount
