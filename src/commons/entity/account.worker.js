import { CipherWorkerEnum } from '../workers/cipherWorker'
import { WalletWorkerEnum } from '../workers/walletWorker'

const getWalletWorker = () => new Worker(new URL('../../commons/workers/walletWorker', import.meta.url))
const getCipherWorker = () => new Worker(new URL('../../commons/workers/cipherWorker', import.meta.url))

const generateNewAccountMnemonic = () => {
  return new Promise((resolve) => {
    const worker = getWalletWorker()
    worker.postMessage({
      job: WalletWorkerEnum.GENERATE_MNEMONIC
    })
    worker.onmessage = ({data}) => {
      worker.terminate()
      resolve(data)
    }
  })
}

const generateSeed = (mnemonic) => {
  return new Promise((resolve) => {
    const worker = getWalletWorker()
    worker.postMessage({
      job: WalletWorkerEnum.GET_SEED_FROM_MNEMONIC,
      data: mnemonic
    })
    worker.onmessage = ({data}) => {
      worker.terminate()
      resolve(data)
    }
  })
}

const generateEncryptionKey = async (password) => {
  return new Promise((resolve) => {
    const worker = getCipherWorker()
    worker.postMessage({
      job: CipherWorkerEnum.GENERATE_PBKDF2_KEY,
      data: password
    })
    worker.onmessage = ({data}) => {
      worker.terminate()
      resolve(data)
    }
  })
}

const encryptSeed = async(seed, key) => {
  return new Promise((resolve) => {
    const worker = getCipherWorker()
    worker.postMessage({
      job: CipherWorkerEnum.ENCRYPT_AES,
      data: {
        data: seed,
        key
      }
    })
    worker.onmessage = ({data}) => {
      worker.terminate()
      resolve(data)
    }
  })
}

const decryptSeed = async ({seed, key, iv, tag}) => {
  return new Promise((resolve) => {
    const worker = getCipherWorker()
    worker.postMessage({
      job: CipherWorkerEnum.DECRYPT_AES,
      data: {
        data: seed,
        key,
        iv,
        tag
      }
    })
    worker.onmessage = ({data}) => {
      worker.terminate()
      resolve(data)
    }
  })
}

export {
  generateNewAccountMnemonic,
  generateSeed,
  generateEncryptionKey,
  encryptSeed,
  decryptSeed
}
