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
      return validateKeys(json[key], requiredType)
    }

    return valueType === requiredType
  })
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
        const isValid = validateKeys(json, requiredKeys)

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
          style={{ display: 'none' }}
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
