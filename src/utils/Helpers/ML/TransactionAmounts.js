import Decimal from 'decimal.js'
import { format as formatDate } from 'date-fns'

// Tokens can exceed float precision; never fall back to exponents. Wide
// precision keeps the decimal↔atoms equality checks exact for mintlayer
// token magnitudes (up to 2^120 atoms plus fractional digits).
const Amount = Decimal.clone({ precision: 80, toExpNeg: -60, toExpPos: 60 })

export const COIN_DECIMALS = 11

// Mintlayer fungible-token maximum. Scales outside 0..18 are malformed and
// must fail closed instead of throwing (negative) or hanging the tab on
// 10n ** BigInt(huge).
export const TOKEN_DECIMALS_LIMIT = 18

const isValidDecimals = (decimals) =>
  Number.isInteger(decimals) &&
  decimals >= 0 &&
  decimals <= TOKEN_DECIMALS_LIMIT

// SECURITY (signTransaction approval): the signer commits `amount.atoms`
// exclusively (BigInt(amount.atoms) at every encode site), while dApp
// payloads also carry an `amount.decimal` that is only meant for display and
// is fully attacker-controlled. Everything shown to the user must therefore
// be derived from `.atoms`, and `.decimal` may only be shown after it has
// been verified against `.atoms` scaled by the asset's decimals. Any
// disagreement fails closed: an error is rendered instead of a number and
// the approval action is blocked.

const MISMATCH_MESSAGE =
  'Site-reported amount does not match the amount that will be signed'
const UNVERIFIABLE_MESSAGE =
  'Amount cannot be verified against the signed transaction data'
const NEGATIVE_MESSAGE = 'Amount cannot be negative'
const SCALE_MESSAGE =
  'Amount scale cannot be verified (invalid or out-of-range token decimals)'
const SCALE_UNVERIFIED_MESSAGE =
  'Token decimals are unknown to this wallet, so the site-reported amount cannot be verified'

// Scales a BigInt atom amount into an exact decimal string. Pure BigInt
// math: token supplies exceed Number (and Decimal default) precision, and a
// rounding error here would itself become a display-vs-signed mismatch.
// Throws RangeError for scales outside 0..TOKEN_DECIMALS_LIMIT — callers
// must treat that as a fail-closed verification error, never render.
export const atomsToDecimalString = (atoms, decimals) => {
  if (!isValidDecimals(decimals)) {
    throw new RangeError(`amount scale out of range: ${decimals}`)
  }
  const negative = atoms < 0n
  const magnitude = negative ? -atoms : atoms
  const scale = 10n ** BigInt(decimals)
  const whole = magnitude / scale
  const fraction = (magnitude % scale)
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '')
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

// True when `decimal` is exactly `atoms / 10^decimals`. Compares on the
// integer atom scale so trailing zeros or exponent notation in the
// dApp-supplied string cannot produce a false mismatch (or hide a real one).
// Throws RangeError for scales outside 0..TOKEN_DECIMALS_LIMIT.
export const decimalMatchesAtoms = (decimal, atoms, decimals) => {
  if (!isValidDecimals(decimals)) {
    throw new RangeError(`amount scale out of range: ${decimals}`)
  }
  let parsed
  try {
    parsed = new Amount(decimal)
  } catch {
    return false
  }
  if (!parsed.isFinite()) return false
  const scaled = parsed.times(new Amount(10).pow(decimals))
  if (!scaled.isInteger()) return false
  return scaled.toFixed(0) === atoms.toString()
}

// Chain token metadata (allNetworkTokensData) → Map token_id → decimals,
// used to scale signed token atoms into displayable amounts. Entries with
// out-of-range decimals are dropped: they resolve to "unknown scale" and
// fail closed rather than poisoning the scaling.
export const buildTokenDecimalsIndex = (allNetworkTokensData) => {
  const entries = []
  ;(allNetworkTokensData || []).forEach((token) => {
    const decimals = parseInt(token?.number_of_decimals, 10)
    if (token?.token_id && isValidDecimals(decimals)) {
      entries.push([token.token_id, decimals])
    }
  })
  return new Map(entries)
}

// Asset scale for an amount: Coin (or any token-less value) uses
// COIN_DECIMALS; tokens use the chain-metadata decimals. Tokens unknown to
// the wallet resolve to null — their signed atom counts stay displayable
// verbatim (scale 0), while any site-supplied decimal label fails closed
// with a distinct "scale cannot be verified" error: no attacker-chosen
// scaling can masquerade as a smaller amount.
export const resolveAssetDecimals = (tokenId, tokenDecimalsById) =>
  !tokenId ? COIN_DECIMALS : (tokenDecimalsById?.get(tokenId) ?? null)

// Scale for an order/issuance currency object (`{type: 'Coin'}` or
// `{type: 'Token', token_id}`): coin-ness follows token-id PRESENCE, exactly
// like the signer (`currency.token_id || null`) — a self-contradictory
// `{type: 'Coin', token_id}` escrows a token and must scale as one.
export const resolveCurrencyDecimals = (currency, tokenDecimalsById) =>
  currency?.token_id
    ? resolveAssetDecimals(currency.token_id, tokenDecimalsById)
    : COIN_DECIMALS

// Verifies one amount container — the same `amount.atoms`/`amount.decimal`
// fields the signer reads, nested (Transfer `value`, token `total_supply`)
// or flat (order balances, delegation stakes, the declared `fee`).
// `decimals` is a number for known scales, null for unknown token scales,
// or an invalid value (NaN/negative/oversized) which always fails closed.
// Returns:
//   null                  — the container carries no numeric amount at all
//   { atoms, amount }     — verified; `amount` is the atoms-derived string
//   { error, amount? }    — fail-closed reason; `amount` (the signed truth)
//                           is present when the atoms themselves were readable
export const verifyAmountPair = (container, decimals) => {
  const numeric = container?.amount ?? container
  const rawAtoms = numeric?.atoms
  const rawDecimal = numeric?.decimal
  if (rawAtoms == null && rawDecimal == null) return null

  // Mirrors the signer exactly: BigInt(amount.atoms). A missing or
  // unparseable value would make signing throw, so it can never be shown.
  let atoms
  try {
    atoms = BigInt(rawAtoms)
  } catch {
    return { error: UNVERIFIABLE_MESSAGE }
  }

  // Signed amounts are non-negative; a negative atom count is malformed.
  if (atoms < 0n) {
    return { error: NEGATIVE_MESSAGE }
  }

  // Out-of-range scales must never throw or hang the approval UI.
  let display
  try {
    display = atomsToDecimalString(atoms, decimals ?? 0)
  } catch {
    return { error: SCALE_MESSAGE }
  }

  if (rawDecimal != null) {
    let matches
    try {
      matches = decimalMatchesAtoms(rawDecimal, atoms, decimals ?? 0)
    } catch {
      return { error: SCALE_MESSAGE }
    }
    if (!matches) {
      return decimals == null
        ? { error: SCALE_UNVERIFIED_MESSAGE, amount: display }
        : { error: MISMATCH_MESSAGE, amount: display }
    }
  }

  return { atoms, amount: display }
}

// Account commands the signer encodes explicitly, resolved BEFORE the
// DelegationBalance withdrawal branch (SignTransaction.js inputCommands) —
// a payload mixing a known command with account_type 'DelegationBalance'
// signs the command (never a withdrawal credit).
const SIGNER_ACCOUNT_COMMANDS = new Set([
  'ConcludeOrder',
  'FillOrder',
  'MintTokens',
  'UnmintTokens',
  'LockTokenSupply',
  'ChangeTokenAuthority',
  'ChangeMetadataUri',
  'FreezeToken',
  'UnfreezeToken',
])

// The miner fee the signed transaction actually pays: coin in minus coin
// out, across every coin leg the signer encodes:
//   in:  utxo input values (Transfer / LockThenTransfer / Htlc) and the coin
//        credited back by a DelegationBalance withdraw (input.amount.atoms)
//   out: Transfer / LockThenTransfer / Htlc / BurnToken (coin burn) output
//        values, the coin escrowed by a DelegateStaking output
//        (output.amount.atoms) and
//        the coin escrowed by a CreateOrder give side (give_balance when the
//        give currency is Coin). Burned coins stay part of the consensus
//        balance equation, so they are subtracted here AND surfaced as their
//        own 'Burned' row — never conflated with the miner fee.
// Returns:
//   BigInt    — the computed miner fee (0n or negative rendered truthfully)
//   null      — no coin legs to compute from (pure account-command payload)
//   undefined — the payload contains legs the rule cannot model (an order
//               fill/conclusion: their currency is not in the payload, only
//               the order id) — the fee is unverifiable and must never be
//               guessed from the declared fee
export const computeCoinFeeAtoms = (inputs, outputs) => {
  const inputItems = Array.isArray(inputs) ? inputs : []
  const outputItems = Array.isArray(outputs) ? outputs : []

  // Parses a signed coin atom amount the way the signer does
  // (BigInt(amount.atoms)); undefined = unusable → refuse to compute.
  const parseCoinAtoms = (raw) => {
    try {
      const atoms = BigInt(raw)
      return atoms < 0n ? undefined : atoms
    } catch {
      return undefined
    }
  }

  let sum = 0n
  for (const item of inputItems) {
    const input = item?.input
    // account inputs only (shared signer-exact predicate) — a UTXO input
    // with an injected command/account_type encodes a plain utxo leg, not an
    // account leg
    const isAccountInput = isAccountCommandShape(input)
    // Order legs first: their coin leg is denominated in the order's
    // currency, which the payload does not carry — the fee is unverifiable.
    if (
      isAccountInput &&
      (input.command === 'FillOrder' || input.command === 'ConcludeOrder')
    ) {
      return undefined
    }
    // withdrawal: the delegation credits this coin into the transaction
    // (signer: encode_input_for_withdraw_from_delegation(input.amount.atoms))
    // — the shared predicate mirrors the signer: known commands resolve
    // BEFORE the DelegationBalance branch, so a hybrid input (known command
    // + DelegationBalance) signs no withdrawal credit and its real utxo coin
    // must not be skipped
    if (isDelegationWithdrawInput(input)) {
      const atoms = parseCoinAtoms(input?.amount?.atoms)
      if (atoms === undefined) return undefined
      sum += atoms
      continue
    }
    // utxo coin legs exist ONLY on input_type === 'UTXO' (the signer reads
    // input.utxo.value.amount.atoms for those alone) — injected utxo objects
    // on account commands must not inflate the input sum
    if (input?.input_type !== 'UTXO') continue
    // coin-ness keys off token-id presence alone, matching the signer's
    // output encoding
    const value = item?.utxo?.value
    if (value && !value.token_id) {
      const atoms = parseCoinAtoms(value?.amount?.atoms)
      if (atoms === undefined) return undefined
      sum += atoms
    }
  }
  if (sum === 0n) return null // no coin inputs: nothing to compute from

  for (const item of outputItems) {
    // staking escrow: the signer reads output.amount.atoms ONLY — any
    // injected value field on a staking output is ignored for the fee too
    if (item?.type === 'DelegateStaking') {
      const atoms = parseCoinAtoms(item?.amount?.atoms)
      if (atoms === undefined) return undefined
      sum -= atoms
      continue
    }
    if (item?.type === 'CreateOrder') {
      // the give side escrows coin only when the signer encodes it as coin
      // (no token_id) — a contradictory currency escrows a token
      const coinGive = !item?.give_currency?.token_id
      const atoms = coinGive ? parseCoinAtoms(item?.give_balance?.atoms) : null
      if (atoms === undefined) return undefined
      if (coinGive) sum -= atoms
      continue
    }
    if (item?.type === 'BurnToken') {
      // the signer encodes a burn only for token burns (value.token_id) or
      // coin burns (value.type === 'Coin') — any other value shape falls
      // through to a null output and never touches the balance equation
      const value = item?.value
      if (!value || !(value.token_id || value.type === 'Coin')) continue
    }
    // value-encoding outputs only (Transfer / LockThenTransfer / Htlc /
    // BurnToken): the signer reads output.value.amount.atoms for those
    // alone — injected value fields on DataDeposit, CreateDelegationId,
    // IssueNft or IssueFungibleToken outputs must not deflate the fee
    if (!SIGNED_VALUE_OUTPUT_TYPES.has(item?.type)) continue
    // coin-ness keys off token-id presence alone, matching the signer's
    // output encoding
    const value = item?.value
    if (value && !value.token_id) {
      const atoms = parseCoinAtoms(value?.amount?.atoms)
      if (atoms === undefined) return undefined
      sum -= atoms
    }
  }
  return sum
}

const FEE_ERROR_MESSAGES = {
  [MISMATCH_MESSAGE]:
    'Site-reported fee does not match the fee that will be signed',
  [UNVERIFIABLE_MESSAGE]:
    'Fee cannot be verified against the signed transaction data',
  [NEGATIVE_MESSAGE]: 'Fee cannot be negative',
  [SCALE_MESSAGE]: 'Fee scale cannot be verified',
}

// Verifies the dApp-declared fee (`fee.atoms`/`fee.decimal`) for the
// fallback path where the coin sums are not computable. Same result shape
// as verifyAmountPair, with fee-specific wording.
export const verifyDeclaredFee = (declaredFee) => {
  const verified = verifyAmountPair(declaredFee, COIN_DECIMALS)
  if (!verified?.error) return verified
  return {
    ...verified,
    error: FEE_ERROR_MESSAGES[verified.error] ?? verified.error,
  }
}

// The fee rule shared by every approval surface — never re-implement it per
// component (summary, preview and page must not drift): the miner fee is
// what the encoded transaction actually pays, i.e. coin input atoms minus
// coin output atoms (computeCoinFeeAtoms). The dApp-supplied `fee` field is
// display-only: fall back to it ONLY when the payload has no coin legs at
// all (null). A computed zero or negative fee is rendered truthfully ('0',
// '-5') instead of being replaced by the attacker-controlled declared fee;
// an unmodelable payload (order fill/conclusion) renders 'Unknown'. Never a
// `.decimal`.
// Returns { amount } | { error, amount? } | { unknown: true } | null.
export const deriveApprovalFee = (jsonRepresentation) => {
  const inputs = jsonRepresentation?.inputs
  const outputs = jsonRepresentation?.outputs
  // Fail closed: non-array legs are unverifiable — never derive a fee from a
  // partial payload (asymmetric with '|| []' normalization).
  if (!Array.isArray(inputs) || !Array.isArray(outputs)) {
    return { unknown: true }
  }
  const computedFeeAtoms = computeCoinFeeAtoms(inputs, outputs)
  if (computedFeeAtoms === undefined) {
    return { unknown: true }
  }
  if (computedFeeAtoms != null) {
    return { amount: atomsToDecimalString(computedFeeAtoms, COIN_DECIMALS) }
  }
  const declared = verifyDeclaredFee(jsonRepresentation?.fee)
  if (!declared) return null
  return declared.error
    ? { error: declared.error, amount: declared.amount ?? null }
    : { amount: declared.amount }
}

// Output types whose encoder reads `destination`: Transfer and
// LockThenTransfer (getOutputs) and CreateDelegationId
// (encode_output_create_delegation). Every other output type ignores the
// field — an Htlc pays to its spend/refund keys, a DelegateStaking escrows
// into its delegation, a BurnToken destroys the funds — and `address` is
// never read for any output. The funds of such an output leave the wallet
// whatever address a payload attaches to it.
const DESTINATION_BEARING_OUTPUT_TYPES = new Set([
  'Transfer',
  'LockThenTransfer',
  'CreateDelegationId',
])

// The destination the signer encodes for an output: only for the
// destination-bearing types, and only a string. Never `address`.
export const signerOutputDestination = (output) =>
  DESTINATION_BEARING_OUTPUT_TYPES.has(output?.type) &&
  typeof output?.destination === 'string'
    ? output.destination
    : null

// Every address of this wallet, receiving and change alike.
const ownAddressList = (ownAddresses) => [
  ...(ownAddresses?.receiving || []),
  ...(ownAddresses?.change || []),
]

// The outputs the user is actually approving: those that don't land straight
// back on this wallet — "lands back" meaning the signer encodes one of the
// wallet's own addresses as the destination (signerOutputDestination); an
// output of any other type is a payment whatever `destination`/`address` it
// carries. Across EVERY asset, not just the first input's token, so mixed
// coin+token and multi-token payments are all shown and verified. When
// every output goes to a wallet address (a self-transfer), the payment is
// what goes to a receiving address — outputs to change addresses are just
// the unspent remainder coming back.
export const findRelevantOutputs = (outputs, ownAddresses) => {
  const receiving = ownAddresses?.receiving || []
  const ownList = ownAddressList(ownAddresses)
  const isOwn = (address) => address && ownList.includes(address)
  const isReceiving = (address) => address && receiving.includes(address)

  const toOthers = outputs.filter(
    (output) => !isOwn(signerOutputDestination(output)),
  )
  if (toOthers.length > 0) return { outputs: toOthers, toSelf: false }

  return {
    outputs: outputs.filter((output) =>
      isReceiving(signerOutputDestination(output)),
    ),
    toSelf: true,
  }
}

// A LockThenTransfer output whose signer-encoded destination is one of the
// wallet's own addresses: the funds come back to this wallet, but LOCKED by
// a lock the site chose — the signer encodes `output.lock` next to
// `output.destination` (getOutputs) — so they are neither a payment to
// others nor plain change. `address` is read nowhere.
export const isLockedSelfOutput = (output, ownAddresses) => {
  const destination = signerOutputDestination(output)
  return (
    output?.type === 'LockThenTransfer' &&
    destination !== null &&
    ownAddressList(ownAddresses).includes(destination)
  )
}

// The lock of a LockThenTransfer output as the signer encodes it
// (Mintlayer.getOutputs): UntilTime → BigInt(lock.content.timestamp) through
// encode_lock_until_time; ForBlockCount → BigInt(lock.content) through
// encode_lock_for_block_count. Any other lock type, a missing lock or a
// content BigInt cannot encode throws there, so the request can never be
// signed: it fails closed with the reason below. The two contents are read
// more strictly than BigInt itself would accept (it would also take true,
// '0x10', an imprecise float or a value wider than the encoder's 64-bit
// parameter — none of which can be shown as the number that gets signed):
// only a non-negative safe integer or a decimal-digit string up to
// 2^64 − 1 is readable. Nothing here coerces a site-controlled value.
export const LOCK_UNREADABLE_MESSAGE =
  'The lock on these funds cannot be read, so this transaction cannot be signed'

// The summary row that names such an output: its funds are the wallet's
// again, only not spendable until the lock expires.
const LOCKED_ROW_LABEL = 'Locked at this wallet'
// The row that names a spent locked output whose lock cannot be read.
const LOCKED_INPUT_ROW_LABEL = 'Locked input'

// The fill amount of an account-command FillOrder input is signed through
// fill_atoms.toString() → Amount.from_atoms, and the amount encoder accepts
// decimal digits only, parsed as an unsigned 128-bit integer. Only a
// decimal-digit string within that width (MAX_AMOUNT_COUNT below) or a safe
// integer can be displayed; any other JSON shape (an array, an object, a
// boolean, an absent field) — or any string containing anything but digits,
// or digits beyond that width — throws in the encoder and can never be part
// of a signed transaction. Such a leg is unmodelable: it fails closed with
// this reason on its own row instead of showing a fill size nothing
// commits to.
export const ORDER_FILL_UNREADABLE_MESSAGE =
  'The site supplied the order fill amount in a form this wallet cannot display, so this transaction cannot be approved'

// The encoders take the count as an unsigned 64-bit integer — the wasm
// glue hands the BigInt straight to a function that would silently keep
// only the low 64 bits of anything wider, never the number displayed.
const MAX_LOCK_COUNT = 2n ** 64n - 1n
const MAX_LOCK_COUNT_DIGITS = MAX_LOCK_COUNT.toString().length

// Amounts parse Rust-side as unsigned 128-bit integers (the 64-bit lock
// counts above are the narrower exception): an atom count one past this
// width throws in the input encoder, so a fill that carries more can never
// be signed and may not be displayed either.
const MAX_AMOUNT_COUNT = 2n ** 128n - 1n
const MAX_AMOUNT_COUNT_DIGITS = MAX_AMOUNT_COUNT.toString().length

const readLockCount = (value) => {
  let digits
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) return null
    digits = String(value)
  } else if (typeof value === 'string' && /^\d+$/.test(value)) {
    // the width is settled before BigInt runs, so a site-supplied string
    // of any length costs a bounded amount of work during render
    digits = value.replace(/^0+(?=\d)/, '')
    if (digits.length > MAX_LOCK_COUNT_DIGITS) return null
  } else {
    return null
  }
  const count = BigInt(digits)
  return count <= MAX_LOCK_COUNT ? count.toString() : null
}

//   { type: 'UntilTime', timestamp }       unix seconds, decimal string
//   { type: 'ForBlockCount', blockCount }  decimal string
//   { error }                              the signer could not encode it
export const readOutputLock = (lock) => {
  if (!lock || typeof lock !== 'object' || Array.isArray(lock)) {
    return { error: LOCK_UNREADABLE_MESSAGE }
  }
  if (lock.type === 'UntilTime') {
    const timestamp = readLockCount(lock.content?.timestamp)
    return timestamp === null
      ? { error: LOCK_UNREADABLE_MESSAGE }
      : { type: 'UntilTime', timestamp }
  }
  if (lock.type === 'ForBlockCount') {
    const blockCount = readLockCount(lock.content)
    return blockCount === null
      ? { error: LOCK_UNREADABLE_MESSAGE }
      : { type: 'ForBlockCount', blockCount }
  }
  return { error: LOCK_UNREADABLE_MESSAGE }
}

// A lock timestamp is rendered with the wallet's own date format, in local
// time like every other date it shows; a timestamp no Date can represent is
// shown as the raw signed number rather than as nothing.
const formatLockTimestamp = (timestamp) => {
  const date = new Date(Number(timestamp) * 1000)
  return Number.isNaN(date.getTime())
    ? `timestamp ${timestamp}`
    : formatDate(date, 'dd/MM/yyyy HH:mm')
}

// A readable lock in plain words: 'until <date>' or 'for N blocks'. Null
// for anything else (the caller decides what to show).
export const formatOutputLock = (readLock) => {
  if (readLock?.type === 'UntilTime') {
    return `until ${formatLockTimestamp(readLock.timestamp)}`
  }
  if (readLock?.type === 'ForBlockCount') {
    return `for ${readLock.blockCount} block${
      readLock.blockCount === '1' ? '' : 's'
    }`
  }
  return null
}

// readOutputLock and formatOutputLock in one step, for every surface that
// names a lock: { text } when the signer can encode it, { error } otherwise.
export const describeOutputLock = (lock) => {
  const read = readOutputLock(lock)
  return read.error ? read : { text: formatOutputLock(read) }
}

// The signer reads exactly one numeric amount container per shape — and
// none at all for everything else (DataDeposit, CreateDelegationId,
// CreateOrder, IssueFungibleToken and IssueNft outputs; account commands
// other than DelegationBalance withdrawals and MintTokens). Resolving any
// other field would let injected top-level numerics fake a "will sign"
// amount the signer never encodes.
//   DelegateStaking output                     → output.amount
//   Transfer / LockThenTransfer / BurnToken /
//   Htlc output                                → output.value
//   utxo input of a signed type                → utxo.value
//   DelegationBalance / MintTokens account cmd → input.amount
// NB: no 'BurnCoin' — the signer has no such branch; coin burns encode only
// as BurnToken with a Coin value. Any other BurnToken value shape (neither
// token_id nor type 'Coin') is dropped by the signer and never encoded.
// NB: utxo inputs are INPUT-side only — the signer reads utxo.value for
// input_type 'UTXO' legs whose utxo.type is exactly SIGNED_UTXO_TYPES
// (BurnToken is output-only; any other utxo type carries no signed amount).
const SIGNED_VALUE_OUTPUT_TYPES = new Set([
  'Transfer',
  'LockThenTransfer',
  'BurnToken',
  'Htlc',
])
const SIGNED_UTXO_TYPES = new Set(['Transfer', 'LockThenTransfer', 'Htlc'])

// Account-command shapes the signer reads command/account_type on (both
// input_type spellings) — never outputs, whose injected command/account_type
// fields the signer ignores entirely.
export const isAccountCommandShape = (source) =>
  source?.input_type === 'AccountCommand' || source?.input_type === 'Account'

// Signer-exact container for ONE transaction leg, resolved per legKind
// ('input' | 'output'): the signer dispatches on output.type for outputs
// and on input.input_type for inputs, so the two resolutions share no
// branches and an injected field can never cross from one side to the
// other. For 'input', `source` is the {input, utxo} wrapper the signer
// iterates over (the dispatch key input.input_type lives there, not on the
// utxo object — injected account fields on a utxo are never read). An
// unknown legKind (a call site that skipped the parameter) resolves
// nothing: fail closed.
export const signerAmountContainer = (source, legKind) => {
  if (!source || typeof source !== 'object') return null
  // INPUTS: value-type output shapes (Transfer/…) do not exist on the
  // input side — the signer reads utxo.value only for input_type 'UTXO'
  // legs, and command/account_type only on account-command inputs. An
  // account input injected with type 'Transfer'/'DelegateStaking' can
  // never resolve a container from those fields.
  if (legKind === 'input') {
    // the signer's utxo filter: plain utxo legs read utxo.value, for these
    // utxo types alone — account fields injected anywhere on the wrapper
    // are never consulted
    if (source.input?.input_type === 'UTXO') {
      if (SIGNED_UTXO_TYPES.has(source.utxo?.type)) {
        return source.utxo?.value ?? null
      }
      return null
    }
    if (isAccountCommandShape(source.input)) {
      // the signer resolves known commands BEFORE the DelegationBalance
      // branch — MintTokens signs amount.atoms; a known command coexisting
      // with account_type 'DelegationBalance' (e.g. UnmintTokens) signs NO
      // amount, so the container is null
      if (source.input.command === 'MintTokens') {
        return source.input.amount ?? null
      }
      if (
        source.input.account_type === 'DelegationBalance' &&
        !SIGNER_ACCOUNT_COMMANDS.has(source.input.command)
      ) {
        return source.input.amount ?? null
      }
    }
    return null
  }
  // OUTPUTS: the signer reads command/account_type/input_type nowhere here
  // — injected command/account_type fields on an output must never resolve
  // a container (no fabricated MintTokens/withdrawal amounts for funds
  // never signed)
  if (legKind === 'output') {
    if (source.type === 'DelegateStaking') return source.amount ?? null
    if (SIGNED_VALUE_OUTPUT_TYPES.has(source.type)) {
      return source.value ?? null
    }
  }
  return null
}

// Signer-exact DelegationBalance withdrawal input: account input type
// (both spellings) and no coexisting known command — the signer resolves
// known commands before the DelegationBalance branch, so a hybrid input
// signs the command, never a withdrawal credit.
export const isDelegationWithdrawInput = (accountInput) =>
  (accountInput?.input_type === 'AccountCommand' ||
    accountInput?.input_type === 'Account') &&
  accountInput?.account_type === 'DelegationBalance' &&
  !SIGNER_ACCOUNT_COMMANDS.has(accountInput?.command)

// The addresses the signer may sign a utxo input with, in its own order of
// preference. getTransactionHEX signs an input with the key of
// `utxo.destination || input.authority || input.destination` — of
// `outputs[0].destination` for every input instead when the first input is
// a DelegationBalance withdrawal — except that an input whose utxo carries
// an `htlc` object takes the HTLC branch, keyed on that object: its spend
// key (a claim, when a secret is given) or else its refund key. Listed
// here are those two keys for an Htlc-typed utxo (the shape that carries
// the object as its own) and, for every other utxo, its destination — the
// address the spent outpoint pays, whichever key the signer reaches for.
// `.address` is read nowhere.
const signerUtxoKeyAddresses = (utxo) =>
  utxo?.type === 'Htlc'
    ? [utxo.htlc?.spend_key, utxo.htlc?.refund_key]
    : [utxo?.destination]

// The wallet address a utxo input's funds belong to — the first of the
// candidate keys this wallet holds — or null when it holds none: the leg
// is then not this wallet's funds and is never shown as such. Strings only.
export const signerUtxoOwnerAddress = (utxo, ownAddresses) => {
  const ownList = [
    ...(ownAddresses?.receiving || []),
    ...(ownAddresses?.change || []),
  ]
  return (
    signerUtxoKeyAddresses(utxo).find(
      (address) => typeof address === 'string' && ownList.includes(address),
    ) ?? null
  )
}

// The destination the signer encodes on an account-command FillOrder input
// (encode_input_for_fill_order): where the acquired asset lands. The fill
// itself carries no signature (encode_witness_no_signature), so this is
// never the source of funds. Both input_type spellings; a string only.
export const signerFillOrderDestination = (input) =>
  isAccountCommandShape(input?.input) &&
  input.input.command === 'FillOrder' &&
  typeof input.input.destination === 'string'
    ? input.input.destination
    : null

// Token identity from the SAME signer-read fields as the container:
// value-bearing shapes carry it on the container (output.value.token_id,
// utxo.value.token_id), MintTokens commands carry it at command level
// (input.token_id — the minted token), and coin-only shapes (DelegateStaking
// outputs, DelegationBalance withdrawals) carry none — a token_id injected
// ON the amount container cannot re-label a signed coin amount. Resolved
// per leg kind like the container ('input' takes the {input, utxo} wrapper);
// an unknown legKind yields no identity.
export const signerAmountTokenId = (source, container, legKind) => {
  if (legKind === 'input') {
    if (isAccountCommandShape(source?.input)) {
      // MintTokens identity is the command-level token_id; every other
      // account command (incl. DelegationBalance withdrawals) is coin-only
      return source.input.command === 'MintTokens'
        ? (source.input.token_id ?? null)
        : null
    }
    // utxo legs: identity lives on the signer-read container
    return container?.token_id ?? null
  }
  if (legKind === 'output') {
    // DelegateStaking outputs are coin-only by definition — no token
    // identity, injection-immune
    if (source?.type === 'DelegateStaking') return null
    return container?.token_id ?? null
  }
  return null
}

// Scale for the container returned by signerAmountContainer, resolved from
// the SAME signer-read identity fields, per leg kind ('input' takes the
// {input, utxo} wrapper), and in the signer's resolution order (known
// commands BEFORE the DelegationBalance branch): MintTokens commands are
// token amounts scaled by the command-level input.token_id; DelegationBalance
// withdrawals are coin-only → COIN_DECIMALS unconditionally (a token_id
// injected on the amount container cannot re-scale the signed coin amount);
// value-bearing shapes scale by the container's token_id via chain data
// (unknown → null → fail-closed scale rule). An unknown legKind scales as
// unknown → fail closed.
export const signerAmountScale = (
  source,
  container,
  tokenDecimalsById,
  legKind,
) => {
  if (legKind === 'input') {
    // MintTokens resolves first, mirroring the signer's command-first order
    if (isAccountCommandShape(source?.input)) {
      return source.input.command === 'MintTokens'
        ? resolveAssetDecimals(source.input.token_id, tokenDecimalsById)
        : COIN_DECIMALS
    }
    return resolveAssetDecimals(container?.token_id, tokenDecimalsById)
  }
  if (legKind === 'output') {
    // DelegateStaking outputs are real signed coin-escrow legs: coin-only by
    // definition — an injected amount.token_id cannot re-scale them
    if (source?.type === 'DelegateStaking') return COIN_DECIMALS
    return resolveAssetDecimals(container?.token_id, tokenDecimalsById)
  }
  return null
}

// parseInt over dApp-controlled data: only a string or a number is ever
// coerced (an object with a shadowing `toString`/`valueOf` would throw, and
// no object carries a scale); anything else is an unknown scale (NaN),
// which fails closed downstream like any invalid scale.
const parseScale = (value) =>
  typeof value === 'string' || typeof value === 'number'
    ? parseInt(value, 10)
    : NaN

// Amounts signed outside output.value/amount: token issuance total supply
// (only total_supply.type === 'Fixed' carries a signed supply — Lockable/
// Unlimited encode NO amount, so a payload attaching one to those types
// must not display a cap) and CreateOrder balances (scaled by each order
// currency). A lying `.decimal` on these must block approval exactly like a
// lying transfer amount. Keys embed the output index so React rows stay
// unique across multiple orders/issuances.
const collectSignedExtras = (output, index, tokenDecimalsById) => {
  const extras = []
  if (
    output?.type === 'IssueFungibleToken' &&
    output?.total_supply?.type === 'Fixed' &&
    output?.total_supply?.amount != null
  ) {
    extras.push({
      key: `supply:${index}`,
      label: 'Total supply',
      container: output.total_supply,
      // the output's own (signed) scale; invalid values fail closed
      decimals: parseScale(output.number_of_decimals),
      tokenId: null, // pre-issuance: no ticker exists yet
      withTicker: false,
    })
  }
  if (output?.type === 'CreateOrder') {
    const orderSide = (side, balance, currency) => {
      if (balance?.atoms == null && balance?.decimal == null) return
      extras.push({
        key: `order:${side}:${index}`,
        label: `Order ${side}`,
        container: balance,
        decimals: resolveCurrencyDecimals(currency, tokenDecimalsById),
        tokenId: currency?.token_id ?? null,
        withTicker: true,
      })
    }
    orderSide('ask', output.ask_balance, output.ask_currency)
    orderSide('give', output.give_balance, output.give_currency)
  }
  return extras
}

// The fill amount a FillOrder input commits is signed through
// fill_atoms.toString() → Amount.from_atoms, and the encoder accepts decimal
// digits only, parsed Rust-side as an unsigned 128-bit integer. Only a
// decimal-digit string within that width or a safe integer can be displayed;
// any other JSON shape (an array, an object, a boolean, an absent field) —
// or any string that is not decimal digits ('+1', ' 1 ', '-0', '1e3') or
// digits beyond that width — throws in the encoder where the lenient BigInt
// parse would still show a number, so it can never be signed: the leg is
// unmodelable and must block approval (ORDER_FILL_UNREADABLE_MESSAGE)
// instead of showing a fill size.
const isDisplayableFillAtoms = (rawFill) => {
  if (typeof rawFill !== 'string') return Number.isSafeInteger(rawFill)
  if (!/^\d+$/.test(rawFill)) return false
  // the width is settled before BigInt runs, so a site-supplied string of
  // any length costs a bounded amount of work during render
  const digits = rawFill.replace(/^0+(?=\d)/, '')
  return (
    digits.length <= MAX_AMOUNT_COUNT_DIGITS &&
    BigInt(digits) <= MAX_AMOUNT_COUNT
  )
}

// The committed swap size of an order fill is signed from the account-command
// input's `fill_atoms` — a bare atom string whose scale lives in chain order
// data, not in the payload. Verify/display it verbatim (unknown scale): any
// attached label must equal the raw atom count to be shown; unreadable or
// negative values fail closed. Keys embed the input index for uniqueness.
const collectSignedInputExtras = (input, index) => {
  const extras = []
  // the signer's inputCommands filter accepts both input_type spellings —
  // a contradictory input_type: 'UTXO' + command 'FillOrder' encodes a plain
  // utxo input and never signs fill_atoms, so no row is fabricated
  const isAccountCommandInput = isAccountCommandShape(input?.input)
  const rawFill = input?.input?.fill_atoms
  if (
    isAccountCommandInput &&
    input?.input?.command === 'FillOrder' &&
    isDisplayableFillAtoms(rawFill)
  ) {
    extras.push({
      key: `order:fill:${index}`,
      label: 'Order fill',
      container: { atoms: rawFill },
      decimals: null,
      tokenId: null,
      withTicker: false,
    })
  }
  return extras
}

// True for every output that yields a signed row of the approval — an
// amount row (a signer amount container, which a burned value is as well)
// or an extra row (an issued total supply, order balances) — so that
// nothing shown as a signed amount can sit beside a "To" line this
// predicate disagrees with. Resolved through the SAME container resolver
// and the SAME extras collector that build those rows, so it cannot drift
// from what is displayed; the index and the token scales only label and
// scale an extra, never decide whether one exists. A locked output coming
// back to this wallet yields its own row the same way (its value
// container), so it reads true here as well. Shapes that resolve a
// container or an extra yet carry no numeric amount at all render no row
// and still read true here — the safe direction.
export const outputCarriesSignedAmount = (output) =>
  signerAmountContainer(output, 'output') !== null ||
  collectSignedExtras(output, 0, undefined).length > 0

// One leg entry the approval can read: a non-array object (never null,
// undefined, a primitive or an array). An input must carry the `input`
// object the signer dispatches on and an output the string `type` the
// signer encodes by — without them nothing about the entry is verifiable.
const isLegEntryObject = (entry) =>
  typeof entry === 'object' && entry !== null && !Array.isArray(entry)

// An object with an own member named `toString` or `valueOf` — whatever the
// value of that member — cannot be converted to a string or a number: data
// arriving from the dApp is JSON-derived and can never contain a function,
// so such a member shadows the inherited callable with a non-callable
// value, and the object throws wherever a string or a number is required
// (label, object key, parseInt argument). An own `toLocaleString` takes no
// part in that coercion (only an explicit `.toLocaleString()` call would
// throw). An own Symbol.toPrimitive is consulted first by every implicit
// conversion, so a non-callable one throws as well, though it cannot even
// arrive through JSON; both are flagged for completeness only. Any such
// object anywhere inside a leg entry makes the entry unverifiable. Arrays
// and objects are walked to a bounded depth; an entry too deep to walk is
// unverifiable as well.
const PRIMITIVE_SHADOWERS = ['toString', 'valueOf', 'toLocaleString']
const MAX_LEG_ENTRY_DEPTH = 16
const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key)
const shadowsPrimitive = (value, depth = 0) => {
  if (value === null || typeof value !== 'object') return false
  if (depth > MAX_LEG_ENTRY_DEPTH) return true
  if (
    PRIMITIVE_SHADOWERS.some((name) => hasOwn(value, name)) ||
    Object.getOwnPropertySymbols(value).includes(Symbol.toPrimitive)
  ) {
    return true
  }
  return Object.values(value).some((child) =>
    shadowsPrimitive(child, depth + 1),
  )
}
const hasMalformedLegEntry = (inputs, outputs) =>
  inputs.some(
    (input) =>
      !isLegEntryObject(input) ||
      !isLegEntryObject(input.input) ||
      shadowsPrimitive(input),
  ) ||
  outputs.some(
    (output) =>
      !isLegEntryObject(output) ||
      typeof output.type !== 'string' ||
      shadowsPrimitive(output),
  )

// Single source of truth for what the approval UI may display and whether
// the payload may be approved at all. TransactionSummary renders from it and
// SignExternalTransaction blocks the approve action with it, so the numbers
// a user reviews are provably the numbers that get signed.
export const reconcileApprovalAmounts = (
  jsonRepresentation,
  { tokenDecimalsById, ownAddresses, intent },
) => {
  const inputs = jsonRepresentation?.inputs
  const outputs = jsonRepresentation?.outputs
  // Fail closed: the background forwards dApp params unvalidated — non-array
  // legs cannot be verified, and an entry inside a leg that is not an
  // object, lacks the signer-read `input`/`type`, or nests an object with a
  // shadowing member (hasMalformedLegEntry) can neither be verified nor
  // signed. An intent that is present but not a string (opaque bytes) can
  // neither be shown nor acknowledged nor signed. The payload is blocked,
  // never guessed and never dereferenced during render.
  if (
    (intent != null && typeof intent !== 'string') ||
    !Array.isArray(inputs) ||
    !Array.isArray(outputs) ||
    hasMalformedLegEntry(inputs, outputs)
  ) {
    return {
      amountRows: [],
      extraAmountRows: [],
      fee: null,
      blocked: true,
    }
  }
  const { outputs: relevantOutputs } = findRelevantOutputs(
    outputs,
    ownAddresses,
  )

  // Every approved output is being paid, so verify and sum them per asset —
  // grouping by each output's own asset and aggregating every mismatch of
  // that asset instead of reporting only the first offender.
  const totals = new Map()
  const extraAmountRows = []
  const pushExtra = (extra) => {
    const verified = verifyAmountPair(extra.container, extra.decimals)
    if (!verified) return // carries no numeric amount at all
    extraAmountRows.push({
      key: extra.key,
      label: extra.label,
      tokenId: extra.tokenId,
      withTicker: extra.withTicker,
      ...(verified.error
        ? {
            errors: [
              { error: verified.error, amount: verified.amount ?? null },
            ],
          }
        : { amount: verified.amount }),
    })
  }

  // Signed amounts outside output.value/amount (order balances, total
  // supply, burns, order fills) are approved too — collect/verify them over
  // ALL outputs and inputs: an extra routed to a wallet address must still
  // block on a lying decimal, exactly like a payment row would.
  inputs.forEach((input, index) => {
    collectSignedInputExtras(input, index).forEach(pushExtra)
    // An order fill the signer could not encode (the amount is not a
    // decimal-digit string or a safe integer) can never be signed: the leg
    // fails closed with the reason on its own row, like an unreadable lock.
    // An object shape that carries an amount pair keeps the existing
    // decimal-versus-atoms diagnostic ahead of the reason — it is computed
    // exactly as the fill extra used to compute it (unknown scale).
    if (
      isAccountCommandShape(input?.input) &&
      input?.input?.command === 'FillOrder' &&
      !isDisplayableFillAtoms(input?.input?.fill_atoms)
    ) {
      const rawFill = input?.input?.fill_atoms
      const pairError =
        rawFill && typeof rawFill === 'object'
          ? verifyAmountPair(rawFill, null)
          : null
      extraAmountRows.push({
        key: `order:fill:${index}`,
        label: 'Order fill',
        tokenId: null,
        withTicker: false,
        errors: [
          ...(pairError?.error
            ? [
                {
                  error: pairError.error,
                  amount: pairError.amount ?? null,
                },
              ]
            : []),
          { error: ORDER_FILL_UNREADABLE_MESSAGE, amount: null },
        ],
      })
    }
    // A LockThenTransfer utxo is re-encoded by the signer through
    // getOutputs with the utxo's own lock (getTransactionHEX, optUtxos_),
    // so a lock it could not encode there can never be signed — exactly
    // like on an output. The signer does that for EVERY input carrying such
    // a utxo and consults the input type only afterwards, to keep or discard
    // the bytes: an injected utxo on an account-command input with an
    // unreadable lock throws at sign time too, so it blocks here as well,
    // while a readable one signs nothing and yields no row.
    if (input?.utxo?.type === 'LockThenTransfer') {
      const lockError = describeOutputLock(input.utxo.lock).error
      if (lockError) {
        extraAmountRows.push({
          key: `lock:input:${index}`,
          label: LOCKED_INPUT_ROW_LABEL,
          tokenId: null,
          withTicker: false,
          errors: [{ error: lockError, amount: null }],
        })
      }
    }
    // SECURITY: MintTokens mints and DelegationBalance withdrawals commit
    // input.amount.atoms — the same signed fields as output amounts. A
    // lying `.decimal` on them must block approval exactly like
    // Transfer/DelegateStaking does, so verify here and surface the error
    // like the extras do. legKind 'input' resolves the signer-read
    // account-command containers AND signed-type utxo values of the
    // {input, utxo} wrapper; injected value-type fields (type 'Transfer'
    // etc. on an account input) never resolve, so no row can be fabricated
    // from them.
    const container = signerAmountContainer(input, 'input')
    if (!container) return
    const verified = verifyAmountPair(
      container,
      signerAmountScale(input, container, tokenDecimalsById, 'input'),
    )
    if (!verified?.error) return // no numeric amount, or a consistent pair
    extraAmountRows.push({
      key: `signed-amount:${index}`,
      label: 'Amount',
      tokenId: signerAmountTokenId(input, container, 'input'),
      withTicker: true,
      errors: [{ error: verified.error, amount: verified.amount ?? null }],
    })
  })
  outputs.forEach((output, index) => {
    // Destroyed coins/tokens are not payments to anyone: they surface as
    // their own verified 'Burned' row and are only ever subtracted inside
    // the fee arithmetic — never reported as miner fee. NB: the signer has
    // no 'BurnCoin' output branch, and a BurnToken value with neither
    // token_id nor type 'Coin' is dropped by the signer — neither shape is
    // ever displayed or verified.
    if (output?.type === 'BurnToken') {
      const value = output?.value
      const isEncodableBurn = value?.token_id || value?.type === 'Coin'
      if (
        isEncodableBurn &&
        (value?.amount?.atoms != null || value?.amount?.decimal != null)
      ) {
        const burned = verifyAmountPair(
          value,
          resolveAssetDecimals(
            value?.token_id ? value.token_id : undefined,
            tokenDecimalsById,
          ),
        )
        if (burned) {
          extraAmountRows.push({
            key: `burned:${index}`,
            label: 'Burned',
            tokenId: value?.token_id ?? null,
            withTicker: true,
            ...(burned.error
              ? {
                  errors: [
                    { error: burned.error, amount: burned.amount ?? null },
                  ],
                }
              : { amount: burned.amount }),
          })
        }
      }
    }
    collectSignedExtras(output, index, tokenDecimalsById).forEach(pushExtra)
  })

  // Locked outputs returning to this wallet (isLockedSelfOutput): the
  // funds come back, but encumbered by the site's chosen lock until it
  // expires. They are paid to no one else, so they never join the Amount
  // rows below, and they are not plain change: each gets its own row with
  // its verified amount (the same container, identity and scale as any
  // output — a lying `.decimal` on it blocks approval like on a payment)
  // and its lock in plain words. A lock the signer could not encode
  // (readOutputLock) can never be signed: the row states it and approval
  // fails closed. A locked output without any amount is the same kind of
  // unusable leg — the signer's BigInt(undefined) throws.
  outputs.forEach((output, index) => {
    if (!isLockedSelfOutput(output, ownAddresses)) return
    const container = signerAmountContainer(output, 'output')
    const tokenId = signerAmountTokenId(output, container, 'output')
    const verified = verifyAmountPair(
      container,
      signerAmountScale(output, container, tokenDecimalsById, 'output'),
    )
    const lock = describeOutputLock(output.lock)
    const errors = []
    if (!verified) {
      errors.push({ error: UNVERIFIABLE_MESSAGE, amount: null })
    } else if (verified.error) {
      errors.push({ error: verified.error, amount: verified.amount ?? null })
    }
    if (lock.error) errors.push({ error: lock.error, amount: null })
    extraAmountRows.push({
      key: `locked:${index}`,
      label: LOCKED_ROW_LABEL,
      tokenId,
      withTicker: true,
      // the lock words travel with the amount, verified or shown as the
      // signed truth — only an unreadable lock leaves them out
      ...(lock.text && { note: lock.text }),
      ...(errors.length > 0 ? { errors } : { amount: verified.amount }),
    })
  })

  // payment rows: only outputs that don't land back on this wallet — burns
  // and the locked outputs coming back to this wallet surface as their own
  // rows above and are never payment rows (BurnCoin-shaped outputs resolve
  // to no container at all — the signer never encodes them). A locked
  // output to a RECEIVING address is among the relevant outputs of a
  // self-transfer (it names the "To" line), yet it is paid to no one else.
  relevantOutputs.forEach((output) => {
    if (output?.type === 'BurnToken') return
    if (isLockedSelfOutput(output, ownAddresses)) return

    // SECURITY: the container matches the signer exactly via the shared
    // leg-kind-aware resolver ('output') — DelegateStaking signs
    // output.amount.atoms, other amount-bearing outputs sign
    // output.value.amount.atoms, and shapes without a signed numeric
    // (CreateOrder, IssueFungibleToken, DataDeposit, CreateDelegationId,
    // IssueNft) resolve to null so injected extra fields — including
    // injected command/account_type — can never fake a row. Identity and
    // scale come from the same signer-read fields
    // (signerAmountTokenId / signerAmountScale).
    const container = signerAmountContainer(output, 'output')
    const tokenId = signerAmountTokenId(output, container, 'output')
    const decimals = signerAmountScale(
      output,
      container,
      tokenDecimalsById,
      'output',
    )
    const verified = verifyAmountPair(container, decimals)
    // A locked payment's lock is the recipient's concern, not an
    // encumbrance of this wallet — but the signer still has to encode it.
    // One it could not encode (readOutputLock) can never be signed, so the
    // payment fails closed with the reason, exactly like a lying amount.
    const lockError =
      output?.type === 'LockThenTransfer'
        ? describeOutputLock(output.lock).error
        : null
    if (!verified && !lockError) return // carries nothing to verify
    const key = tokenId || 'Coin'
    const entry = totals.get(key) || {
      key,
      tokenId,
      decimals,
      atoms: null,
      errors: [],
    }
    if (lockError) entry.errors.push({ error: lockError, amount: null })
    totals.set(key, entry)
    if (!verified) return
    if (verified.error) {
      entry.errors.push({
        error: verified.error,
        amount: verified.amount ?? null,
      })
    } else {
      entry.atoms = (entry.atoms ?? 0n) + verified.atoms
    }
  })

  const amountRows = [...totals.values()].map((entry) => ({
    key: entry.key,
    tokenId: entry.tokenId,
    ...(entry.errors.length > 0
      ? { errors: entry.errors }
      : { amount: atomsToDecimalString(entry.atoms, entry.decimals ?? 0) }),
  }))

  // SECURITY: the shared fee rule (deriveApprovalFee) — computed from the
  // signed coin atom sums; the declared fee only as a verified fallback.
  const fee = deriveApprovalFee(jsonRepresentation)

  const blocked =
    amountRows.some((row) => row.errors) ||
    extraAmountRows.some((row) => row.errors) ||
    Boolean(fee?.error)

  return { amountRows, extraAmountRows, fee, blocked }
}
