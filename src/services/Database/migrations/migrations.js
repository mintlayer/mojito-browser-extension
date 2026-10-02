const accountsMigration_01_add_mlwallet_private_keys = (account) => ({
  ...account,
  iv: { btcIv: account.iv },
  tag: { btcTag: account.tag },
  seed: { btcEncryptedSeed: account.seed },
})

const accountsMigration_02_add_htls_secrets_field = (account) => {
  const hasSecrets =
    typeof account.htlsSecrets === 'object' && account.htlsSecrets !== null

  return hasSecrets ? account : { ...account, htlsSecrets: {} }
}

const unnest = (field, key) =>
  field && typeof field[key] === 'object' && field[key] !== null
    ? field[key]
    : field

const accountsMigration_03_repair_double_nesting = (account) => ({
  ...account,
  iv: unnest(account.iv, 'btcIv'),
  tag: unnest(account.tag, 'btcTag'),
  seed: unnest(account.seed, 'btcEncryptedSeed'),
})

const ACCOUNT_MIGRATIONS = [
  accountsMigration_01_add_mlwallet_private_keys,
  accountsMigration_02_add_htls_secrets_field,
  accountsMigration_03_repair_double_nesting,
]

const migrateAccount = (account, oldVersion) =>
  ACCOUNT_MIGRATIONS.slice(oldVersion - 1).reduce(
    (migrated, migrate) => migrate(migrated),
    account,
  )

export {
  accountsMigration_01_add_mlwallet_private_keys,
  accountsMigration_02_add_htls_secrets_field,
  accountsMigration_03_repair_double_nesting,
  ACCOUNT_MIGRATIONS,
  migrateAccount,
}
