import { BTC, BTC_ADDRESS_TYPE_MAP } from '@Cryptos'
import { IndexedDB } from '@Databases'
import * as bitcoin from 'bitcoinjs-lib'
import { AppInfo } from '@Constants'

import loadAccountSubRoutines from './loadWorkers'

// TODO: walletType has to be changed to btcAddressType after migration

const saveAccount = async (data) => {
  const { generateSeed, generateEncryptionKey, encryptSeed } =
    await loadAccountSubRoutines()
  const { name, password, mnemonic, walletType, walletsToCreate } = data

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
    walletsToCreate,
  }

  const accounts = await IndexedDB.loadAccounts()
  return await IndexedDB.save(accounts, account)
}

const updateAccount = async (id, updates) => {
  const accounts = await IndexedDB.loadAccounts()
  const account = await IndexedDB.get(accounts, id)
  const updatedAccount = { ...account, ...updates }

  await IndexedDB.update(accounts, updatedAccount)

  return updatedAccount
}

const unlockAccount = async (id, password) => {
  const mainnetNetwork = bitcoin.networks[AppInfo.NETWORK_TYPES.MAINNET]
  const testnetNetwork = bitcoin.networks[AppInfo.NETWORK_TYPES.TESTNET]
  const { generateEncryptionKey, decryptSeed } = await loadAccountSubRoutines()
  const addresses = {}

  try {
    const accounts = await IndexedDB.loadAccounts()
    const account = await IndexedDB.get(accounts, id)
    const walletsToCreate =
      account.walletsToCreate || AppInfo.DEFAULT_WALLETS_TO_CREATE

    if (!account.walletsToCreate)
      updateAccount(id, { walletsToCreate: AppInfo.DEFAULT_WALLETS_TO_CREATE })

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

    if (walletsToCreate.includes('btc')) {
      addresses.btcMainnetAddress = BTC_ADDRESS_TYPE_MAP[
        account.walletType
      ].getAddressFromPubKey(pubKey, mainnetNetwork)
      addresses.btcTestnetAddress = BTC_ADDRESS_TYPE_MAP[
        account.walletType
      ].getAddressFromPubKey(pubKey, testnetNetwork)
    }

    if (walletsToCreate.includes('ml')) {
      console.warn('ML wallet not implemented yet.')
      // TODO: Add ML address here
      addresses.mlMainnetAddress = false
      addresses.mlTestnetAddress = false
    }

    return { addresses, WIF, name: account.name }
  } catch (e) {
    console.error(e)
    return Promise.reject({ address: '', WIF: '', name: '' })
  }
}

export { saveAccount, unlockAccount, updateAccount }
