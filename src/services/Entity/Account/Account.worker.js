import { CipherWorkerEnum } from '../../Crypto/Cipher/Cipher.worker'
import { WalletWorkerEnum } from '../../Crypto/BTC/BTC.worker'
import runWorkerJob from './runWorkerJob'

const getWalletWorker = () =>
  new Worker(new URL('../../Crypto/BTC/BTC.worker', import.meta.url))
const getCipherWorker = () =>
  new Worker(new URL('../../Crypto/Cipher/Cipher.worker', import.meta.url))

const generateNewAccountMnemonic = () => {
  const worker = getWalletWorker()
  return runWorkerJob(worker, WalletWorkerEnum.GENERATE_MNEMONIC)
}

const generateSeed = (mnemonic) => {
  const worker = getWalletWorker()
  return runWorkerJob(worker, WalletWorkerEnum.GET_SEED_FROM_MNEMONIC, mnemonic)
}

const generateEncryptionKey = (password) => {
  const worker = getCipherWorker()
  return runWorkerJob(worker, CipherWorkerEnum.GENERATE_PBKDF2_KEY, password)
}

const encryptSeed = ({ data, key }) => {
  const worker = getCipherWorker()
  return runWorkerJob(worker, CipherWorkerEnum.ENCRYPT_AES, {
    data,
    key,
  })
}

const decryptSeed = ({ data, key, iv, tag }) => {
  const worker = getCipherWorker()
  return runWorkerJob(worker, CipherWorkerEnum.DECRYPT_AES, {
    data,
    key,
    iv,
    tag,
  })
}

export {
  generateNewAccountMnemonic,
  generateSeed,
  generateEncryptionKey,
  encryptSeed,
  decryptSeed,
}
