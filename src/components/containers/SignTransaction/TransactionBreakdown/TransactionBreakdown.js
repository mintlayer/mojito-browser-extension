import { useContext } from 'react'

import { MintlayerContext } from '@Contexts'
import { TransactionAmounts } from '@Helpers'

import styles from './TransactionBreakdown.module.css'

const {
  COIN_DECIMALS,
  atomsToDecimalString,
  buildTokenDecimalsIndex,
  resolveAssetDecimals,
  signerAmountContainer,
  signerAmountScale,
  signerAmountTokenId,
  verifyAmountPair,
} = TransactionAmounts

const COIN_KEY = 'Coin'

const shortenId = (id) =>
  id && id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id

const MAX_FIELD_DEPTH = 2
const MAX_FIELD_LENGTH = 80
const MAX_SERIALIZED_LENGTH = 400

const shortenData = (data) =>
  data && data.length > MAX_FIELD_LENGTH
    ? `${data.slice(0, MAX_FIELD_LENGTH)}…`
    : data

// dApp-supplied data can be deeply nested or cyclic; never trust it with a
// bare stringify.
const boundedStringify = (value) => {
  try {
    const text = JSON.stringify(value) ?? 'null'
    return text.length > MAX_SERIALIZED_LENGTH
      ? `${text.slice(0, MAX_SERIALIZED_LENGTH)}…`
      : text
  } catch {
    return '[unserializable]'
  }
}

const getOwnership = (address, ownAddresses) => {
  if (!address) return null
  if (ownAddresses.receiving?.includes(address)) return 'Your address'
  if (ownAddresses.change?.includes(address)) return 'Your change address'
  return null
}

const DESCRIBED_FIELDS = [
  'type',
  'value',
  'destination',
  'amount',
  'input_type',
  'index',
  'source_id',
  'source_type',
  'command',
  'account_type',
]

const getExtraFields = (source) =>
  Object.entries(source || {}).filter(
    ([key, value]) => !DESCRIBED_FIELDS.includes(key) && value !== undefined,
  )

const LOCK_LABELS = {
  ForBlockCount: (content) => `for ${content} blocks`,
  UntilTime: (content) => `until ${content}`,
  ForSeconds: (content) => `for ${content} seconds`,
  UntilHeight: (content) => `until ${content}`,
}

const formatLock = (lock) => {
  const label = LOCK_LABELS[lock?.type]
  return label ? label(lock.content) : null
}

const FieldValue = ({ value, depth = 0 }) => {
  if (value === null) return 'null'

  // the chain encodes text fields as a hex/string pair, only the text reads
  if (value?.string !== undefined && value?.hex !== undefined) {
    return <span title={value.hex}>{shortenData(String(value.string))}</span>
  }

  if (typeof value !== 'object') {
    const text = String(value)
    return <span title={text}>{shortenData(text)}</span>
  }

  if (depth >= MAX_FIELD_DEPTH) {
    const text = shortenData(boundedStringify(value))
    return <span title={text}>{text}</span>
  }

  return (
    <span className={styles.nested}>
      {Object.entries(value).map(([key, nested]) => (
        <span
          key={key}
          className={styles.nestedLine}
        >
          <span className={styles.fieldKey}>{key}</span>
          <FieldValue
            value={nested}
            depth={depth + 1}
          />
        </span>
      ))}
    </span>
  )
}

const ExtraFields = ({ source }) => {
  const fields = getExtraFields(source)
  if (fields.length === 0) return null

  return (
    <dl className={styles.fields}>
      {fields.map(([key, value]) => {
        const lock = key === 'lock' ? formatLock(value) : null

        return (
          <div
            key={key}
            className={styles.field}
          >
            <dt className={styles.fieldKey}>{key}</dt>
            <dd className={styles.fieldValue}>
              {lock || <FieldValue value={value} />}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

// Asset label from the SAME signer-read token identity as the verified
// amount (signerAmountTokenId) — never from injected top-level token_id
// fields, which would mislabel a verified coin amount.
const assetOf = (tokenId, tokenMap, coinTicker) => {
  if (tokenId) {
    return { key: tokenId, label: tokenMap[tokenId] || shortenId(tokenId) }
  }
  return { key: COIN_KEY, label: coinTicker }
}

// SECURITY: every rendered amount is verified against the signed `.atoms`
// via the shared leg-kind-aware container resolver — DelegateStaking outputs
// and DelegationBalance/MintTokens account inputs sign `amount.atoms`,
// signed-type outputs and utxo inputs sign `value.atoms`, and everything
// else resolves to null so injected fields can never fake a row. Resolution
// is per legKind ('input' | 'output'): input legs resolve from the
// {input, utxo} wrapper on the signer's own dispatch key (input.input_type),
// outputs from output.type alone — an output's injected command/
// account_type and an account input's injected value-type can never resolve
// a container the signer does not read. Identity and scale come from the
// same signer-read fields (signerAmountTokenId / signerAmountScale). The
// dApp-supplied `.decimal` label may only be shown after it reconciles.
const verifiedAmountOf = (source, tokenDecimalsById, legKind) => {
  const container = signerAmountContainer(source, legKind)
  const tokenId = signerAmountTokenId(source, container, legKind)
  const scale = signerAmountScale(source, container, tokenDecimalsById, legKind)
  const verified = verifyAmountPair(container, scale)
  if (!verified) return null
  return { ...verified, tokenId }
}

const Entry = ({ title, verified, asset, address, ownership, source }) => (
  <li className={styles.row}>
    <div className={styles.rowMain}>
      <span className={styles.rowTitle}>
        {title}
        {ownership && (
          <>
            {' · '}
            <span className={styles.rowOwn}>{ownership}</span>
          </>
        )}
      </span>
      {address && <span className={styles.rowAddress}>{address}</span>}
      <ExtraFields source={source} />
    </div>
    {verified && (
      <span
        className={
          verified.error
            ? `${styles.rowAmount} ${styles.amountError}`
            : styles.rowAmount
        }
      >
        {verified.error ?? verified.amount}
        {verified.error && verified.amount != null
          ? ` — will sign ${verified.amount}`
          : ''}
        {` ${asset?.label ?? ''}`}
      </span>
    )}
  </li>
)

// Net change of the wallet's OWN funds per asset, aggregated from the
// verified signed atoms. Any owned amount that fails verification marks the
// whole hero unverified — a fail-closed note replaces the numbers.
const getBalanceChanges = ({
  inputs,
  outputs,
  ownAddresses,
  tokenMap,
  coinTicker,
  tokenDecimalsById,
}) => {
  const changes = new Map()
  let unverified = false

  const apply = (source, address, sign, legKind) => {
    if (!getOwnership(address, ownAddresses)) return
    const verified = verifiedAmountOf(source, tokenDecimalsById, legKind)
    if (!verified) return
    if (verified.error) {
      unverified = true
      return
    }
    const asset = assetOf(verified.tokenId, tokenMap, coinTicker)
    const current = changes.get(asset.key) || {
      key: asset.key,
      label: asset.label,
      atoms: 0n,
      decimals:
        asset.key === COIN_KEY
          ? COIN_DECIMALS
          : resolveAssetDecimals(asset.key, tokenDecimalsById),
    }
    current.atoms =
      sign < 0 ? current.atoms - verified.atoms : current.atoms + verified.atoms
    changes.set(asset.key, current)
  }

  inputs.forEach((input) => {
    if (input.input?.input_type !== 'UTXO') return
    apply(input, input.utxo?.destination, -1, 'input')
  })

  outputs.forEach((output) => apply(output, output.destination, 1, 'output'))

  return {
    unverified,
    changes: [...changes.values()].filter(({ atoms }) => atoms !== 0n),
  }
}

const TransactionBreakdown = ({
  JSONRepresentation,
  ownAddresses = {},
  tokenMap = {},
  coinTicker = 'ML',
}) => {
  // Guarded: the context default is undefined when rendered without a
  // provider (tests, isolated previews).
  const { allNetworkTokensData } = useContext(MintlayerContext) || {}
  const tokenDecimalsById = buildTokenDecimalsIndex(allNetworkTokensData)

  // Fail closed on malformed payloads: legs may be truthy non-arrays (the
  // background forwards dApp params unvalidated) — normalize so the row
  // reads below can never crash; reconcileApprovalAmounts blocks the payload.
  const inputs = Array.isArray(JSONRepresentation?.inputs)
    ? JSONRepresentation.inputs
    : []
  const outputs = Array.isArray(JSONRepresentation?.outputs)
    ? JSONRepresentation.outputs
    : []

  const balanceChanges = getBalanceChanges({
    inputs,
    outputs,
    ownAddresses,
    tokenMap,
    coinTicker,
    tokenDecimalsById,
  })

  return (
    <div
      className={styles.breakdown}
      data-testid="transaction-breakdown"
    >
      <section className={styles.hero}>
        <span className={styles.heroLabel}>Balance change</span>
        {balanceChanges.unverified ? (
          <p className={styles.heroEmpty}>
            Some owned amounts could not be verified against the signed
            transaction data.
          </p>
        ) : balanceChanges.changes.length > 0 ? (
          <>
            <ul className={styles.heroList}>
              {balanceChanges.changes.map(({ key, label, atoms, decimals }) => (
                <li
                  // keyed by the grouped asset key/token id — tickers can
                  // collide across tokens, labels cannot be trusted as keys
                  key={key}
                  className={atoms < 0n ? styles.negative : styles.positive}
                  data-testid="balance-change"
                >
                  {atoms < 0n ? '−' : '+'}
                  {atomsToDecimalString(
                    atoms < 0n ? -atoms : atoms,
                    decimals ?? 0,
                  )}{' '}
                  {label}
                </li>
              ))}
            </ul>
            <span className={styles.heroNote}>
              The network fee is part of this amount
            </span>
          </>
        ) : (
          <p className={styles.heroEmpty}>
            This transaction does not move funds held by this wallet.
          </p>
        )}
      </section>

      <section className={styles.group}>
        <h4 className={styles.groupHead}>Inputs ({inputs.length})</h4>
        <ul className={styles.rows}>
          {inputs.map((input, index) => {
            const isUtxo = input.input?.input_type === 'UTXO'

            const source = isUtxo ? input.utxo : input.input
            const address = isUtxo
              ? input.utxo?.destination
              : input.input?.destination
            const title = isUtxo
              ? input.utxo?.type || 'UTXO'
              : input.input?.command ||
                input.input?.account_type ||
                input.input?.input_type
            const verified = verifiedAmountOf(input, tokenDecimalsById, 'input')

            return (
              <Entry
                key={`${input.input?.source_id || 'input'}-${index}`}
                title={title}
                verified={verified}
                asset={
                  verified
                    ? assetOf(verified.tokenId, tokenMap, coinTicker)
                    : null
                }
                address={address}
                ownership={getOwnership(address, ownAddresses)}
                source={source}
              />
            )
          })}
        </ul>
      </section>

      <section className={styles.group}>
        <h4 className={styles.groupHead}>Outputs ({outputs.length})</h4>
        <ul className={styles.rows}>
          {outputs.map((output, index) => {
            const verified = verifiedAmountOf(
              output,
              tokenDecimalsById,
              'output',
            )

            return (
              <Entry
                key={`${output.type}-${index}`}
                title={output.type}
                verified={verified}
                asset={
                  verified
                    ? assetOf(verified.tokenId, tokenMap, coinTicker)
                    : null
                }
                address={output.destination}
                ownership={getOwnership(output.destination, ownAddresses)}
                source={output}
              />
            )
          })}
        </ul>
      </section>
    </div>
  )
}

export { boundedStringify }

export default TransactionBreakdown
