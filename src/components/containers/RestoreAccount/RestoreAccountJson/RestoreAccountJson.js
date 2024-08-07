import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, Error } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { ProgressTracker, Header } from '@ComposedComponents'

import { Account } from '@Entities'

import './RestoreAccountJson.css'

const RestoreAccountJson = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const fileInputRef = useRef(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [fileContent, setFileContent] = useState(null)
  const [fileName, setFileName] = useState('')
  const uploadButtonExtraClasses = ['restore-upload-button']

  const steps = [
    { name: 'Backup file', active: step === 1 },
    { name: 'Wallet details', active: step === 2 },
    { name: 'Confirm', active: step === 3 },
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
      } catch (error) {
        setErrorMessage('Error restoring account from JSON file.')
      }
    }
    if (step === 3) {
      navigate('/')
    }
  }

  const isSubmitButtonDisabled = step === 1 && (!fileContent || errorMessage)
  const uploadButtonContent = !fileContent
    ? 'Upload JSON file'
    : `Uploaded: ${fileName}`
  const submitButtonContent = step === 3 ? 'Finish' : 'Next'
  const walletsToCreate = fileContent
    ? fileContent.walletsToCreate
        .map((wallet) => wallet.toUpperCase())
        .join(', ')
    : ''

  const customBackAction = () => {
    navigate('/')
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target.result
          const json = JSON.parse(content)

          // Define the required keys
          const requiredKeys = [
            'name',
            'salt',
            'iv',
            'tag',
            'seed',
            'walletType',
            'walletsToCreate',
            'id',
          ]

          // Check if all required keys are present
          const hasAllKeys = requiredKeys.every((key) => key in json)

          //Check if keys is not empty
          const keysNotEmpty = requiredKeys.every((key) => json[key] !== '')

          if (hasAllKeys && keysNotEmpty) {
            setFileContent(json)
            setErrorMessage('')
          } else {
            setErrorMessage('The JSON file does not contain all required keys.')
          }
        } catch (error) {
          setErrorMessage('Invalid JSON file.')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleUploadButtonClick = () => {
    fileInputRef.current.click()
  }

  return (
    <div data-testid="restore-account">
      <Header customBackAction={customBackAction} />
      <ProgressTracker steps={steps} />
      <form
        className={'account-form-json'}
        method="POST"
        data-testid="restore-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap
        >
          {step === 1 && (
            <CenteredLayout>
              <VerticalGroup data-step={step}>
                <h2 className="restore-wallet-title">
                  Select your backup file
                </h2>
                <p className="restore-wallet-description">
                  Please select the backup file you want to restore your wallet
                  from.
                </p>
                <Button
                  onClickHandle={handleUploadButtonClick}
                  extraStyleClasses={uploadButtonExtraClasses}
                  alternate
                >
                  {uploadButtonContent}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".json"
                  onChange={handleFileChange}
                />
                {errorMessage && <Error error={errorMessage} />}
              </VerticalGroup>
            </CenteredLayout>
          )}
          {step === 2 && (
            <CenteredLayout>
              <VerticalGroup data-step={step}>
                <h2 className="restore-wallet-title">Wallet details</h2>
                <p>Name: {fileContent.name}</p>
                <p>ID: {fileContent.id}</p>
                <p>Wallets: {walletsToCreate}</p>
              </VerticalGroup>
            </CenteredLayout>
          )}

          {step === 3 && (
            <CenteredLayout>
              <VerticalGroup
                bigGap
                data-step={step}
              >
                <h2 className="restore-wallet-title">Congraduation!</h2>
                <p className="restore-wallet-description">
                  You have successfully restored your wallet. Please go to the
                  login page to access your account.
                </p>
                <p className="restore-wallet-description">
                  Remember to keep your recovery details safe and secure.
                </p>
              </VerticalGroup>
            </CenteredLayout>
          )}
          <CenteredLayout>
            <Button
              onClickHandle={handleSubmit}
              disabled={isSubmitButtonDisabled}
            >
              {submitButtonContent}
            </Button>
          </CenteredLayout>
        </VerticalGroup>
      </form>
    </div>
  )
}
export default RestoreAccountJson
