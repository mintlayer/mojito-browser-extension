import { generatePBKDF2Key, encryptAES, decryptAES } from './Cipher'
import { registerWorkerJobs } from 'src/services/Crypto/Worker/WorkerContract'

const CipherWorkerEnum = {
  GENERATE_PBKDF2_KEY: 'GENERATE_PBKDF2_KEY',
  ENCRYPT_AES: 'ENCRYPT_AES',
  DECRYPT_AES: 'DECRYPT_AES',
}

registerWorkerJobs({
  GENERATE_PBKDF2_KEY: generatePBKDF2Key,
  ENCRYPT_AES: encryptAES,
  DECRYPT_AES: decryptAES,
})

export { CipherWorkerEnum }
