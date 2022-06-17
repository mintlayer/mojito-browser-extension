import { pbkdf2Sync } from 'pbkdf2'
import {
  random as forgeRandom,
  util as forgeUtil,
  cipher as forgeCipher
} from 'node-forge'

const ITERATIONAMOUNT = 20
const KEYSIZE = 16
const IVSIZE = 12

const hexToBytes = (hexString) => Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

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
  const hex = util.bytesToHex(data)

  cipher.start({ iv: IV })
  cipher.update(util.createBuffer(hex))
  cipher.finish()
  return {
    encryptedData: cipher.output.getBytes(),
    iv: IV,
    tag: cipher.mode.tag.getBytes()
  }
}

const decryptAES = async ({data, key, iv, tag, cipherFn = forgeCipher, util = forgeUtil}) => {
  const decipher = cipherFn.createDecipher('AES-GCM', key)

  decipher.start({ iv, tag })
  decipher.update(util.createBuffer(data))
  decipher.finish()

  return hexToBytes(decipher.output.data)
}

export {
  generateSalt,
  generatePBKDF2Key,
  generateIV,
  encryptAES,
  decryptAES
}
