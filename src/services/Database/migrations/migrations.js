import { IndexedDB } from '@Databases'

const accountsMigration_01_add_mlwallet_private_keys = async () => {
  // Load the old accounts
  const store = await IndexedDB.loadAccounts()
  const accounts = await IndexedDB.getAll(store)

  // Transform the old accounts to the new structure
  if (!accounts || accounts.length <= 0) return
  const newAccounts = accounts.map((account) => {
    // Add the encrypted private keys to the account
    return {
      ...account,
      iv: { btcIv: account.iv },
      tag: { btcTag: account.tag },
      seed: { btcEncryptedSeed: account.seed },
    }
  })

  await IndexedDB.saveAccounts(newAccounts)
}

export { accountsMigration_01_add_mlwallet_private_keys }
