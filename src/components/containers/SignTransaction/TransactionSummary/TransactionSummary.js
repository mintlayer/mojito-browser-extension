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

const getAddressOf = (candidate) => {
  if (!candidate) return null
  if (typeof candidate === 'string') return candidate
  if (typeof candidate.destination === 'string') return candidate.destination
  if (typeof candidate.address === 'string') return candidate.address
  return null
}

// The signer reads utxo fields only for input_type 'UTXO' legs — an
// injected utxo object on an account-command input must not fake the From
// address.
const utxoAddressOf = (input) =>
  input?.input?.input_type === 'UTXO' ? getAddressOf(input?.utxo) : null

const findOwnInputAddress = (inputs, ownAddresses) => {
  const ownList = [
    ...(ownAddresses.receiving || []),
    ...(ownAddresses.change || []),
  ]
  for (const input of inputs) {
    const address = utxoAddressOf(input) || getAddressOf(input?.input)
    if (address && ownList.includes(address)) return address
  }
  return inputs.find((input) => utxoAddressOf(input))?.utxo?.destination ?? null
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

  // Fail closed on non-array legs (the background forwards dApp params
  // unvalidated): normalized here so rendering can never crash, and
  // reconcileApprovalAmounts blocks the payload below.
  const inputs = Array.isArray(jsonRepresentation?.inputs)
    ? jsonRepresentation.inputs
    : []
  const outputs = Array.isArray(jsonRepresentation?.outputs)
    ? jsonRepresentation.outputs
    : []

  const coinTicker = networkType === 'testnet' ? 'TML' : 'ML'
  const fromAddress = findOwnInputAddress(inputs, ownAddresses)
  const { outputs: relevantOutputs, toSelf: targetsOwnWallet } =
    TransactionAmounts.findRelevantOutputs(outputs, ownAddresses)
  const toAddress = getAddressOf(relevantOutputs[0])
  const toSelf = targetsOwnWallet && Boolean(toAddress)

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
  const {
    amountRows,
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
          [
            toSelf ? 'To (your address)' : 'To',
            <span
              key="to"
              className={styles.valueLine}
            >
              {truncate(toAddress, 10, 8)}
              {toAddress && <CopyButton content={toAddress} />}
            </span>,
          ],
          ...amountRows.map(({ key, tokenId, amount, errors }) => [
            'Amount',
            <span
              key={rowKey('amount', key)}
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
          ...extraAmountRows.map(
            ({ key, label, tokenId, amount, errors, withTicker }) => [
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
                            }`
                          : error,
                      )
                      .join('; ')
                  : withTicker
                    ? `${amount} ${tickerOf(tokenId)}`
                    : amount}
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
