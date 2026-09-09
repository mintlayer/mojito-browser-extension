import { useState, useContext } from 'react'
import Decimal from 'decimal.js'

import { MintlayerContext, SettingsContext } from '@Contexts'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import { CopyButton } from '@ComposedComponents'
import { KV, Tag } from '@BasicComponents'

import styles from './TransactionSummary.module.css'

// dApp- and wallet-built transaction JSONRepresentation is issuer/flow
// controlled: only walk plain structures and cap anything rendered.
const MAX_TEXT_LENGTH = 64

const truncate = (value, head = 12, tail = 8) => {
  if (!value) return '—'
  const text = String(value)
  return text.length > head + tail + 3
    ? `${text.slice(0, head)}…${text.slice(-tail)}`
    : text
}

const bounded = (value) => {
  const text = value == null ? '' : String(value)
  return text.length > MAX_TEXT_LENGTH
    ? `${text.slice(0, MAX_TEXT_LENGTH)}…`
    : text
}

const getAddressOf = (candidate) => {
  if (!candidate) return null
  if (typeof candidate === 'string') return candidate
  if (typeof candidate.destination === 'string') return candidate.destination
  if (typeof candidate.address === 'string') return candidate.address
  return null
}

// The output the user is actually affecting: not back to their own wallet.
const findRelevantOutput = (inputs, outputs, ownAddresses) => {
  const ownList = [
    ...(ownAddresses.receiving || []),
    ...(ownAddresses.change || []),
  ]
  const isOwn = (address) => address && ownList.includes(address)

  const inputWithToken = inputs.find(
    (input) => input.utxo?.value?.type === 'TokenV1',
  )
  if (inputWithToken) {
    const tokenId = inputWithToken.utxo.value.token_id
    return outputs.find(
      (output) =>
        output.value?.token_id === tokenId && !isOwn(getAddressOf(output)),
    )
  }
  return outputs.find((output) => !isOwn(getAddressOf(output)))
}

const findOwnInputAddress = (inputs, ownAddresses) => {
  const ownList = [
    ...(ownAddresses.receiving || []),
    ...(ownAddresses.change || []),
  ]
  for (const input of inputs) {
    const address = getAddressOf(input?.utxo) || getAddressOf(input?.input)
    if (address && ownList.includes(address)) return address
  }
  return (
    inputs.find((input) => input?.utxo?.destination)?.utxo?.destination ?? null
  )
}

const OPERATION_LABELS = [
  ['isBridgeRequest', 'Bridge transaction'],
  ['isDelegateStaking', 'Stake to delegation'],
  ['isDelegateWithdraw', 'Withdraw from delegation'],
  ['isCreateHtlc', 'Create HTLC (swap escrow)'],
  ['isSpendHtlc', 'Claim HTLC'],
  ['isCreateStakePool', 'Create stake pool'],
  ['isCreateDelegationId', 'Create delegation'],
  ['isTokenMint', 'Mint tokens'],
  ['isTokenUnmint', 'Unmint tokens'],
  ['isIssueToken', 'Issue token'],
  ['isIssueNft', 'Issue NFT'],
  ['isBurnCoin', 'Burn coins'],
  ['isBurnToken', 'Burn tokens'],
  ['isFreezeToken', 'Freeze token'],
  ['isUnfreezeToken', 'Unfreeze token'],
  ['isLockTokenSupply', 'Lock token supply'],
  ['isChangeTokenMetadata', 'Change token metadata'],
  ['isChangeTokenAuthority', 'Change token authority'],
  ['isTransfer', 'Send'],
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
  const { tokenMap } = useContext(MintlayerContext)
  const { networkType } = useContext(SettingsContext)
  const [showDetails, setShowDetails] = useState(false)

  const inputs = jsonRepresentation?.inputs || []
  const outputs = jsonRepresentation?.outputs || []

  const coinTicker = networkType === 'testnet' ? 'TML' : 'ML'
  const fromAddress = findOwnInputAddress(inputs, ownAddresses)
  const output = findRelevantOutput(inputs, outputs, ownAddresses)
  const toAddress = getAddressOf(output)

  const amountInfo = (() => {
    const value = output?.value || output?.amount
    const tokenId = value?.token_id || output?.token_id
    const decimals = tokenId ? undefined : 11
    const amount = value?.amount?.decimal ?? output?.amount?.decimal ?? null
    if (amount == null) return null
    const ticker = tokenId
      ? tokenMap?.[tokenId] || truncate(tokenId, 8, 6)
      : coinTicker
    const formatted = new Decimal(amount).toFixed(
      decimals != null ? Math.min(decimals, 11) : 8,
    )
    return { amount: formatted.replace(/\.?0+$/, ''), ticker }
  })()

  const fee = jsonRepresentation?.fee?.decimal ?? null

  const typeFlag = SignTxHelpers.getTransactionType(jsonRepresentation, intent)
  const label =
    OPERATION_LABELS.find(([flag]) => flag === typeFlag)?.[1] ?? 'Transaction'

  return (
    <div
      className={styles.summary}
      data-testid="transaction-summary"
    >
      <div className={styles.header}>
        <span className={styles.headerLabel}>{label}</span>
        {intent && <Tag c="teal">Bridge</Tag>}
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
            'To',
            <span
              key="to"
              className={styles.valueLine}
            >
              {truncate(toAddress, 10, 8)}
              {toAddress && <CopyButton content={toAddress} />}
            </span>,
          ],
          ...(amountInfo
            ? [
                [
                  'Amount',
                  <span
                    key="amount"
                    className={styles.amount}
                  >
                    {amountInfo.amount} {amountInfo.ticker}
                  </span>,
                ],
              ]
            : []),
          ...(fee != null
            ? [
                [
                  'Network fee',
                  <span
                    key="fee"
                    className={styles.amount}
                  >
                    {fee} ML
                  </span>,
                ],
              ]
            : []),
          ['Network', networkType === 'testnet' ? 'Testnet' : 'Mainnet'],
        ]}
      />

      {intent && (
        <div className={styles.intentRow}>
          <Tag c="teal">Bridge intent</Tag>
          <span className={styles.intentValue}>{bounded(intent)}</span>
          <CopyButton content={intent} />
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
