// Pure BIP-173 bech32 checksum verification for Mintlayer string
// identifiers (addresses, pool/delegation/order ids).
//
// SECURITY: the ML address validators used to be charset-regex only — a
// single-character typo in a recipient address passed validation and the
// funds were unrecoverable. The regex stays as a fast pre-filter; this
// module adds the missing checksum + HRP verification.
//
// Deliberately dependency-free and synchronous: it runs on every keystroke
// in the address fields. Mintlayer encodes ALL its bech32 identifiers
// (addresses, pool/delegation/order ids) with the BIP-350 bech32m
// checksum (constant 0x2bc830a3) — verified against real on-chain and
// SDK-mock samples; the BIP-173 constant rejects every real ML string.

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const CHARSET_INDEX = new Map([...CHARSET].map((c, i) => [c, i]))

const BECH32M_CONST = 0x2bc830a3

const polymod = (values) => {
  const GENERATORS = [
    0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3,
  ]
  let checksum = 1
  for (const value of values) {
    const top = checksum >> 25
    checksum = ((checksum & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) {
        checksum ^= GENERATORS[i]
      }
    }
  }
  // bech32m: a valid string has polymod === BECH32M_CONST (checked by the
  // caller via the XOR below returning 0).
  return checksum ^ BECH32M_CONST
}

const hrpExpand = (hrp) => [
  ...[...hrp].map((c) => c.charCodeAt(0) >> 5),
  0,
  ...[...hrp].map((c) => c.charCodeAt(0) & 31),
]

/**
 * Verifies the bech32 checksum of a Mintlayer string against the allowed
 * HRPs for its type + network. Never throws; returns false on any
 * malformed input (mixed case, bad charset, short data, bad checksum).
 *
 * @param {string} value the full bech32 string (e.g. "mtc1q…", "tpool1…")
 * @param {string[]} allowedHrps e.g. ["mtc", "mmtc"] for mainnet addresses
 */
const bech32VerifyChecksum = (value, allowedHrps) => {
  if (typeof value !== 'string' || value.length === 0) return false

  // BIP-173: mixed case is invalid; all-lowercase or all-uppercase only.
  const hasLower = /[a-z]/.test(value)
  const hasUpper = /[A-Z]/.test(value)
  if (hasLower && hasUpper) return false
  const normalized = hasUpper ? value.toLowerCase() : value

  // The separator is the LAST '1': the HRP cannot contain '1'.
  const separatorIndex = normalized.lastIndexOf('1')
  if (separatorIndex === -1) return false

  const hrp = normalized.slice(0, separatorIndex)
  if (!allowedHrps.includes(hrp)) return false

  const dataPart = normalized.slice(separatorIndex + 1)
  // checksum (6) + at least the witness version character
  if (dataPart.length < 7) return false

  const data = []
  for (const char of dataPart) {
    const index = CHARSET_INDEX.get(char)
    if (index === undefined) return false
    data.push(index)
  }

  return polymod([...hrpExpand(hrp), ...data]) === 0
}

export { bech32VerifyChecksum }
