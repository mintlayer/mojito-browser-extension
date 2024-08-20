import { BTC, ML, BTC_ADDRESS_TYPE_MAP } from '@Cryptos'
import { IndexedDB } from '@Databases'
import * as bitcoin from 'bitcoinjs-lib'
import { AppInfo } from '@Constants'
import { getEncryptedPrivateKeys } from './AccountHelpers'

import loadAccountSubRoutines from './loadWorkers'

const saveAccount = async (data) => {
  const { generateEncryptionKey } = await loadAccountSubRoutines()
  const { name, password, mnemonic, walletType, walletsToCreate } = data
  const { salt } = await generateEncryptionKey({ password })
  const {
    encryptedMlTestnetPrivateKey,
    encryptedMlMainnetPrivateKey,
    btcEncryptedSeed,
    mlTestnetPrivKeyIv,
    mlMainnetPrivKeyIv,
    btcIv,
    mlTestnetPrivKeyTag,
    mlMainnetPrivKeyTag,
    btcTag,
  } = await getEncryptedPrivateKeys(password, salt, mnemonic)

  const account = {
    name,
    salt,
    iv: { btcIv, mlTestnetPrivKeyIv, mlMainnetPrivKeyIv },
    tag: { btcTag, mlTestnetPrivKeyTag, mlMainnetPrivKeyTag },
    seed: {
      btcEncryptedSeed,
      encryptedMlTestnetPrivateKey,
      encryptedMlMainnetPrivateKey,
    },
    walletType,
    walletsToCreate,
  }

  const accounts = await IndexedDB.loadAccounts()
  return await IndexedDB.save(accounts, account)
}

const getAccount = async (id) => {
  const accounts = await IndexedDB.loadAccounts()
  const account = await IndexedDB.get(accounts, id)
  return account
}

const updateAccount = async (id, updates) => {
  const accounts = await IndexedDB.loadAccounts()
  const account = await IndexedDB.get(accounts, id)
  const updatedAccount = { ...account, ...updates }

  await IndexedDB.update(accounts, updatedAccount)

  return updatedAccount
}

const deleteAccount = async (id) => {
  await IndexedDB.deleteAccount(id)
}

const backupAccountToJSON = async (account) => {
  const accountJson = IndexedDB.getAccountJSON(account.id)
  const blob = new Blob([accountJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  // TODO: Change the name of the file
  a.download = `mojito_${account.name}.json`
  a.click()
}

const restoreAccountFromJSON = async (json) => {
  await IndexedDB.restoreAccountFromJSON(json)
}

const unlockAccount = async (id, password) => {
  const mainnetNetwork = bitcoin.networks['bitcoin']
  const testnetNetwork = bitcoin.networks['testnet']

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
      data: account.seed.btcEncryptedSeed,
      iv: account.iv.btcIv,
      tag: account.tag.btcTag,
      key,
    })

    const mlTestnetPrivateKey = await decryptSeed({
      data: account.seed.encryptedMlTestnetPrivateKey,
      iv: account.iv.mlTestnetPrivKeyIv,
      tag: account.tag.mlTestnetPrivKeyTag,
      key,
    })

    const mlMainnetPrivateKey = await decryptSeed({
      data: account.seed.encryptedMlMainnetPrivateKey,
      iv: account.iv.mlMainnetPrivKeyIv,
      tag: account.tag.mlMainnetPrivKeyTag,
      key,
    })

    // this error just exists if the jobe was run in a worker
    /* istanbul ignore next */
    const btcAddressType = BTC_ADDRESS_TYPE_MAP[account.walletType]
    if (seed.error) throw new Error(seed.error)
    const [pubKey, WIF] = BTC.getKeysFromSeed(Buffer.from(seed), btcAddressType)

    if (walletsToCreate.includes('btc')) {
      addresses.btcMainnetAddress = BTC_ADDRESS_TYPE_MAP[
        account.walletType
      ].getAddressFromPubKey(pubKey, mainnetNetwork)
      addresses.btcTestnetAddress = BTC_ADDRESS_TYPE_MAP[
        account.walletType
      ].getAddressFromPubKey(pubKey, testnetNetwork)
    }

    if (walletsToCreate.includes('ml')) {
      // TODO: use only network-related addresses
      const mlTestnetWalletAddresses = await ML.getWalletAddresses(
        mlTestnetPrivateKey,
        AppInfo.NETWORK_TYPES.TESTNET,
        AppInfo.DEFAULT_ML_WALLET_OFFSET,
      )
      addresses.mlTestnetAddresses = mlTestnetWalletAddresses

      const mlMainnetWalletAddresses = await ML.getWalletAddresses(
        mlMainnetPrivateKey,
        AppInfo.NETWORK_TYPES.MAINNET,
        AppInfo.DEFAULT_ML_WALLET_OFFSET,
      )
      addresses.mlMainnetAddresses = mlMainnetWalletAddresses
    }

    return {
      addresses,
      WIF,
      name: account.name,
      mlPrivKeys: { mlMainnetPrivateKey, mlTestnetPrivateKey },
    }
  } catch (e) {
    console.error(e)
    return Promise.reject({
      address: '',
      WIF: '',
      name: '',
      mlPrivKeys: { mlMainnetPrivateKey: '', mlTestnetPrivateKey: '' },
    })
  }
}

export {
  saveAccount,
  unlockAccount,
  updateAccount,
  getAccount,
  deleteAccount,
  backupAccountToJSON,
  restoreAccountFromJSON,
}
