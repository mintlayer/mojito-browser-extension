import { BTC } from '@Cryptos'
import { IndexedDB } from '@Databases'

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

  const accounts = await IndexedDB.loadAccounts()
  return await IndexedDB.save(accounts, account)
}

const unlockAccount = async (id, password) => {
  const { generateEncryptionKey, decryptSeed } = await loadAccountSubRoutines()

  try {
    const accounts = await IndexedDB.loadAccounts()
    const account = await IndexedDB.get(accounts, id)

    const { key } = await generateEncryptionKey({
      password,
      salt: account.salt,
    })
    const seed = await decryptSeed({
      data: account.seed,
      iv: account.iv,
      tag: account.tag,
      key,
    })

    // this error just exists if the jobe was run in a worker
    /* istanbul ignore next */
    if (seed.error) throw new Error(seed.error)

    const [pubKey, WIF] = BTC.getKeysFromSeed(Buffer.from(seed))
    const address = BTC.getAddressFromPubKey(pubKey)
    return { address, WIF, name: account.name }
  } catch (e) {
    console.error(e)
    return Promise.reject({ address: '', WIF: '', name: '' })
  }
}

export { saveAccount, unlockAccount }
