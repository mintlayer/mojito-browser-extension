/* eslint-disable no-restricted-globals */
import { generatePBKDF2Key, encryptAES, decryptAES } from './Cipher'

const CipherWorkerEnum = {
  GENERATE_PBKDF2_KEY: 'GENERATE_PBKDF2_KEY',
  ENCRYPT_AES: 'ENCRYPT_AES',
  DECRYPT_AES: 'DECRYPT_AES',
}

const CipherWorkerJobs = {
  GENERATE_PBKDF2_KEY: generatePBKDF2Key,
  ENCRYPT_AES: encryptAES,
  DECRYPT_AES: decryptAES,
}

const isValidJob = (choosenJob) => {
  if (!choosenJob) return false
  return Object.hasOwn(CipherWorkerJobs, choosenJob)
}

self.onmessage = async ({ data }) => {
  if (!isValidJob(data.job)) return false

  try {
    let jobResult
    data.job === CipherWorkerEnum.DECRYPT_AES
      ? (jobResult = CipherWorkerJobs[data.job](data.data))
      : (jobResult = await CipherWorkerJobs[data.job](data.data))

    postMessage(jobResult)

    return true
  } catch (error) {
    postMessage({ error: error.message })
  }
}

export { CipherWorkerEnum }
