import { pbkdf2Sync } from 'pbkdf2'
import {
  random as forgeRandom,
  util as forgeUtil,
  cipher as forgeCipher
} from 'node-forge'

const ITERATIONAMOUNT = 10_000
const KEYSIZE = 16
const IVSIZE = 12
const SALTSIZE = 16


const hexToBytes = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))

const generateSalt = async (bytesAmount, random = forgeRandom, util = forgeUtil) => {
  const bytes = await random.getBytes(bytesAmount)
  return util.bytesToHex(bytes)
}

const generatePBKDF2Key = async ({password, salt, derivationFn = pbkdf2Sync}) => {
  const currentSalt = salt || await generateSalt(SALTSIZE)
  const key = [...derivationFn(password, currentSalt, ITERATIONAMOUNT, KEYSIZE, 'sha512')]

  return {
    key,
    salt: currentSalt
  }
}

const generateIV = async (random = forgeRandom) => await random.getBytes(IVSIZE)

const encryptAES = async ({data, key, cipherFn = forgeCipher, util = forgeUtil}) => {
  const IV = await generateIV()
  const cipher = cipherFn.createCipher('AES-GCM', key)
  const hex = Buffer.from(data).toString('hex')

  cipher.start({ iv: IV })
  cipher.update(util.createBuffer(hex))
  cipher.finish()

  return {
    encryptedData: cipher.output.getBytes(),
    iv: IV,
    tag: cipher.mode.tag.getBytes()
  }
}

const decryptAES = ({data, key, iv, tag, cipherFn = forgeCipher, util = forgeUtil}) => {
  const decipher = cipherFn.createDecipher('AES-GCM', key)

  decipher.start({ iv, tag })
  decipher.update(util.createBuffer(data))
  const result = decipher.finish()

  if (!result) throw new Error('Wrong password')
  return hexToBytes(decipher.output.data)
}

export {
  IVSIZE,
  generateSalt,
  generatePBKDF2Key,
  generateIV,
  encryptAES,
  decryptAES,
  hexToBytes
}
