/* eslint-disable no-restricted-globals */
import { generateMnemonic, generateAddr, generateKeysFromMnemonic } from '../crypto/btc'

const WalletWorkerEnum = {
  GENERATE_MNEMONIC: 'GENERATE_MNEMONIC',
  GENERATE_ADDRESS: 'GENERATE_ADDRESS',
  GENERATE_KEYS_FROM_MNEMONIC: 'GENERATE_KEYS_FROM_MNEMONIC'
}

const WalletWorkerJobs = {
  GENERATE_MNEMONIC:  generateMnemonic,
  GENERATE_ADDRESS: generateAddr,
  GENERATE_KEYS_FROM_MNEMONIC: generateKeysFromMnemonic
}

const isValidJob = (choosenJob) => {
  if (!choosenJob) return false
  return Object.hasOwn(WalletWorkerJobs, choosenJob)
}

self.onmessage = ({data}) => {
  if (!isValidJob(data)) return false

  const jobResult = WalletWorkerJobs[data]()
  postMessage(jobResult)

  return true
}

export {
  WalletWorkerEnum
}
