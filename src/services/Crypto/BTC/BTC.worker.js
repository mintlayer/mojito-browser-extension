import { generateMnemonic, getSeedFromMnemonic } from './BTC'
import { registerWorkerJobs } from 'src/services/Crypto/Worker/WorkerContract'

const WalletWorkerEnum = {
  GENERATE_MNEMONIC: 'GENERATE_MNEMONIC',
  GET_SEED_FROM_MNEMONIC: 'GET_SEED_FROM_MNEMONIC',
}

registerWorkerJobs({
  GENERATE_MNEMONIC: generateMnemonic,
  GET_SEED_FROM_MNEMONIC: getSeedFromMnemonic,
})

export { WalletWorkerEnum }
