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

const accountsMigration_02_add_htls_secrets_field = async () => {
  const store = await IndexedDB.loadAccounts()
  const accounts = await IndexedDB.getAll(store)

  if (!accounts || accounts.length <= 0) return

  const needsUpdate = accounts.some(
    (account) =>
      account.htlsSecrets === undefined || account.htlsSecrets === null,
  )
  if (!needsUpdate) return

  const newAccounts = accounts.map((account) => ({
    ...account,
    htlsSecrets:
      account &&
      typeof account.htlsSecrets === 'object' &&
      account.htlsSecrets !== null
        ? account.htlsSecrets
        : {},
  }))

  await IndexedDB.saveAccounts(newAccounts)
}

export {
  accountsMigration_01_add_mlwallet_private_keys,
  accountsMigration_02_add_htls_secrets_field,
}
