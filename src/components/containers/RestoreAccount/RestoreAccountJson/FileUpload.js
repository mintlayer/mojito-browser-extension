import React, { useState, useRef } from 'react'

import { Error } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { ReactComponent as IconUpload } from '@Assets/images/icon-upload.svg'
import { ReactComponent as IconDocument } from '@Assets/images/icon-document.svg'
import { AppInfo } from '@Constants'

import styles from './FileUpload.module.css'

const requiredKeys = {
  id: 'number',
  iv: {
    btcIv: 'string',
    mlTestnetPrivKeyIv: 'string',
    mlMainnetPrivKeyIv: 'string',
  },
  name: 'string',
  salt: 'string',
  tag: {
    btcTag: 'string',
    mlTestnetPrivKeyTag: 'string',
    mlMainnetPrivKeyTag: 'string',
  },
  seed: {
    btcEncryptedSeed: 'string',
    encryptedMlMainnetPrivateKey: 'string',
    encryptedMlTestnetPrivateKey: 'string',
  },
  walletType: 'string',
  walletsToCreate: ['string'],
}

const validateKeys = (json, required) => {
  return Object.keys(required).every((key) => {
    if (!(key in json)) return false
    const requiredType = required[key]
    const valueType = typeof json[key]

    if (Array.isArray(requiredType)) {
      return (
        Array.isArray(json[key]) &&
        json[key].every((item) => typeof item === requiredType[0])
      )
    }

    if (valueType === 'object' && !Array.isArray(json[key])) {
      if (!json[key]) return false
      return validateKeys(json[key], requiredType)
    }

    return valueType === requiredType
  })
}

// Encrypted material is hex or base64; enforce only plausibility so legacy
// backups with missing/extra fields are not rejected.
const MIN_SECRET_LENGTH = 16
const MAX_SECRET_LENGTH = 4096
const SECRET_PATTERN = /^[0-9a-zA-Z+/=]+$/

const isPlausibleSecret = (value) =>
  typeof value === 'string' &&
  value.length >= MIN_SECRET_LENGTH &&
  value.length <= MAX_SECRET_LENGTH &&
  SECRET_PATTERN.test(value)

const SECRET_GROUPS = ['iv', 'tag', 'seed']

const validateContent = (json) => {
  if (json.salt !== undefined && !isPlausibleSecret(json.salt)) return false
  for (const groupName of SECRET_GROUPS) {
    const group = json[groupName]
    if (!group) continue
    for (const value of Object.values(group)) {
      if (!isPlausibleSecret(value)) return false
    }
  }
  return true
}

const FileUpload = ({
  fileContent,
  setFileContent,
  errorMessage,
  setErrorMessage,
}) => {
  const fileInputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const processFile = (file) => {
    if (file.size > AppInfo.MAX_UPLOAD_FILE_SIZE) {
      setErrorMessage('The file size exceeds the maximum limit of 2 KB.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        const json = JSON.parse(content)
        const isValid =
          json &&
          typeof json === 'object' &&
          validateKeys(json, requiredKeys) &&
          validateContent(json)

        if (isValid) {
          setFileContent(json)
          setErrorMessage('')
        } else {
          setErrorMessage(
            'The JSON file does not contain all required keys or has invalid values.',
          )
        }
      } catch {
        setErrorMessage('Invalid JSON file.')
      }
    }
    reader.onerror = () => {
      setErrorMessage('Error reading the file. Please try again.')
    }
    reader.onabort = () => {
      setErrorMessage('File reading was aborted. Please try again.')
    }
    reader.readAsText(file)
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) processFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDropzoneClick = () => {
    fileInputRef.current.click()
  }

  const dropzoneClasses = [styles.dropzone]
  if (isDragOver) dropzoneClasses.push(styles.dropzoneActive)
  if (fileContent) dropzoneClasses.push(styles.dropzoneUploaded)

  return (
    <CenteredLayout>
      <VerticalGroup>
        <h2 className={styles.title}>Select backup file</h2>
        <p className={styles.subtitle}>
          Choose the JSON file exported from Mojito Wallet
        </p>
        <div
          className={dropzoneClasses.join(' ')}
          onClick={handleDropzoneClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {fileContent ? (
            <>
              <div className={styles.uploadedIconWrapper}>
                <IconDocument className={styles.uploadedIcon} />
              </div>
              <p className={styles.uploadedFileName}>{fileName}</p>
              <p className={styles.uploadedStatus}>Ready to import</p>
              <p className={styles.uploadedChange}>
                Click to choose a different file
              </p>
            </>
          ) : (
            <>
              <div className={styles.iconWrapper}>
                <IconUpload className={styles.uploadIcon} />
              </div>
              <p className={styles.dropzoneText}>
                Drag & drop or click to upload
              </p>
              <p className={styles.dropzoneHint}>JSON backup file</p>
            </>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className={styles.hidden}
          accept=".json"
          onChange={handleFileChange}
          data-testid="file-input"
        />
        {errorMessage && <Error error={errorMessage} />}
      </VerticalGroup>
    </CenteredLayout>
  )
}

export default FileUpload
