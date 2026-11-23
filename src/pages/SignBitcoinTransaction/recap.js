import { BTCTransaction } from '@Cryptos'

const SATS_PER_BTC = 100000000
const HTLC_REFUND_FEE_SATOSHIS = BTCTransaction.HTLC_REFUND_FEE_SATOSHIS
const HTLC_CLAIM_FEE = BTCTransaction.HTLC_CLAIM_FEE_SATOSHIS

/**
 * Strict satoshi amount parser for dApp-supplied HTLC funding amounts.
 * Accepts only positive base-10 integer literals — no parseFloat/parseInt
 * truncation ("1.9" -> 1, "100abc" -> 100), no sign, no exponent.
 * Throws a typed INVALID_AMOUNT error otherwise.
 */
export const parseSatoshiAmount = (raw) => {
  const str = String(raw ?? '').trim()
  if (!/^\d+$/.test(str)) {
    throw Object.assign(
      new Error(`Invalid HTLC amount: ${JSON.stringify(raw ?? null)}`),
      { code: 'INVALID_AMOUNT' },
    )
  }
  const value = Number(str)
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw Object.assign(
      new Error(
        'Invalid HTLC amount: must be a positive integer amount of satoshis',
      ),
      { code: 'INVALID_AMOUNT' },
    )
  }
  return value
}

const toBtc = (sats) => (sats / SATS_PER_BTC).toFixed(8)

const row = (label, value, extra = {}) => ({ label, value, ...extra })

const UNREADABLE = 'unreadable value'

// dApp-supplied values are shown only as the string or number they are.
// Anything else is never stringified or numbered: an object with an own
// non-callable `toString` throws on both, and an array would silently join
// its elements.
const asText = (value) =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : null

const describe = (value) =>
  value == null ? String(value) : (asText(value) ?? UNREADABLE)

// A lock time the HTLC script encodes as shown: a decimal count of blocks.
const BLOCK_COUNT = /^\d+$/
const parseLockBlocks = (raw) => {
  const text = asText(raw)
  if (text === null || !BLOCK_COUNT.test(text.trim())) return null
  return text.trim()
}

// The signer's own rule for a UTXO value (toSatoshiBigInt): a positive
// whole number of satoshis as a safe-integer number or a digit-only string,
// no trimming, within the MAX_MONEY range. Whatever it rejects cannot be
// claimed; MAX_MONEY is far below 2^53, so the result is exact as a Number.
const parseSatoshiValue = (raw) => {
  try {
    return Number(BTCTransaction.toSatoshiBigInt(raw))
  } catch {
    return null
  }
}

// What a claim or a refund lands in the wallet after its fixed fee. A
// readable amount that does not exceed the fee is shown as it is, with
// that fact, instead of being reported as unknown (the builders reject it
// deterministically at signing).
const proceedsText = (amountSat, fee, feeName) =>
  amountSat === null
    ? 'unknown amount'
    : amountSat > fee
      ? `${toBtc(amountSat - fee)} BTC (${fee} sat fee)`
      : `${toBtc(amountSat)} BTC (${amountSat} sat) — not above the ${fee} sat ${feeName} fee`

const cannotApprove = (what) =>
  `${what} For your safety, this request cannot be approved.`

// A claim/refund destination is shown only as text. An absent one is
// legitimate (the wallet pays its own address); a present non-string cannot
// be used by the signer and blocks the request.
const readDestination = (json) => ({
  to: typeof json.to === 'string' ? json.to : '',
  toUnreadable: json.to != null && typeof json.to !== 'string',
})

// The request type, shown only as text (absent and unreadable differ).
const readType = (json) => ({
  type: typeof json.type === 'string' ? json.type : '',
  typeUnreadable: json.type != null && typeof json.type !== 'string',
})

// The kinds of BTC sign request the wallet can show and sign.
export const BTC_REQUEST_KIND = Object.freeze({
  REFUND: 'refund',
  CREATE: 'create',
  SPEND: 'spend',
  UNRECOGNISED: 'unrecognised',
  AMBIGUOUS: 'ambiguous',
})

const KIND_LABELS = {
  [BTC_REQUEST_KIND.REFUND]: 'a refund',
  [BTC_REQUEST_KIND.CREATE]: 'a new HTLC',
  [BTC_REQUEST_KIND.SPEND]: 'a claim',
}

// The kinds a payload matches, in this order: a refund by its type, a
// create by a secret hash, a spend by its type.
export const matchedBtcRequestKinds = (json) => {
  if (!json) return []
  return [
    json.type === 'refundHtlc' && BTC_REQUEST_KIND.REFUND,
    Boolean(json.secretHash) && BTC_REQUEST_KIND.CREATE,
    json.type === 'spendHtlc' && BTC_REQUEST_KIND.SPEND,
  ].filter(Boolean)
}

// The ONE classifier of a dApp BTC sign payload: the recap shows a request
// by it and the submit handler signs by it, so what is shown and what is
// signed cannot diverge. Exactly one match is that kind; no match is an
// unrecognised request; more than one match (a refund or claim type next
// to the secret hash of a new HTLC) is ambiguous and is never signed.
export const classifyBtcSignRequest = (json) => {
  const matches = matchedBtcRequestKinds(json)
  if (matches.length === 1) return matches[0]
  return matches.length === 0
    ? BTC_REQUEST_KIND.UNRECOGNISED
    : BTC_REQUEST_KIND.AMBIGUOUS
}

/**
 * Builds a human-readable summary for a dApp BTC sign request so the user
 * approves parsed facts (amount, destination, fee, locktime) instead of raw
 * JSON. Pure: same input -> same output; throws nothing (unparseable fields
 * render as warned rows).
 *
 * Returns { title, rows: [{ label, value, mono?, warn? }], warning?,
 * blockedReason } or null when there is no payload (the raw JSON preview
 * stays the only reference in that case). `blockedReason` is null for a
 * request that can be approved, or the text saying why it cannot be.
 * `escrowFailed` reports that the page could not build the escrow address
 * of a create request from its parameters.
 */
export const buildBtcSignRecap = ({
  json,
  networkType,
  escrowFeeInfo,
  escrowFailed = false,
}) => {
  if (!json) return null

  const kind = classifyBtcSignRequest(json)

  // Refund: after locktime, funds return to the funder.
  if (kind === BTC_REQUEST_KIND.REFUND) {
    const amountSat = parseSatoshiValue(json.utxo?.value)
    const refundable =
      amountSat !== null && amountSat > HTLC_REFUND_FEE_SATOSHIS
    const { to, toUnreadable } = readDestination(json)
    return {
      title: 'Refund HTLC',
      rows: [
        row(
          'You are refunding',
          proceedsText(amountSat, HTLC_REFUND_FEE_SATOSHIS, 'refund'),
          { warn: !refundable },
        ),
        row('Paid to', to || 'missing', {
          mono: true,
          warn: !to,
        }),
        row('Network', networkType),
      ],
      blockedReason: toUnreadable
        ? cannotApprove(
            'Unreadable destination: the site-reported destination is not text.',
          )
        : amountSat === null
          ? cannotApprove(
              'Unreadable amount: the amount of the HTLC output is not a whole number of satoshis.',
            )
          : null,
    }
  }

  // Create: the wallet funds the HTLC escrow from its own UTXOs.
  if (kind === BTC_REQUEST_KIND.CREATE) {
    let amountSat = null
    let amountInvalid = false
    try {
      amountSat = parseSatoshiAmount(json.amount)
    } catch {
      amountInvalid = true
    }
    const lockBlocks = parseLockBlocks(json.timeoutBlocks)
    return {
      title: 'Create HTLC — fund an escrow',
      rows: [
        row(
          'You are sending',
          amountSat != null
            ? `${toBtc(amountSat)} BTC (${amountSat} sat)`
            : `Unparseable amount: ${describe(json.amount)}`,
          { warn: amountInvalid },
        ),
        row(
          'Escrow address',
          escrowFeeInfo?.htlc?.p2wshAddress ?? 'unavailable',
          { mono: true, warn: !escrowFeeInfo?.htlc?.p2wshAddress },
        ),
        row(
          'Fee (estimate)',
          escrowFeeInfo?.estimatedFee != null
            ? `${escrowFeeInfo.estimatedFee} sat @ ${escrowFeeInfo.feeRate} sat/vB`
            : 'computed at signing',
          { warn: escrowFeeInfo?.estimatedFee == null },
        ),
        row(
          'Refund locktime',
          lockBlocks === null ? UNREADABLE : `${lockBlocks} blocks`,
          { warn: lockBlocks === null },
        ),
        row('Network', networkType),
      ],
      warning:
        'These funds are locked in the escrow until the HTLC is claimed or the locktime expires. Verify the escrow address and amount with the service you are trading with.',
      // Fail closed: the signer rejects an amount or lock time it cannot
      // read, and cannot fund an escrow whose address it could not build,
      // so the request must not be approvable either.
      blockedReason: amountInvalid
        ? cannotApprove(
            'Unreadable amount: the site-reported amount is not a whole number of satoshis.',
          )
        : lockBlocks === null
          ? cannotApprove(
              'Unreadable lock time: the site-reported lock time is not a number of blocks.',
            )
          : escrowFailed
            ? cannotApprove(
                'Escrow address unavailable: the HTLC script cannot be built from the parameters this site sent.',
              )
            : null,
    }
  }

  // Spend (claim): the wallet redeems the HTLC — destination and secret
  // exposure are the facts the user must see.
  if (kind === BTC_REQUEST_KIND.SPEND) {
    const amountSat = parseSatoshiValue(json.utxo?.value)
    const claimable = amountSat !== null && amountSat > HTLC_CLAIM_FEE
    const { to, toUnreadable } = readDestination(json)
    return {
      title: 'Claim HTLC',
      rows: [
        row(
          'You are claiming',
          proceedsText(amountSat, HTLC_CLAIM_FEE, 'claim'),
          { warn: !claimable },
        ),
        row('Paid to', to || 'missing', {
          mono: true,
          warn: !to,
        }),
        row('Secret', 'revealed on-chain when this transaction confirms', {
          warn: true,
        }),
        row('Network', networkType),
      ],
      // Fail closed: the signer rejects an unreadable destination and an
      // amount it cannot read, so the request must not be approvable either.
      blockedReason: toUnreadable
        ? cannotApprove(
            'Unreadable destination: the site-reported destination is not text.',
          )
        : amountSat === null
          ? cannotApprove(
              'Unreadable amount: the amount of the HTLC output is not a whole number of satoshis.',
            )
          : null,
    }
  }

  const { type, typeUnreadable } = readType(json)
  const requestTypeRow = row(
    'Request type',
    type || (typeUnreadable ? UNREADABLE : 'missing'),
    { mono: true, warn: true },
  )

  // More than one kind at once: the recap cannot say which transaction
  // this is, so it is not signed.
  if (kind === BTC_REQUEST_KIND.AMBIGUOUS) {
    const [first, second] = matchedBtcRequestKinds(json)
    return {
      title: 'Ambiguous request',
      rows: [requestTypeRow, row('Network', networkType)],
      blockedReason: cannotApprove(
        `Ambiguous request: this payload describes both ${KIND_LABELS[first]} and ${KIND_LABELS[second]}, so the wallet cannot tell which transaction to sign.`,
      ),
    }
  }

  // Anything else: no secret hash and a type that is neither the claim nor
  // the refund (absent, not text, or some other string). Nothing of it can
  // be verified for the user — it says so and blocks approval instead of
  // offering a blind sign.
  return {
    title: 'Unrecognised request',
    rows: [requestTypeRow, row('Network', networkType)],
    blockedReason: cannotApprove(
      'Unrecognised request: the site sent a transaction type the wallet cannot verify.',
    ),
  }
}
