// Passkey (WebAuthn PRF) service — Chromium-only.
//
// SECURITY CONTRACT: the platform authenticator (Touch ID / Windows Hello /
// Chrome profile) derives a deterministic secret via the WebAuthn `prf`
// extension. That secret becomes an AES-GCM key used ONLY to wrap/unwrap the
// account password in memory, exactly as if the user had typed it. The PRF
// output and the derived key never leave memory; only the wrapped blob
// (salt/iv/ciphertext + credential id) is persisted on the account. The
// account password remains the always-available recovery path.

const PRF_SALT_BYTES = 32
const PRF_IDENTIFIER = 'mojito-passkey-unlock-v1'

const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

const base64ToBuffer = (base64) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export const isSupported = () =>
  typeof window !== 'undefined' &&
  typeof window.PublicKeyCredential === 'function' &&
  typeof window.PublicKeyCredential
    ?.userVerifyingPlatformAuthenticatorAvailable === 'function' &&
  window.PublicKeyCredential.userVerifyingPlatformAuthenticatorAvailable()

// The prf extension must be reported as enabled for our credential, and the
// creation/get assertions must return the evaluated secret.
const prfResultsOf = (credential) => {
  const extensions = credential?.getClientExtensionResults?.()
  return extensions?.prf?.results?.first ?? null
}

const prfCreationOptions = (salt) => ({
  challenge: crypto.getRandomValues(new Uint8Array(32)),
  rp: { name: 'Mojito Wallet' },
  user: {
    id: crypto.getRandomValues(new Uint8Array(16)),
    name: PRF_IDENTIFIER,
    displayName: 'Mojito Wallet unlock',
  },
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 },
    { type: 'public-key', alg: -257 },
  ],
  authenticatorSelection: {
    userVerification: 'required',
    residentKey: 'required',
  },
  extensions: { prf: { eval: { first: salt } } },
})

const prfRequestOptions = (credentialId, salt) => ({
  challenge: crypto.getRandomValues(new Uint8Array(32)),
  allowCredentials: [{ type: 'public-key', id: credentialId }],
  userVerification: 'required',
  extensions: { prf: { eval: { first: salt } } },
})

const prfSecretFrom = async (options, expectedCredentialId) => {
  const credential = await navigator.credentials.get({ publicKey: options })
  const secret = prfResultsOf(credential)
  if (!secret) throw new Error('PRF_NOT_SUPPORTED')
  if (
    expectedCredentialId &&
    new Uint8Array(credential.rawId).toString() !==
      new Uint8Array(expectedCredentialId).toString()
  ) {
    throw new Error('PRF_CREDENTIAL_MISMATCH')
  }
  return new Uint8Array(secret)
}

const importAesKey = async (prfSecret) =>
  crypto.subtle.importKey('raw', prfSecret, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])

/**
 * Creates the unlock passkey (platform authenticator, PRF enabled) and wraps
 * the account password with the PRF-derived key.
 * @returns {{ credentialId: string, salt: string, iv: string, ciphertext: string }}
 *          base64-encoded blob to persist on the account.
 */
export const enrollPasskeyCredential = async (password) => {
  if (!isSupported()) throw new Error('PASSKEY_UNSUPPORTED')

  const salt = crypto.getRandomValues(new Uint8Array(PRF_SALT_BYTES))
  const credential = await navigator.credentials.create({
    publicKey: prfCreationOptions(salt),
  })

  const prfResults = prfResultsOf(credential)
  if (!prfResults) throw new Error('PRF_NOT_SUPPORTED')

  const aesKey = await importAesKey(new Uint8Array(prfResults))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(password),
  )

  return {
    credentialId: bufferToBase64(credential.rawId),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
  }
}

/**
 * Recreates the PRF-derived key from the stored salt + credential and
 * unwraps the account password. Throws on cancellation, missing blob
 * fields, or PRF mismatch.
 */
export const unwrapPasswordWithPasskey = async (blob) => {
  if (!isSupported()) throw new Error('PASSKEY_UNSUPPORTED')
  if (!blob?.credentialId || !blob?.salt || !blob?.iv || !blob?.ciphertext) {
    throw new Error('PASSKEY_BLOB_INVALID')
  }

  const credentialId = base64ToBuffer(blob.credentialId)
  const salt = base64ToBuffer(blob.salt)
  const prfSecret = await prfSecretFrom(
    prfRequestOptions(credentialId, salt),
    credentialId,
  )

  const aesKey = await importAesKey(prfSecret)
  const iv = base64ToBuffer(blob.iv)
  const plain = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    base64ToBuffer(blob.ciphertext),
  )
  return new TextDecoder().decode(plain)
}

/**
 * Evaluates the PRF secret for an enrolled passkey and returns the wrapped
 * password — used by flows that call unlockAccount directly.
 */
export const unlockPasswordWithPasskey = async (blob) =>
  unwrapPasswordWithPasskey(blob)
