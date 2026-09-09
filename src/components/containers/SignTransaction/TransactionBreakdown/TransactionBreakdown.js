import Decimal from 'decimal.js'

import styles from './TransactionBreakdown.module.css'

const COIN_KEY = 'Coin'
const COIN_DECIMALS = 11

// keeps room for the largest balances and never falls back to exponents
const Amount = Decimal.clone({ precision: 40, toExpNeg: -30, toExpPos: 30 })

const formatTotal = (total, isCoin) =>
  (isCoin ? total.toDecimalPlaces(COIN_DECIMALS) : total).toFixed()

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

const getAmount = (source) =>
  source?.value?.amount?.decimal ??
  source?.amount?.decimal ??
  (typeof source?.amount === 'string' ? source.amount : null)

const getAsset = (source, tokenMap, coinTicker) => {
  const value = source?.value || source
  if (value?.type === 'Coin') {
    return { key: COIN_KEY, label: coinTicker }
  }

  const tokenId = value?.token_id || source?.token_id
  if (tokenId) {
    return { key: tokenId, label: tokenMap[tokenId] || shortenId(tokenId) }
  }

  // account inputs carry a bare amount, and those are always coins
  return getAmount(source) ? { key: COIN_KEY, label: coinTicker } : null
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
  UntilHeight: (content) => `until block ${content}`,
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

const Entry = ({ title, amount, asset, address, ownership, source }) => (
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
    {amount && (
      <span className={styles.rowAmount}>
        {amount} {asset?.label}
      </span>
    )}
  </li>
)

const getBalanceChanges = ({
  inputs,
  outputs,
  ownAddresses,
  tokenMap,
  coinTicker,
}) => {
  const changes = new Map()

  const apply = (source, address, sign) => {
    if (!getOwnership(address, ownAddresses)) return
    const asset = getAsset(source, tokenMap, coinTicker)
    const amount = getAmount(source)
    if (!asset || !amount) return

    const current = changes.get(asset.key) || {
      key: asset.key,
      label: asset.label,
      total: new Amount(0),
    }
    current.total = current.total.plus(new Amount(amount).times(sign))
    changes.set(asset.key, current)
  }

  inputs.forEach((input) => {
    if (input.input?.input_type !== 'UTXO') return
    apply(input.utxo, input.utxo?.destination, -1)
  })

  outputs.forEach((output) => apply(output, output.destination, 1))

  return [...changes.values()].filter(({ total }) => !total.isZero())
}

const TransactionBreakdown = ({
  JSONRepresentation,
  ownAddresses = {},
  tokenMap = {},
  coinTicker = 'ML',
}) => {
  const inputs = JSONRepresentation?.inputs || []
  const outputs = JSONRepresentation?.outputs || []

  const balanceChanges = getBalanceChanges({
    inputs,
    outputs,
    ownAddresses,
    tokenMap,
    coinTicker,
  })

  return (
    <div
      className={styles.breakdown}
      data-testid="transaction-breakdown"
    >
      <section className={styles.hero}>
        <span className={styles.heroLabel}>Balance change</span>
        {balanceChanges.length > 0 ? (
          <>
            <ul className={styles.heroList}>
              {balanceChanges.map(({ key, label, total }) => (
                <li
                  key={label}
                  className={
                    total.isNegative() ? styles.negative : styles.positive
                  }
                  data-testid="balance-change"
                >
                  {total.isNegative() ? '−' : '+'}
                  {formatTotal(total.abs(), key === COIN_KEY)} {label}
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

            return (
              <Entry
                key={`${input.input?.source_id || 'input'}-${index}`}
                title={title}
                amount={getAmount(source)}
                asset={getAsset(source, tokenMap, coinTicker)}
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
          {outputs.map((output, index) => (
            <Entry
              key={`${output.type}-${index}`}
              title={output.type}
              amount={getAmount(output)}
              asset={getAsset(output, tokenMap, coinTicker)}
              address={output.destination}
              ownership={getOwnership(output.destination, ownAddresses)}
              source={output}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

export default TransactionBreakdown
