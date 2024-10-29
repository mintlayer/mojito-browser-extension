import { useState, useContext } from 'react'

import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { Button } from '@BasicComponents'
import { Login } from '@ContainerComponents'

import { Account } from '@Entities'
import { AccountContext } from '@Contexts'
import { useNavigate } from 'react-router-dom'

import './DeleteAccount.css'

const DeleteAccount = () => {
  const [step, setStep] = useState(1)
  const {
    logout,
    verifyAccountsExistence,
    deletingAccount,
    setRemoveAccountPopupOpen,
  } = useContext(AccountContext)
  const nextButonClickHandler = () => setStep(2)
  const buttonExtraStyleClasses = ['popup-delete-button']
  const buttonCancelExtraStyleClasses = ['popup-delete-button delete-cancel']
  const navigate = useNavigate()

  const deleteAccountHandler = async (addresses, accountId) => {
    try {
      await Account.deleteAccount(accountId)
      await verifyAccountsExistence()
      navigate('/')
      logout()
      setRemoveAccountPopupOpen(false)
    } catch (e) {
      console.error(e)
    }
  }

  const onCancel = () => {
    setRemoveAccountPopupOpen(false)
  }

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
            <p className="remove-paragraph highlighted">
              This action cannot be undone.
            </p>
            <p className="remove-paragraph">
              Please make sure that you have securely saved your seed phrase
              before proceeding.
            </p>
            <p className="remove-paragraph">
              Please confirm that you wish to proceed.
            </p>
          </VerticalGroup>
          <CenteredLayout>
            <Button
              alternate
              onClickHandle={onCancel}
              extraStyleClasses={buttonCancelExtraStyleClasses}
            >
              Cancel
            </Button>
            <Button
              onClickHandle={nextButonClickHandler}
              extraStyleClasses={buttonExtraStyleClasses}
            >
              Continue
            </Button>
          </CenteredLayout>
        </VerticalGroup>
      )}
      {step === 2 && (
        <Login.SetPassword
          onSubmit={deleteAccountHandler}
          checkPassword={Account.unlockAccount}
          selectedAccount={deletingAccount}
          buttonTitle="Delete Wallet"
        />
      )}
    </CenteredLayout>
  )
}

export default DeleteAccount
