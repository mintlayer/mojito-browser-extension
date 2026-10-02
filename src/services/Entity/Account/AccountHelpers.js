import { AppInfo } from '@Constants'
import { ML } from '@Cryptos'
import loadAccountSubRoutines from './loadWorkers'

const getEncryptedPrivateKeys = async (password, salt, mnemonic) => {
  const { generateSeed, generateEncryptionKey, encryptSeed } =
    await loadAccountSubRoutines()
  const { key, salt: usedSalt } = await generateEncryptionKey({
    password,
    salt,
  })
  const seed = await generateSeed(mnemonic)

  const encryptData = async (data) => {
    const payload = await encryptSeed({ data, key })
    if (payload?.error) {
      throw new Error(payload.error)
    }
    const { encryptedData, iv, tag } = payload ?? {}
    if (!encryptedData || !iv || !tag) {
      throw new Error('Encryption returned an incomplete cipher payload')
    }
    return { encryptedData, iv, tag }
  }

  const mlTestnetPrivateKey = ML.getPrivateKeyFromMnemonic(
    mnemonic,
    AppInfo.NETWORK_TYPES.TESTNET,
  )
  const mlMainnetPrivateKey = ML.getPrivateKeyFromMnemonic(
    mnemonic,
    AppInfo.NETWORK_TYPES.MAINNET,
  )

  const {
    encryptedData: encryptedMlTestnetPrivateKey,
    iv: mlTestnetPrivKeyIv,
    tag: mlTestnetPrivKeyTag,
  } = await encryptData(mlTestnetPrivateKey)

  const {
    encryptedData: encryptedMlMainnetPrivateKey,
    iv: mlMainnetPrivKeyIv,
    tag: mlMainnetPrivKeyTag,
  } = await encryptData(mlMainnetPrivateKey)

  const {
    encryptedData: btcEncryptedSeed,
    iv: btcIv,
    tag: btcTag,
  } = await encryptData(seed)

  return {
    salt: usedSalt,
    encryptedMlTestnetPrivateKey,
    encryptedMlMainnetPrivateKey,
    btcEncryptedSeed,
    mlTestnetPrivKeyIv,
    mlMainnetPrivKeyIv,
    btcIv,
    mlTestnetPrivKeyTag,
    mlMainnetPrivKeyTag,
    btcTag,
  }
}

const getEncryptedHtlsSecret = async (password, salt, secret, version) => {
  const { generateEncryptionKey, encryptSeed } = await loadAccountSubRoutines()
  const { key } = await generateEncryptionKey({ password, salt, version })

  const payload = await encryptSeed({ data: secret, key })
  if (payload?.error) {
    throw new Error(payload.error)
  }
  const {
    encryptedData: encryptedHtlsSecret,
    iv: htlsIv,
    tag: htlsTag,
  } = payload ?? {}
  if (!encryptedHtlsSecret || !htlsIv || !htlsTag) {
    throw new Error('Encryption returned an incomplete cipher payload')
  }

  return { encryptedHtlsSecret, htlsIv, htlsTag }
}

export { getEncryptedPrivateKeys, getEncryptedHtlsSecret }
