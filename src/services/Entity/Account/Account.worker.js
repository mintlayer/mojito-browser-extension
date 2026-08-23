import { CipherWorkerEnum } from 'src/services/Crypto/Cipher/Cipher.worker'
import { WalletWorkerEnum } from 'src/services/Crypto/BTC/BTC.worker'
import { getWorkerError } from 'src/services/Crypto/Worker/WorkerContract'

const getWalletWorker = () =>
  new Worker(new URL('../../Crypto/BTC/BTC.worker', import.meta.url))
const getCipherWorker = () =>
  new Worker(new URL('../../Crypto/Cipher/Cipher.worker', import.meta.url))

const runJob = (createWorker, message) =>
  new Promise((resolve, reject) => {
    const worker = createWorker()

    worker.onmessage = ({ data }) => {
      worker.terminate()

      const error = getWorkerError(data)
      if (error) return reject(new Error(error))

      resolve(data)
    }

    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message || 'Worker failed'))
    }

    worker.postMessage(message)
  })

const generateNewAccountMnemonic = () =>
  runJob(getWalletWorker, { job: WalletWorkerEnum.GENERATE_MNEMONIC })

const generateSeed = (mnemonic) =>
  runJob(getWalletWorker, {
    job: WalletWorkerEnum.GET_SEED_FROM_MNEMONIC,
    data: mnemonic,
  })

// These forward their whole payload on purpose: re-listing the fields here is how
// the aad argument was silently dropped before.
const generateEncryptionKey = async (payload) =>
  runJob(getCipherWorker, {
    job: CipherWorkerEnum.GENERATE_PBKDF2_KEY,
    data: payload,
  })

const encryptSeed = async (payload) =>
  runJob(getCipherWorker, {
    job: CipherWorkerEnum.ENCRYPT_AES,
    data: payload,
  })

const decryptSeed = async (payload) =>
  runJob(getCipherWorker, {
    job: CipherWorkerEnum.DECRYPT_AES,
    data: payload,
  })

export {
  runJob,
  generateNewAccountMnemonic,
  generateSeed,
  generateEncryptionKey,
  encryptSeed,
  decryptSeed,
}
