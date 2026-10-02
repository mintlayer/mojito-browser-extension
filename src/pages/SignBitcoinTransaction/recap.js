import { BTCTransaction } from '@Cryptos'

const SATS_PER_BTC = 100000000
const HTLC_REFUND_FEE_SATOSHIS = 1000
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

/**
 * Builds a human-readable summary for a dApp BTC sign request so the user
 * approves parsed facts (amount, destination, fee, locktime) instead of raw
 * JSON. Pure: same input -> same output; throws nothing (unparseable fields
 * render as warned rows).
 *
 * Returns { title, rows: [{ label, value, mono?, warn? }], warning? } or
 * null when the request shape is unknown (the raw JSON preview stays the
 * only reference in that case).
 */
export const buildBtcSignRecap = ({ json, networkType, escrowFeeInfo }) => {
  if (!json) return null

  // Create: the wallet funds the HTLC escrow from its own UTXOs.
  if (json.secretHash) {
    let amountSat = null
    let amountInvalid = false
    try {
      amountSat = parseSatoshiAmount(json.amount)
    } catch {
      amountInvalid = true
    }
    return {
      title: 'Create HTLC — fund an escrow',
      rows: [
        row(
          'You are sending',
          amountSat != null
            ? `${toBtc(amountSat)} BTC (${amountSat} sat)`
            : `Unparseable amount: ${String(json.amount)}`,
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
        row('Refund locktime', `${json.timeoutBlocks} blocks`),
        row('Network', networkType),
      ],
      warning:
        'These funds are locked in the escrow until the HTLC is claimed or the locktime expires. Verify the escrow address and amount with the service you are trading with.',
    }
  }

  // Spend (claim): the wallet redeems the HTLC — destination and secret
  // exposure are the facts the user must see.
  if (json.type === 'spendHtlc') {
    const amountSat = Number(json.utxo?.value)
    const claimable = Number.isFinite(amountSat) && amountSat > HTLC_CLAIM_FEE
    return {
      title: 'Claim HTLC',
      rows: [
        row(
          'You are claiming',
          claimable
            ? `${toBtc(amountSat - HTLC_CLAIM_FEE)} BTC (${HTLC_CLAIM_FEE} sat fee)`
            : 'unknown amount',
          { warn: !claimable },
        ),
        row('Paid to', json.to || 'missing', {
          mono: true,
          warn: !json.to,
        }),
        row('Secret', 'revealed on-chain when this transaction confirms', {
          warn: true,
        }),
        row('Network', networkType),
      ],
    }
  }

  // Refund: after locktime, funds return to the funder.
  if (json.type === 'refundHtlc') {
    const amountSat = Number(json.utxo?.value)
    const refundable =
      Number.isFinite(amountSat) && amountSat > HTLC_REFUND_FEE_SATOSHIS
    return {
      title: 'Refund HTLC',
      rows: [
        row(
          'You are refunding',
          refundable
            ? `${toBtc(amountSat - HTLC_REFUND_FEE_SATOSHIS)} BTC (${HTLC_REFUND_FEE_SATOSHIS} sat fee)`
            : 'unknown amount',
          { warn: !refundable },
        ),
        row('Paid to', json.to || 'missing', {
          mono: true,
          warn: !json.to,
        }),
        row('Network', networkType),
      ],
    }
  }

  return null
}
