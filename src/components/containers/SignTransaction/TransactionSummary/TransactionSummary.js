import { useState, useContext } from 'react'

import { MintlayerContext, SettingsContext } from '@Contexts'
import { SignTransaction as SignTxHelpers, TransactionAmounts } from '@Helpers'
import { CopyButton } from '@ComposedComponents'
import { KV, Tag } from '@BasicComponents'

import styles from './TransactionSummary.module.css'

// Payload-derived text: only strings and numbers are ever rendered. An
// object that carries its own `toString`/`valueOf` shadows the inherited
// callable with a non-callable value (JSON cannot carry functions) and
// throws when converted to text, so objects show a neutral placeholder
// instead.
const isText = (value) => typeof value === 'string' || typeof value === 'number'
const asText = (value, fallback = '—') =>
  isText(value) ? String(value) : fallback
const truncate = (value, head = 12, tail = 8) => {
  if (!value || !isText(value)) return '—'
  const text = String(value)
  return text.length > head + tail + 3
    ? `${text.slice(0, head)}…${text.slice(-tail)}`
    : text
}

// The source address of a UTXO leg — where the funds it spends live: the
// utxo's destination or, for an Htlc-typed utxo (which carries none), the
// wallet's spend or refund key (shared signerUtxoOwnerAddress). A string
// only. A utxo is encoded as the spent outpoint only for input_type 'UTXO'
// legs, so an injected utxo object on an account-command input must not
// fake the From address.
const utxoSourceAddressOf = (input, ownAddresses) => {
  if (input?.input?.input_type !== 'UTXO') return null
  const utxo = input.utxo
  if (utxo?.type === 'Htlc') {
    return TransactionAmounts.signerUtxoOwnerAddress(utxo, ownAddresses)
  }
  return typeof utxo?.destination === 'string' ? utxo.destination : null
}

// Where the funds come from: the first input whose source address is one
// of the wallet's. getTransactionHEX signs an input with the key of
// `utxo.destination || input.authority || input.destination` (or of
// `outputs[0].destination` for every input when the first input is a
// DelegationBalance withdrawal) and an input whose utxo carries an `htlc`
// object with a key of that object instead; a FillOrder input is never
// signed — its `destination` is encoded in the fill as the address the
// acquired asset lands on. The From line reads a utxo's own address
// (utxoSourceAddressOf) and, failing that, an input's `destination`, the
// last fallback of that chain — never on a FillOrder; `.address` appears
// nowhere in the signer. When no leg is the wallet's, the first utxo's
// source address is shown as it is.
const findOwnInputAddress = (inputs, ownAddresses) => {
  const ownList = [
    ...(ownAddresses.receiving || []),
    ...(ownAddresses.change || []),
  ]
  const isOwn = (address) =>
    typeof address === 'string' && ownList.includes(address)

  for (const input of inputs) {
    const utxoAddress = utxoSourceAddressOf(input, ownAddresses)
    if (isOwn(utxoAddress)) return utxoAddress
    if (
      input?.input?.command !== 'FillOrder' &&
      isOwn(input?.input?.destination)
    ) {
      return input.input.destination
    }
  }
  return (
    inputs
      .map((input) => utxoSourceAddressOf(input, ownAddresses))
      .find(Boolean) ?? null
  )
}

const OPERATION_LABELS = [
  ['isTransfer', 'Send'],
  ['isBridgeRequest', 'Bridge transaction'],
  ['isTokenMint', 'Mint tokens'],
  ['isTokenUnmint', 'Unmint tokens'],
  ['isTokenMintWithLock', 'Mint tokens with lock'],
  ['isIssueToken', 'Issue token'],
  ['isIssueNft', 'Issue NFT'],
  ['isCreateOrder', 'Create order'],
  ['isFillOrder', 'Fill order'],
  ['isConcludeOrder', 'Conclude order'],
  ['isBurnCoin', 'Burn coins'],
  ['isBurnToken', 'Burn tokens'],
  ['isLockTokenSupply', 'Lock token supply'],
  ['isChangeTokenAuthority', 'Change token authority'],
  ['isChangeTokenMetadata', 'Change token metadata'],
  ['isFreezeToken', 'Freeze token'],
  ['isUnfreezeToken', 'Unfreeze token'],
  ['isCreateHtlc', 'Create HTLC (swap escrow)'],
  ['isSpendHtlc', 'Claim HTLC'],
  ['isDataDeposit', 'Data deposit'],
  ['isCreateDelegationId', 'Create delegation'],
  ['isDelegateStaking', 'Stake to delegation'],
  ['isDelegateWithdraw', 'Withdraw from delegation'],
]

// The two keys an Htlc OUTPUT commits (encode_output_htlc): whoever holds
// the spend key can claim with the secret, whoever holds the refund key can
// recover after the lock time. Each is labelled as this wallet's ("your
// address", the same treatment as the To lines) or plainly not, so the user
// sees who can do what before entering a password. The rows are
// informational only: nothing here blocks approval — the wallet's own
// spender-shaped flow legitimately funds an escrow refunded elsewhere.
const HTLC_CLAIM_KEY_LABEL = 'Claim key (with the secret)'
const HTLC_REFUND_KEY_LABEL = 'Refund key (after the lock)'

/**
 * Compact, user-friendly recap for a transaction: action, counterparties,
 * amount, fee and network — with everything technical collapsed away.
 */
const TransactionSummary = ({
  jsonRepresentation,
  intent,
  ownAddresses,
  technicalDetails,
  rawJsonNode,
}) => {
  const { tokenMap, allNetworkTokensData } = useContext(MintlayerContext)
  const { networkType } = useContext(SettingsContext)
  const [showDetails, setShowDetails] = useState(false)

  // Fail closed on non-array inputs (the background forwards dApp params
  // unvalidated): normalized here so the From lookup can never crash, and
  // reconcileApprovalAmounts blocks the payload below.
  const inputs = Array.isArray(jsonRepresentation?.inputs)
    ? jsonRepresentation.inputs
    : []

  const coinTicker = networkType === 'testnet' ? 'TML' : 'ML'
  const fromAddress = findOwnInputAddress(inputs, ownAddresses)

  const tokenDecimalsById =
    TransactionAmounts.buildTokenDecimalsIndex(allNetworkTokensData)
  // SECURITY: a dApp-supplied intent is opaque bytes (a string). Anything
  // else that is present is malformed — it blocks approval below and is
  // never rendered (an object cannot be a React child).
  const intentText = typeof intent === 'string' ? intent : null

  // SECURITY: every displayed number is derived from the signed `.atoms`
  // values, and the dApp-supplied `.decimal` labels are verified against
  // them. Any disagreement fails closed: the row shows the verification
  // error instead of a number and the page blocks the approve action.
  // destinationRows carry one group per distinct signer destination, in the
  // order the transaction declares its outputs; a destinationless group
  // (destination null) collects the amounts that name no address at all.
  const {
    destinationRows,
    extraAmountRows,
    fee,
    blocked: amountsMismatch,
  } = TransactionAmounts.reconcileApprovalAmounts(jsonRepresentation, {
    tokenDecimalsById,
    ownAddresses,
    intent,
  })

  const tickerOf = (tokenId) => {
    if (!tokenId) return coinTicker
    // a token id that is not a string or a number can neither be looked up
    // nor shown as text (an object with a shadowing `toString`/`valueOf`
    // would throw when coerced)
    return isText(tokenId)
      ? tokenMap?.[tokenId] || truncate(tokenId, 8, 6)
      : '—'
  }
  // React keys and labels built from payload-derived ids
  const rowKey = (prefix, key) => `${prefix}-${asText(key, 'unknown')}`

  // SECURITY: a blocked payload is never interpreted: the operation label
  // is fixed and no amount is derived from it, so nothing that could throw
  // on a dApp-controlled value is computed for the blocked screen (the
  // address rows read strings only).
  const typeFlag = amountsMismatch
    ? null
    : SignTxHelpers.getTransactionType(jsonRepresentation, intentText)
  const label =
    OPERATION_LABELS.find(([flag]) => flag === typeFlag)?.[1] ?? 'Transaction'

  return (
    <div
      className={styles.summary}
      data-testid="transaction-summary"
    >
      <div className={styles.header}>
        <span className={styles.headerLabel}>{label}</span>
        {intentText && <Tag c="teal">Bridge</Tag>}
      </div>
      <KV
        rows={[
          [
            'From',
            <span
              key="from"
              className={styles.valueLine}
            >
              {truncate(fromAddress, 10, 8)}
              {fromAddress && <CopyButton content={fromAddress} />}
            </span>,
          ],
          // One To line and that destination's own amounts per distinct
          // signer destination, in declared order: naming one recipient
          // beside a summed amount would present other destinations' money
          // as theirs. A destinationless group renders its amounts with no
          // To line (the signer reads `destination` on none of those
          // outputs — they pay keys or delegations, not an address shown
          // here); the destination of an order account command's fill is
          // named on the fill's own row below, never as a To pair.
          ...destinationRows.flatMap(
            ({ destination, toSelf, amountRows, htlcKeyRows = [] }) => [
              ...(destination
                ? [
                    [
                      toSelf ? 'To (your address)' : 'To',
                      <span
                        key={rowKey('to', destination)}
                        className={styles.valueLine}
                      >
                        {truncate(destination, 10, 8)}
                        {destination && <CopyButton content={destination} />}
                      </span>,
                    ],
                  ]
                : []),
              ...amountRows.map(({ key, tokenId, amount, errors }) => [
                'Amount',
                <span
                  key={rowKey(
                    'amount',
                    `${asText(destination, 'unaddressed')}:${key}`,
                  )}
                  className={errors ? styles.amountError : styles.amount}
                >
                  {errors
                    ? errors
                        .map(({ error, amount: signed }) =>
                          signed != null
                            ? `${error} — will sign ${signed} ${tickerOf(tokenId)}`
                            : error,
                        )
                        .join('; ')
                    : `${amount} ${tickerOf(tokenId)}`}
                </span>,
              ]),
              // The keys each Htlc output of this group commits, named right
              // beside its amount row: a truncated key with its copy
              // treatment, marked as this wallet's in the row label when the
              // wallet holds it, and the amount that very output escrows —
              // shown on its claim row, so each pair stays tied to its own
              // escrow however many Htlc outputs sum into the group's single
              // Amount row. A key the payload does not carry renders as the
              // placeholder, with nothing to copy.
              ...htlcKeyRows.flatMap(
                ({
                  key,
                  spendKey,
                  spendOwn,
                  refundKey,
                  refundOwn,
                  amount,
                  tokenId,
                }) => [
                  [
                    spendOwn
                      ? `${HTLC_CLAIM_KEY_LABEL} (your address)`
                      : HTLC_CLAIM_KEY_LABEL,
                    <span
                      key={rowKey('htlc-claim', key)}
                      className={styles.valueLine}
                    >
                      {truncate(spendKey, 10, 8)}
                      {spendKey && <CopyButton content={spendKey} />}
                      {amount != null &&
                        ` — escrows ${amount} ${tickerOf(tokenId)}`}
                    </span>,
                  ],
                  [
                    refundOwn
                      ? `${HTLC_REFUND_KEY_LABEL} (your address)`
                      : HTLC_REFUND_KEY_LABEL,
                    <span
                      key={rowKey('htlc-refund', key)}
                      className={styles.valueLine}
                    >
                      {truncate(refundKey, 10, 8)}
                      {refundKey && <CopyButton content={refundKey} />}
                    </span>,
                  ],
                ],
              ),
            ],
          ),
          // note: the plain-words lock of funds coming back locked to this
          // wallet — read out with the amount, verified or shown as the
          // signed truth, so the encumbrance is never separated from it.
          // An order fill's destination, when the signer encodes one, is
          // named on the fill's own row the same way: where the acquired
          // asset lands is signing-relevant, and it is never a To pair
          // (no output pays it).
          ...extraAmountRows.map(
            ({
              key,
              label,
              tokenId,
              amount,
              errors,
              withTicker,
              note,
              destination,
            }) => [
              label,
              <span
                key={rowKey('extra', key)}
                className={errors ? styles.amountError : styles.amount}
              >
                {errors
                  ? errors
                      .map(({ error, amount: signed }) =>
                        signed != null
                          ? `${error} — will sign ${signed}${
                              withTicker ? ` ${tickerOf(tokenId)}` : ''
                            }${note ? `, ${note}` : ''}`
                          : error,
                      )
                      .join('; ')
                  : `${withTicker ? `${amount} ${tickerOf(tokenId)}` : amount}${
                      note ? `, ${note}` : ''
                    }`}
                {isText(destination) && (
                  <>
                    {' — proceeds to '}
                    <span className={styles.valueLine}>
                      {truncate(destination, 10, 8)}
                      <CopyButton content={destination} />
                    </span>
                  </>
                )}
              </span>,
            ],
          ),
          ...(fee
            ? [
                [
                  'Network fee',
                  <span
                    key="fee"
                    className={fee.error ? styles.amountError : styles.amount}
                  >
                    {fee.unknown
                      ? 'Unknown'
                      : (fee.error ?? `${fee.amount} ${coinTicker}`)}
                    {!fee.unknown && fee.error && fee.amount != null && (
                      <>
                        {' '}
                        — will sign {fee.amount} {coinTicker}
                      </>
                    )}
                  </span>,
                ],
              ]
            : []),
          ['Network', networkType === 'testnet' ? 'Testnet' : 'Mainnet'],
        ]}
      />

      {amountsMismatch && (
        <div
          className={styles.mismatchBanner}
          data-testid="approval-blocked"
          role="alert"
        >
          SECURITY: the amounts reported by the site do not match what this
          transaction would actually sign. Approval is blocked.
        </div>
      )}

      {intentText && (
        <div className={styles.intentRow}>
          <Tag c="teal">Bridge intent</Tag>
          {/* SECURITY: the wallet signs these bytes — show them IN FULL.
              Truncation here would be blind signature by UI. */}
          <span
            className={`${styles.intentValue} ${styles.intentValueFull}`}
            data-testid="intent-raw"
          >
            {intentText}
          </span>
          <CopyButton content={intentText} />
        </div>
      )}

      <button
        type="button"
        className={styles.detailsToggle}
        onClick={() => setShowDetails((visible) => !visible)}
        data-testid="toggle-technical-details"
      >
        {showDetails ? 'Hide technical details' : 'Show technical details'}
      </button>
      {showDetails && (
        <div
          className={styles.technical}
          data-testid="technical-details"
        >
          {technicalDetails}
          {rawJsonNode}
        </div>
      )}
    </div>
  )
}

export default TransactionSummary
