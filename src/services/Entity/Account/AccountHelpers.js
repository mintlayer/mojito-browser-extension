import { AppInfo } from '@Constants'
import { ML, Cipher } from '@Cryptos'
import loadAccountSubRoutines from './loadWorkers'

const getEnvelopeEncryptedPrivateKeys = async (password, salt, mnemonic) => {
  const { generateSeed, generateEncryptionKey, encryptSeed } =
    await loadAccountSubRoutines()

  const { key: wrappingKey, salt: usedSalt } = await generateEncryptionKey({
    password,
    salt,
    version: Cipher.ENVELOPE_ENCRYPTION_VERSION,
  })

  const dek = await Cipher.generateDek()
  const seed = await generateSeed(mnemonic)

  const encryptData = async (data, field) => {
    const { encryptedData, iv, tag } = await encryptSeed({
      data,
      key: dek,
      aad: Cipher.contentAad(field),
    })
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
  } = await encryptData(mlTestnetPrivateKey, 'encryptedMlTestnetPrivateKey')

  const {
    encryptedData: encryptedMlMainnetPrivateKey,
    iv: mlMainnetPrivKeyIv,
    tag: mlMainnetPrivKeyTag,
  } = await encryptData(mlMainnetPrivateKey, 'encryptedMlMainnetPrivateKey')

  const {
    encryptedData: btcEncryptedSeed,
    iv: btcIv,
    tag: btcTag,
  } = await encryptData(seed, 'btcEncryptedSeed')

  const passwordWrapper = await Cipher.wrapDek({
    dek,
    wrappingKey,
    aad: Cipher.wrapperAad('password'),
  })

  return {
    salt: usedSalt,
    encryptionVersion: Cipher.ENVELOPE_ENCRYPTION_VERSION,
    wrappedDek: { password: passwordWrapper, passkeys: [] },
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

const buildPasskeyWrapper = async ({
  dek,
  credentialId,
  prfSalt,
  prfOutput,
  label,
}) => {
  const wrappingKey = await Cipher.deriveKekFromPrf(prfOutput)
  const { encryptedData, iv, tag } = await Cipher.wrapDek({
    dek,
    wrappingKey,
    aad: Cipher.wrapperAad(credentialId),
  })

  return {
    credentialId,
    prfSalt,
    kdf: Cipher.PASSKEY_KDF,
    label,
    createdAt: Date.now(),
    encryptedData,
    iv,
    tag,
  }
}

const getEncryptedHtlsSecret = async (key, secret, aad) => {
  const { encryptSeed } = await loadAccountSubRoutines()

  const {
    encryptedData: encryptedHtlsSecret,
    iv: htlsIv,
    tag: htlsTag,
  } = await encryptSeed({ data: secret, key, aad })

  return { encryptedHtlsSecret, htlsIv, htlsTag }
}

export {
  getEnvelopeEncryptedPrivateKeys,
  buildPasskeyWrapper,
  getEncryptedHtlsSecret,
}
