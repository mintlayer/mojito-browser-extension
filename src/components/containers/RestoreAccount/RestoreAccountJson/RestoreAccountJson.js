import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { ProgressTracker } from '@ComposedComponents'
import { ReactComponent as IconArrowRight } from '@Assets/images/icon-arrow-right.svg'
import { Account } from '@Entities'
import { AccountContext } from '@Contexts'

import FileUpload from './FileUpload'
import WalletDetails from './WalletDetails'
import RestoreSuccess from './RestoreSuccess'

import styles from './RestoreAccountJson.module.css'

const RestoreAccountJson = () => {
  const navigate = useNavigate()
  const { setCustomBackAction } = useContext(AccountContext)
  const [step, setStep] = useState(1)
  const [errorMessage, setErrorMessage] = useState('')
  const [fileContent, setFileContent] = useState(null)

  const steps = [
    { name: 'Backup file', active: step === 1 },
    { name: 'Wallet details', active: step === 2 },
    { name: 'Finish', active: step === 3 },
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (step === 1 && fileContent && !errorMessage) {
      setStep(step + 1)
    }
    if (step === 2) {
      try {
        Account.restoreAccountFromJSON(fileContent)
        setStep(step + 1)
      } catch {
        setErrorMessage('Error restoring account from JSON file.')
      }
    }
    if (step === 3) {
      navigate('/')
    }
  }

  const isSubmitButtonDisabled = step === 1 && (!fileContent || errorMessage)
  const submitButtonTitles = { 2: 'Restore wallet', 3: 'Go to login' }
  const submitButtonContent = submitButtonTitles[step] || 'Next'

  const customBackAction = () => {
    navigate('/')
  }

  useEffect(() => {
    setCustomBackAction(() => customBackAction)
    return () => setCustomBackAction(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div data-testid="restore-account">
      <ProgressTracker steps={steps} />
      <form
        className={styles.accountForm}
        method="POST"
        data-testid="restore-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap={!errorMessage && step !== 2}
        >
          {step === 1 && (
            <FileUpload
              fileContent={fileContent}
              setFileContent={setFileContent}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
          )}
          {step === 2 && <WalletDetails fileContent={fileContent} />}

          {step === 3 && <RestoreSuccess />}
          <CenteredLayout>
            <Button
              onClickHandle={handleSubmit}
              disabled={isSubmitButtonDisabled}
              extraStyleClasses={[styles.submitButton]}
            >
              {submitButtonContent}
              <IconArrowRight className={styles.submitIcon} />
            </Button>
          </CenteredLayout>
        </VerticalGroup>
      </form>
    </div>
  )
}
export default RestoreAccountJson
