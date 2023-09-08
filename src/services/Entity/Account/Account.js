import { BTC, BTC_ADDRESS_TYPE_MAP } from '@Cryptos'
import { IndexedDB } from '@Databases'
import * as bitcoin from 'bitcoinjs-lib'

import loadAccountSubRoutines from './loadWorkers'

// walletType has to be changed to btcAddressType after migration

const saveAccount = async (name, password, mnemonic, walletType) => {
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
    walletType,
  }

  const accounts = await IndexedDB.loadAccounts()
  return await IndexedDB.save(accounts, account)
}

const unlockAccount = async (id, password) => {
  const mainnetNetwork = bitcoin.networks['mainnet']
  const testnetNetwork = bitcoin.networks['testnet']
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
    // TODO: Make changes here to support other BTC address types
    const addresses = {
      btcMainnetAddress: BTC_ADDRESS_TYPE_MAP[
        account.walletType
      ].getAddressFromPubKey(pubKey, mainnetNetwork),
      btcTestnetAddress: BTC_ADDRESS_TYPE_MAP[
        account.walletType
      ].getAddressFromPubKey(pubKey, testnetNetwork),
      // TODO: Add ML address here
      mlMainnetAddress: 'mlAddressMain',
      mlTestnetAddress: 'mlAddressTest',
    }

    return { addresses, WIF, name: account.name }
  } catch (e) {
    console.error(e)
    return Promise.reject({ address: '', WIF: '', name: '' })
  }
}

export { saveAccount, unlockAccount }
