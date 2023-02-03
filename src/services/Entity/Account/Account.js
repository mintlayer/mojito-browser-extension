import { BTC, BTC_ADDRESS_TYPE_MAP } from '@Cryptos'
import { IndexedDB } from '@Databases'
import { Electrum } from '@APIs'
import loadAccountSubRoutines from './loadWorkers'

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

const loadWalletUsedAddresses = async (wallet, walletType) => {
  const addresses = []
  let index = 0
  let nextAddress = 0

  for (;;) {
    const derivedWallet = BTC.deriveWallet(
      wallet,
      walletType.derivationPath,
      index,
    )
    const address = walletType.getAddressFromPubKey(derivedWallet.publicKey)
    const transactions = JSON.parse(
      await Electrum.getAddressTransactions(address),
    )
    if (transactions.length || index === 0) {
      addresses.push(address)
      index++
    } else {
      nextAddress = address
      break
    }
  }

  return { addresses, nextAddress }
}

const unlockAccount = async (id, password) => {
  const { generateEncryptionKey, decryptSeed } = await loadAccountSubRoutines()

  try {
    const accounts = await IndexedDB.loadAccounts()
    const account = await IndexedDB.get(accounts, id)
    const walletType = BTC_ADDRESS_TYPE_MAP[account.walletType]
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

    const rootWallet = BTC.getWalletFromSeed(Buffer.from(seed))
    const addrs = await loadWalletUsedAddresses(rootWallet, walletType)
    const WIF = rootWallet.toWIF()

    return { WIF, name: account.name, ...addrs }
  } catch (e) {
    console.error(e)
    return Promise.reject({ addresses: '', nextAddress: '', WIF: '', name: '' })
  }
}

export { saveAccount, unlockAccount }
