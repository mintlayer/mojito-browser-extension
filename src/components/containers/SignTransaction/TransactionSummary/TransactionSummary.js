import { useState, useContext } from 'react'
import Decimal from 'decimal.js'

import { MintlayerContext, SettingsContext } from '@Contexts'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import { CopyButton } from '@ComposedComponents'
import { KV, Tag } from '@BasicComponents'

import styles from './TransactionSummary.module.css'

// Tokens can exceed float precision; never fall back to exponents.
const Amount = Decimal.clone({ precision: 40, toExpNeg: -30, toExpPos: 30 })

const COIN_DECIMALS = 11

const trimTrailingZeros = (text) =>
  text.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')

const truncate = (value, head = 12, tail = 8) => {
  if (!value) return '—'
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

// The outputs the user is actually approving: those that don't land straight
// back on this wallet. When every output goes to a wallet address (a
// self-transfer), the payment is what goes to a receiving address — outputs
// to change addresses are just the unspent remainder coming back.
const findRelevantOutputs = (inputs, outputs, ownAddresses) => {
  const receiving = ownAddresses.receiving || []
  const ownList = [...receiving, ...(ownAddresses.change || [])]
  const isOwn = (address) => address && ownList.includes(address)
  const isReceiving = (address) => address && receiving.includes(address)

  const inputWithToken = inputs.find(
    (input) => input.utxo?.value?.type === 'TokenV1',
  )
  const tokenId = inputWithToken?.utxo?.value?.token_id
  const matchesAsset = (output) =>
    !tokenId || output.value?.token_id === tokenId

  const toOthers = outputs.filter(
    (output) => matchesAsset(output) && !isOwn(getAddressOf(output)),
  )
  if (toOthers.length > 0) return { outputs: toOthers, toSelf: false }

  return {
    outputs: outputs.filter(
      (output) => matchesAsset(output) && isReceiving(getAddressOf(output)),
    ),
    toSelf: true,
  }
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
  const { tokenMap, allNetworkTokensData } = useContext(MintlayerContext)
  const { networkType } = useContext(SettingsContext)
  const [showDetails, setShowDetails] = useState(false)

  const inputs = jsonRepresentation?.inputs || []
  const outputs = jsonRepresentation?.outputs || []

  const coinTicker = networkType === 'testnet' ? 'TML' : 'ML'
  const fromAddress = findOwnInputAddress(inputs, ownAddresses)
  const { outputs: relevantOutputs, toSelf: targetsOwnWallet } =
    findRelevantOutputs(inputs, outputs, ownAddresses)
  const toAddress = getAddressOf(relevantOutputs[0])
  const toSelf = targetsOwnWallet && Boolean(toAddress)

  const tokenDecimalsById = new Map(
    (allNetworkTokensData || []).map((token) => {
      const decimals = parseInt(token.number_of_decimals, 10)
      return [token.token_id, Number.isFinite(decimals) ? decimals : null]
    }),
  )

  // Every approved output is being paid, so sum them per asset instead of
  // reporting only the first one.
  const amountRows = (() => {
    const totals = new Map()
    relevantOutputs.forEach((relevantOutput) => {
      const value = relevantOutput?.value || relevantOutput?.amount
      const tokenId = value?.token_id || relevantOutput?.token_id
      const amount =
        value?.amount?.decimal ?? relevantOutput?.amount?.decimal ?? null
      if (amount == null) return

      const key = tokenId || 'Coin'
      const ticker = tokenId
        ? tokenMap?.[tokenId] || truncate(tokenId, 8, 6)
        : coinTicker
      const decimals = tokenId ? tokenDecimalsById.get(tokenId) : COIN_DECIMALS

      let parsed
      try {
        parsed = new Amount(amount)
      } catch {
        parsed = null
      }
      const entry = totals.get(key) || { ticker, decimals, total: null }
      if (parsed) {
        entry.total = (entry.total || new Amount(0)).plus(parsed)
      }
      totals.set(key, entry)
    })

    return [...totals.entries()].map(([key, { ticker, decimals, total }]) => ({
      key,
      ticker,
      amount:
        total === null
          ? 'Unknown amount'
          : trimTrailingZeros(
              decimals != null ? total.toFixed(decimals) : total.toFixed(),
            ),
    }))
  })()

  // SECURITY: never trust the dApp-supplied `fee` field for display. The
  // miner fee is what the encoded transaction actually pays: coin inputs
  // minus coin outputs (token values are not coin; account-command inputs
  // carry no coin value). Fall back to the declared fee only when either
  // side is not coin-computable (e.g. pure account-command transactions).
  const coinDecimal = (value) =>
    value?.type === 'Coin'
      ? (value?.amount?.decimal ?? value?.decimal ?? null)
      : null
  // A malformed dApp-supplied decimal must never crash the approval UI:
  // any parse failure falls back to the declared fee (never partial sums).
  const sumCoinSide = (items) => {
    let acc = new Amount(0)
    for (const item of items) {
      const decimal = coinDecimal(item?.utxo?.value ?? item?.value)
      if (decimal == null) continue
      try {
        acc = acc.plus(new Amount(decimal))
      } catch {
        return null // unparseable: refuse to compute from partial data
      }
    }
    return acc
  }
  let computedFee = null
  try {
    const inputsCoinSum = sumCoinSide(inputs)
    const outputsCoinSum = sumCoinSide(outputs)
    if (
      inputsCoinSum != null &&
      outputsCoinSum != null &&
      inputsCoinSum.gt(0)
    ) {
      computedFee = inputsCoinSum.minus(outputsCoinSum)
    }
  } catch {
    computedFee = null
  }
  const declaredFee = jsonRepresentation?.fee?.decimal ?? null
  const fee =
    computedFee != null && computedFee.gt(0)
      ? trimTrailingZeros(computedFee.toFixed(COIN_DECIMALS))
      : declaredFee

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
            toSelf ? 'To (your address)' : 'To',
            <span
              key="to"
              className={styles.valueLine}
            >
              {truncate(toAddress, 10, 8)}
              {toAddress && <CopyButton content={toAddress} />}
            </span>,
          ],
          ...amountRows.map(({ key, ticker, amount }) => [
            'Amount',
            <span
              key={`amount-${key}`}
              className={styles.amount}
            >
              {amount} {ticker}
            </span>,
          ]),
          ...(fee != null
            ? [
                [
                  'Network fee',
                  <span
                    key="fee"
                    className={styles.amount}
                  >
                    {fee} {coinTicker}
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
          {/* SECURITY: the wallet signs these bytes — show them IN FULL.
              Truncation here would be blind signature by UI. */}
          <span
            className={`${styles.intentValue} ${styles.intentValueFull}`}
            data-testid="intent-raw"
          >
            {intent}
          </span>
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
