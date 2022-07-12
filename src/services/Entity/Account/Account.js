import { getAddressFromPubKey, getKeysFromSeed } from '../../Crypto/BTC/BTC'
import { get, loadAccounts, save } from '../../Database/IndexedDB'

import loadAccountSubRoutines from './loadWorkers'

const saveAccount = async (name, password, mnemonic) => {
  const { generateSeed, generateEncryptionKey, encryptSeed } =
    await loadAccountSubRoutines()

  const seed = await generateSeed(mnemonic)
  const { key, salt } = await generateEncryptionKey({ password })
  const { encryptedData, iv, tag } = await encryptSeed({ data: seed, key })

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
  const { generateEncryptionKey, decryptSeed } = await loadAccountSubRoutines()

  const accounts = await loadAccounts()
  const account = await get(accounts, id)

  const { key } = await generateEncryptionKey({ password, salt: account.salt })
  const seed = await decryptSeed({
    data: account.seed,
    iv: account.iv,
    tag: account.tag,
    key,
  })

  // this error just exists if the jobe was run in a worker
  /* istanbul ignore next */
  if (seed.error) throw new Error(seed.error)

  const [pubKey] = getKeysFromSeed(Buffer.from(seed))
  const address = getAddressFromPubKey(pubKey)

  return address
}

export { saveAccount, unlockAccount }