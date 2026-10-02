import '../workerSetup'
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

self.onmessage = async ({ data }) => {
  if (!isValidJob(data.job)) return false

  try {
    const jobResult = await WalletWorkerJobs[data.job](data.data)

    postMessage(jobResult)

    return true
  } catch (error) {
    postMessage({ error: error.message })
  }
}

export { WalletWorkerEnum }
