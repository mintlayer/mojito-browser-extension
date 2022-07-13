import { EnvVars } from '@Constants'

/**
 * This files is needed because Jest cannot run with WebWorkers
 * or `url.meta.url`
 * So, for test environment, the actions runs with direct import
 * instead of running through a WebWorker.
 */

const loadAccountSubRoutines = async () => {
  let generateNewAccountMnemonic,
    generateSeed,
    generateEncryptionKey,
    encryptSeed,
    decryptSeed

  /* istanbul ignore if */
  if (EnvVars.USE_WEB_WORKERS) {
    const workers = await import('./Account.worker')
    generateNewAccountMnemonic = workers.generateNewAccountMnemonic
    generateSeed = workers.generateSeed
    generateEncryptionKey = workers.generateEncryptionKey
    encryptSeed = workers.encryptSeed
    decryptSeed = workers.decryptSeed
  } else {
    const walletFunctions = await import('../../Crypto/BTC/BTC')
    const cipherFunctions = await import('../../Crypto/Cipher/Cipher')

    generateNewAccountMnemonic = walletFunctions.generateMnemonic
    generateSeed = walletFunctions.getSeedFromMnemonic
    generateEncryptionKey = cipherFunctions.generatePBKDF2Key
    encryptSeed = cipherFunctions.encryptAES
    decryptSeed = cipherFunctions.decryptAES
  }

  return {
    generateNewAccountMnemonic,
    generateSeed,
    generateEncryptionKey,
    encryptSeed,
    decryptSeed,
  }
}

export default loadAccountSubRoutines
