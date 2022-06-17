import { pbkdf2Sync } from 'pbkdf2'
import {
  random as forgeRandom,
  util as forgeUtil,
  cipher as forgeCipher
} from 'node-forge'

const ITERATIONAMOUNT = 20
const KEYSIZE = 16
const IVSIZE = 12

const generateSalt = async (bytesAmount, random = forgeRandom, util = forgeUtil) => {
  const bytes = await random.getBytes(bytesAmount)
  return util.bytesToHex(bytes)
}

const generatePBKDF2Key = async ({password, salt, derivationFn = pbkdf2Sync}) => {
  const currentSalt = salt || await generateSalt(16)

  return {
    key: [...derivationFn(password, currentSalt, ITERATIONAMOUNT, KEYSIZE, 'sha512')],
    salt: currentSalt
  }
}

const generateIV = async (random = forgeRandom) => await random.getBytes(IVSIZE)

const encryptAES = async ({data, key, cipherFn = forgeCipher, util = forgeUtil}) => {
  const IV = await generateIV()
  const cipher = cipherFn.createCipher('AES-GCM', key)

  cipher.start({ iv: IV })
  cipher.update(util.createBuffer(data))
  cipher.finish()

  return {
    encryptedData: cipher.output.toHex(),
    iv: IV,
    tag: cipher.mode.tag.getBytes()
  }
}

const decryptAES = async ({hexdata, key, iv, tag, cipherFn = forgeCipher, util = forgeUtil}) => {
  const decipher = cipherFn.createDecipher('AES-GCM', key)
  const data = util.hexToBytes(hexdata)

  decipher.start({ iv, tag })
  decipher.update(util.createBuffer(data))
  decipher.finish()

  return decipher.output
}

export {
  generateSalt,
  generatePBKDF2Key,
  generateIV,
  encryptAES,
  decryptAES
}
