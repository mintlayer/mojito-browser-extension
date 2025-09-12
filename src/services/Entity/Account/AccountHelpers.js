import { AppInfo } from '@Constants'
import { ML } from '@Cryptos'
import loadAccountSubRoutines from './loadWorkers'

const getEncryptedPrivateKeys = async (password, salt, mnemonic) => {
  const { generateSeed, generateEncryptionKey, encryptSeed } =
    await loadAccountSubRoutines()
  const { key } = await generateEncryptionKey({ password, salt })
  const seed = await generateSeed(mnemonic)

  const encryptData = async (data) => {
    const { encryptedData, iv, tag } = await encryptSeed({ data, key })
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

const getEncryptedHtlsSecret = async (password, salt, secret) => {
  const { generateEncryptionKey, encryptSeed } = await loadAccountSubRoutines()
  const { key } = await generateEncryptionKey({ password, salt })

  const {
    encryptedData: encryptedHtlsSecret,
    iv: htlsIv,
    tag: htlsTag,
  } = await encryptSeed({ data: secret, key })

  return { encryptedHtlsSecret, htlsIv, htlsTag }
}

export { getEncryptedPrivateKeys, getEncryptedHtlsSecret }
