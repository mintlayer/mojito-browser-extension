import loadAccountSubRoutines from '../../../services/Entity/Account/loadWorkers'
import { AppInfo } from '@Constants'
import { ML } from '@Cryptos'

const getEncryptedPrivateKeys = async (password, salt, mnemonic) => {
  const { generateSeed, generateEncryptionKey, encryptSeed } =
    await loadAccountSubRoutines()
  const { key } = await generateEncryptionKey({ password, salt })
  const seed = await generateSeed(mnemonic)

  const encryptData = async (data) => {
    const { encryptedData, iv, tag } = await encryptSeed({ data, key })
    return { encryptedData, iv, tag }
  }

  const mlTestnetPrivateKey = await ML.getPrivateKeyFromMnemonic(
    mnemonic,
    AppInfo.NETWORK_TYPES.TESTNET,
  )
  const mlMainnetPrivateKey = await ML.getPrivateKeyFromMnemonic(
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

export { getEncryptedPrivateKeys }
