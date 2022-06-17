
import { get, loadAccounts, save } from '../db/db'
import {
  generateNewAccountMnemonic,
  generateSeed,
  generateEncryptionKey,
  encryptSeed,
  decryptSeed
} from './account.worker'

const saveAccount = async (name, password, mnemonic) => {
  const seed = await generateSeed(mnemonic)
  console.log('Seed generated:')
  console.log(seed)
  const {key, salt} = await generateEncryptionKey({password})
  const {encryptedData, iv, tag} = await encryptSeed(seed, key)

  const account = {
    name,
    salt,
    iv,
    tag,
    seed: encryptedData,
  }

  const accounts = await loadAccounts()
  return await save(accounts, account)
}

const unlockAccount = async (id, password) => {
  const accounts = await loadAccounts()
  const account = await get(accounts, id)

  const {key} = await generateEncryptionKey({password, salt: account.salt})
  const seed = await decryptSeed({
    seed: account.seed,
    iv: account.iv,
    tag: account.tag,
    key
  })
  return seed
}

export {
  generateNewAccountMnemonic,
  saveAccount,
  unlockAccount
}
