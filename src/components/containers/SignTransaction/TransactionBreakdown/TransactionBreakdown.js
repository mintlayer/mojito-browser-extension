import { useContext } from 'react'

import { MintlayerContext } from '@Contexts'
import { TransactionAmounts } from '@Helpers'

import styles from './TransactionBreakdown.module.css'

const {
  COIN_DECIMALS,
  atomsToDecimalString,
  buildTokenDecimalsIndex,
  describeOutputLock,
  isLockedSelfOutput,
  resolveAssetDecimals,
  signerAmountContainer,
  signerAmountScale,
  signerAmountTokenId,
  signerOutputDestination,
  signerFillOrderDestination,
  signerUtxoOwnerAddress,
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

// The `lock` field of a LockThenTransfer leg, in the same plain words the
// approval summary uses (shared describeOutputLock) — a lock the signer
// could not encode is named as such instead of being dumped as JSON.
const lockFieldText = (source) => {
  if (source?.type !== 'LockThenTransfer') return null
  const lock = describeOutputLock(source.lock)
  return lock.text ?? lock.error
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
        const lock = key === 'lock' ? lockFieldText(source) : null

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
// Locked outputs coming back to this wallet are part of that change (the
// funds stay the wallet's) and are also listed on their own, with the same
// verified amount and the same lock words as the summary, so the figure is
// never read as freely spendable money.
const getBalanceChanges = ({
  inputs,
  outputs,
  ownAddresses,
  tokenMap,
  coinTicker,
  tokenDecimalsById,
}) => {
  const changes = new Map()
  const lockedReturns = []
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

  // An input counts towards this wallet's balance only when the spent utxo
  // is the wallet's own (signerUtxoOwnerAddress): the key of its
  // destination, or for an Htlc utxo — which carries none — its spend or
  // refund key. A utxo injected on an account-command leg encodes no input
  // and is never consulted here.
  inputs.forEach((input) => {
    if (input.input?.input_type !== 'UTXO') return
    apply(input, signerUtxoOwnerAddress(input.utxo, ownAddresses), -1, 'input')
  })

  // An output counts towards this wallet's balance only when the signer
  // encodes one of its addresses as the destination (signerOutputDestination)
  // — an Htlc, staking or burn output leaves the wallet whatever address the
  // payload attaches to it.
  outputs.forEach((output) =>
    apply(output, signerOutputDestination(output), 1, 'output'),
  )

  // The locked ones among them: an unreadable amount is left to the
  // fail-closed hero and the row's own error; an unreadable lock is still
  // named, since the transaction cannot be signed for it.
  outputs.forEach((output) => {
    if (!isLockedSelfOutput(output, ownAddresses)) return
    const verified = verifiedAmountOf(output, tokenDecimalsById, 'output')
    if (!verified || verified.error) return
    lockedReturns.push({
      amount: verified.amount,
      label: assetOf(verified.tokenId, tokenMap, coinTicker).label,
      lockText: describeOutputLock(output.lock).text ?? null,
    })
  })

  return {
    unverified,
    changes: [...changes.values()].filter(({ atoms }) => atoms !== 0n),
    lockedReturns,
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
        {!balanceChanges.unverified &&
          balanceChanges.lockedReturns.map(
            ({ amount, label, lockText }, index) => (
              <p
                // keyed by position: locked returns carry no id of their own
                key={`locked-return-${index}`}
                className={styles.heroNote}
                data-testid="locked-return"
              >
                {lockText
                  ? `${amount} ${label} come back to this wallet locked (${lockText}) — not spendable until then.`
                  : 'Funds come back to this wallet with a lock that cannot be read — this transaction cannot be signed.'}
              </p>
            ),
          )}
      </section>

      <section className={styles.group}>
        <h4 className={styles.groupHead}>Inputs ({inputs.length})</h4>
        <ul className={styles.rows}>
          {inputs.map((input, index) => {
            const isUtxo = input.input?.input_type === 'UTXO'

            const source = isUtxo ? input.utxo : input.input
            // the address shown is the one the signer ties the leg to, and
            // what it is differs per row — a source is never presented as a
            // destination, nor the reverse. A utxo row shows where this
            // input's funds live: the destination of the spent outpoint, or
            // for an Htlc-typed utxo the wallet's spend/refund key that
            // spends it. An account command other than a fill shows a
            // signing key and never a destination: its `destination` is the
            // last fallback of the signer's key resolution
            // (`utxo.destination || input.authority || input.destination`, or
            // `outputs[0].destination` when the first input is a
            // DelegationBalance withdrawal). A fill row shows the
            // `destination` the signer encodes in the fill — where the
            // acquired asset lands, a string only — on the fill's own row,
            // so several fills are each seen for where they go.
            const isFillOrder = !isUtxo && input.input?.command === 'FillOrder'
            const address = isUtxo
              ? input.utxo?.type === 'Htlc'
                ? signerUtxoOwnerAddress(input.utxo, ownAddresses)
                : input.utxo?.destination
              : isFillOrder
                ? signerFillOrderDestination(input)
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
            // the address shown is the one the signer encodes for the
            // output — never a `destination`/`address` its type ignores
            const destination = signerOutputDestination(output)

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
                address={destination}
                ownership={getOwnership(destination, ownAddresses)}
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
