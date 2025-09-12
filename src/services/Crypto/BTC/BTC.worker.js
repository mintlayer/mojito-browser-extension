/* eslint-disable no-restricted-globals */
import { generateMnemonic, getSeedFromMnemonic } from './BTC'

const WalletWorkerEnum = {
  GENERATE_MNEMONIC: 'GENERATE_MNEMONIC',
  GET_SEED_FROM_MNEMONIC: 'GET_SEED_FROM_MNEMONIC',
}

const WalletWorkerJobs = {
  GENERATE_MNEMONIC: generateMnemonic,
  GET_SEED_FROM_MNEMONIC: getSeedFromMnemonic,
}

const isValidJob = (choosenJob) => {
  if (!choosenJob) return false
  return Object.hasOwn(WalletWorkerJobs, choosenJob)
}

self.onmessage = ({ data }) => {
  if (!isValidJob(data.job)) return false

  const jobResult = WalletWorkerJobs[data.job](data.data)
  postMessage(jobResult)

  return true
}

export { WalletWorkerEnum }
