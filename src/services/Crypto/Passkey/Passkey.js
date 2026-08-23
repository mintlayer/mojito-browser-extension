import {
  uint8ArrayToString,
  stringToUint8Array,
} from 'src/utils/Helpers/Array/Array'

const RP_NAME = 'Mojito'
const FIREFOX_RP_ID = 'keys.mintlayer.org'
const PRF_SALT_SIZE = 32
const CHALLENGE_SIZE = 32
const USER_ID_SIZE = 16

const isFirefox = () => navigator.userAgent.includes('Firefox')

// Chrome derives the RP ID from the extension origin when rp.id is omitted, which
// no website and no other extension can claim. Firefox rejects moz-extension://
// and needs a domain listed in host_permissions.
const getRpId = () => (isFirefox() ? FIREFOX_RP_ID : undefined)

const isSupported = () =>
  typeof PublicKeyCredential !== 'undefined' &&
  typeof navigator.credentials?.create === 'function'

const randomBytes = (size) => crypto.getRandomValues(new Uint8Array(size))

const toBase64Url = (bytes) =>
  uint8ArrayToString(new Uint8Array(bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromBase64Url = (value) =>
  stringToUint8Array(value.replace(/-/g, '+').replace(/_/g, '/'))

const createCredential = async (accountName) => {
  const rpId = getRpId()

  const credential = await navigator.credentials.create({
    publicKey: {
      rp: { name: RP_NAME, ...(rpId ? { id: rpId } : {}) },
      user: {
        id: randomBytes(USER_ID_SIZE),
        name: accountName,
        displayName: accountName,
      },
      challenge: randomBytes(CHALLENGE_SIZE),
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        residentKey: 'required',
        requireResidentKey: true,
        userVerification: 'required',
      },
      attestation: 'none',
      extensions: { prf: {}, credProps: true },
    },
  })

  if (!credential) throw new Error('Passkey creation was cancelled')

  // Firefox reports an unsupported extension as {} rather than {enabled:false},
  // so anything falsy has to be treated as no PRF at all.
  if (!credential.getClientExtensionResults()?.prf?.enabled)
    throw new Error('This authenticator cannot protect a wallet')

  return toBase64Url(credential.rawId)
}

// Every enrolled credential is offered, each with its own salt, so the user can
// unlock with whichever authenticator they have at hand. The assertion tells us
// which one answered.
const getPrfOutput = async (passkeys) => {
  if (!passkeys?.length) throw new Error('No passkey is enrolled')

  const rpId = getRpId()

  const assertion = await navigator.credentials.get({
    publicKey: {
      ...(rpId ? { rpId } : {}),
      challenge: randomBytes(CHALLENGE_SIZE),
      allowCredentials: passkeys.map(({ credentialId }) => ({
        type: 'public-key',
        id: fromBase64Url(credentialId),
      })),
      userVerification: 'required',
      extensions: {
        prf: {
          evalByCredential: Object.fromEntries(
            passkeys.map(({ credentialId, prfSalt }) => [
              credentialId,
              { first: fromBase64Url(prfSalt) },
            ]),
          ),
        },
      },
    },
  })

  if (!assertion) throw new Error('Passkey verification was cancelled')

  const prfOutput = assertion.getClientExtensionResults()?.prf?.results?.first

  if (!prfOutput) throw new Error('This authenticator did not return a key')

  return {
    credentialId: toBase64Url(assertion.rawId),
    prfOutput: [...new Uint8Array(prfOutput)],
  }
}

// PRF results are not returned by create() on most platforms, so enrolment always
// follows the ceremony with an assertion to obtain the first output.
const enroll = async (accountName) => {
  const credentialId = await createCredential(accountName)
  const prfSalt = toBase64Url(randomBytes(PRF_SALT_SIZE))
  const { prfOutput } = await getPrfOutput([{ credentialId, prfSalt }])

  return { credentialId, prfSalt, prfOutput }
}

export {
  RP_NAME,
  FIREFOX_RP_ID,
  isSupported,
  getRpId,
  toBase64Url,
  fromBase64Url,
  createCredential,
  getPrfOutput,
  enroll,
}
