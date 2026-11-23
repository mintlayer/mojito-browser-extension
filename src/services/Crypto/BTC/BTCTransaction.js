import * as bitcoin from 'bitcoinjs-lib'
import coinSelect from 'coinselect'
import { AppInfo } from '@Constants'

import { Electrum } from '@APIs'
import ECPairFactory from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { witnessStackToScriptWitness } from 'bitcoinjs-lib/src/psbt/psbtutils'
import { BTC } from '@Helpers'

// ── bitcoinjs boundary normalization ──────────────────────────────────────
// This bitcoinjs build validates every byte input with an exact
// Uint8Array check and the Buffer polyfill FAILS it (production throws,
// not just tests). Never hand bitcoinjs a Buffer: convert at the
// boundary. Outputs come back as plain Uint8Array — convert to Buffer
// only for hex/serialization where Buffer semantics are needed.
const toU8 = (bytes) => new Uint8Array(bytes)
const u8FromHex = (hex) => new Uint8Array(Buffer.from(hex, 'hex'))
const toBuffer = (bytes) => Buffer.from(bytes)
// Realm-safe: `instanceof Uint8Array` fails across vm/realms (jest jsdom),
// ArrayBuffer.isView does not.
const isBytes = (bytes) => ArrayBuffer.isView(bytes)
// A hex string of whole bytes.
const isHexBytes = (hex) =>
  typeof hex === 'string' && /^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0
// A 64-hex-character transaction id.
const isTxid = (txid) =>
  typeof txid === 'string' && /^[0-9a-fA-F]{64}$/.test(txid)

const getMasterFingerprint = (node) => {
  if (isBytes(node?.fingerprint)) return toBuffer(node.fingerprint)
  if (node?.fingerprint && Number.isInteger(node.fingerprint)) {
    const b = Buffer.alloc(4)
    b.writeUInt32BE(node.fingerprint >>> 0, 0)
    return b
  }
  // This bitcoinjs build normalizes to plain Uint8Array — hash160 accepts it.
  const h160 = bitcoin.crypto.hash160(toU8(node.publicKey))
  return Buffer.from(h160.subarray(0, 4))
}

class InsufficientFundsError extends Error {
  constructor(message = 'Insufficient funds to cover the transaction') {
    super(message)
    this.name = 'InsufficientFundsError'
  }
}

class FeeTooHighError extends Error {
  constructor(fee) {
    super(`Transaction fee is too high: ${fee}`)
    this.name = 'FeeTooHighError'
  }
}

// Fixed miner fee for HTLC claim transactions (satoshis). The claim pays
// from the HTLC output itself, so the fee comes off the claimed value.
const HTLC_CLAIM_FEE_SATOSHIS = 500

// Fixed miner fee for HTLC refund transactions (satoshis). The refund pays
// from the HTLC output after the timelock, so the fee comes off the refund.
const HTLC_REFUND_FEE_SATOSHIS = 1000

// Bitcoin consensus MAX_MONEY (21M BTC): no larger utxo value can exist
// on-chain, so out-of-range values are malformed input, not signable amounts.
const BTC_MAX_MONEY_SATOSHIS = 2100000000000000n

// bitcoinjs v7 (bip174) mandates BigInt PSBT input/output values. HTLC utxo
// values arrive as JSON over the bridge, so they are exact only as digit
// strings or BigInts — a Number >= 2^53 is rounded before this code runs,
// which is why lossy Numbers are rejected rather than signed with a wrong
// amount. The MAX_MONEY bound catches otherwise-unbounded strings here
// instead of letting them fail cryptically later.
const toSatoshiBigInt = (value) => {
  let satoshis = null
  if (typeof value === 'bigint') {
    satoshis = value
  } else if (typeof value === 'number' && Number.isSafeInteger(value)) {
    satoshis = BigInt(value)
  } else if (typeof value === 'string' && /^[0-9]+$/.test(value)) {
    satoshis = BigInt(value)
  }
  if (
    satoshis === null ||
    satoshis <= 0n ||
    satoshis > BTC_MAX_MONEY_SATOSHIS
  ) {
    throw new Error('Invalid UTXO: value must be a positive integer')
  }
  return satoshis
}

// Fee estimation only needs txId/vout/value (plus the witness script for
// nativeSegwit); the full raw preimage is only fetched in getFormattedUtxos
// for signing, so estimation does not do one network round-trip per UTXO.
const getFormattedFeeUtxos = async (walletUtxo, walletType) => {
  const results = []

  for (const utxo of walletUtxo) {
    const formatted = {
      txId: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
    }

    if (walletType === 'nativeSegwit') {
      const scriptBuf = bitcoin.address.toOutputScript(
        utxo.address,
        BTC.getNetwork(),
      )
      formatted.witnessUtxo = {
        script: new Uint8Array(scriptBuf),
        value: BigInt(utxo.value),
      }
    } else if (walletType !== 'legacy' && walletType !== 'p2sh') {
      throw new Error(`Unknown wallet type: ${walletType}`)
    }

    results.push(formatted)
  }

  return results
}

const getFormattedUtxos = async (
  walletUtxo,
  walletType,
  addressesData,
  hdWallet,
) => {
  const results = []

  const allAddresses = [
    ...addressesData.btcReceivingAddresses,
    ...addressesData.btcChangeAddresses,
  ]

  for (const utxo of walletUtxo) {
    const addrData = allAddresses.find((a) => a.address === utxo.address)
    if (!addrData) {
      throw new Error(
        `UTXO address ${utxo.address} not derived from this wallet`,
      )
    }
    const pubkey = isBytes(addrData.pubkey)
      ? toBuffer(addrData.pubkey)
      : Buffer.from(addrData.pubkey, 'hex')
    const bip32Derivation = [
      {
        masterFingerprint: toU8(getMasterFingerprint(hdWallet)),
        path: addrData.derivationPath,
        pubkey: toU8(pubkey),
      },
    ]
    const formatted = {
      txId: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      bip32Derivation: bip32Derivation,
    }

    if (walletType === 'legacy' || walletType === 'p2sh') {
      const rawTxHex = await Electrum.getTransactionHex(utxo.txid)
      formatted.nonWitnessUtxo = u8FromHex(rawTxHex)
    } else if (walletType === 'nativeSegwit') {
      const scriptBuf = bitcoin.address.toOutputScript(
        utxo.address,
        BTC.getNetwork(),
      )
      formatted.witnessUtxo = {
        script: new Uint8Array(scriptBuf),
        value: BigInt(utxo.value),
      }
    } else {
      throw new Error(`Unknown wallet type: ${walletType}`)
    }

    results.push(formatted)
  }

  return results
}

// A lock count as the script encodes it: a minimal integer push (this
// wallet's own compiler) or OP_1…OP_16 (other compilers). null otherwise.
const decodeLockBlockCount = (lockChunk) => {
  const opcodes = bitcoin.opcodes
  if (typeof lockChunk === 'number') {
    return lockChunk >= opcodes.OP_1 && lockChunk <= opcodes.OP_16
      ? lockChunk - opcodes.OP_RESERVED // OP_0 = 0x00
      : null
  }
  if (isBytes(lockChunk)) {
    const count = bitcoin.script.number.decode(toBuffer(lockChunk))
    return Number.isInteger(count) && count >= 0 ? count : null
  }
  return null
}

/**
 * Reads the HTLC redeem script shape this wallet builds and nothing else:
 *   OP_IF OP_HASH160 <20-byte hash> OP_EQUALVERIFY <spend pubkey> OP_ELSE
 *   <lock blocks> OP_CHECKSEQUENCEVERIFY OP_DROP <refund pubkey> OP_ENDIF
 *   OP_CHECKSIG
 * The spend branch pays <spend pubkey> against the hash; the refund branch
 * pays <refund pubkey> after the lock.
 *
 * Returns { secretHashHex, spendPubkeyHex, refundPubkeyHex, lockBlockCount }
 * or null for anything that is not exactly this shape.
 */
const parseHtlcRedeemScript = (redeemScriptHex) => {
  try {
    if (!isHexBytes(redeemScriptHex)) return null
    const chunks = bitcoin.script.decompile(u8FromHex(redeemScriptHex))
    if (!chunks || chunks.length !== 12) return null
    const [
      opIf,
      opHash160,
      secretHash,
      opEqualVerify,
      spendPubkey,
      opElse,
      lockChunk,
      opCsv,
      opDrop,
      refundPubkey,
      opEndIf,
      opCheckSig,
    ] = chunks
    const opcodes = bitcoin.opcodes
    if (
      opIf !== opcodes.OP_IF ||
      opHash160 !== opcodes.OP_HASH160 ||
      opEqualVerify !== opcodes.OP_EQUALVERIFY ||
      opElse !== opcodes.OP_ELSE ||
      opCsv !== opcodes.OP_CHECKSEQUENCEVERIFY ||
      opDrop !== opcodes.OP_DROP ||
      opEndIf !== opcodes.OP_ENDIF ||
      opCheckSig !== opcodes.OP_CHECKSIG
    ) {
      return null
    }
    if (!isBytes(secretHash) || secretHash.length !== 20) return null
    const isCompressedPubkey = (chunk) =>
      isBytes(chunk) && (chunk.length === 33 || chunk.length === 32)
    if (!isCompressedPubkey(spendPubkey) || !isCompressedPubkey(refundPubkey)) {
      return null
    }
    const lockBlockCount = decodeLockBlockCount(lockChunk)
    if (lockBlockCount === null) return null
    return {
      secretHashHex: toBuffer(secretHash).toString('hex'),
      spendPubkeyHex: toBuffer(spendPubkey).toString('hex'),
      refundPubkeyHex: toBuffer(refundPubkey).toString('hex'),
      lockBlockCount,
    }
  } catch {
    // Malformed script/hex: not an HTLC of this wallet's shape.
    return null
  }
}

/**
 * Finds the wallet key that ONE branch of an HTLC redeem script binds, so
 * a claim is signed with the spend-branch key and a refund with the
 * refund-branch key — never with a wallet key that only sits on the other
 * branch.
 *
 * `branch` is 'spend' or 'refund'. The branch's pubkey is matched against
 * the wallet's derived addresses. Prefers the WIF stored on the address
 * entry, falls back to re-deriving the child node from the HD root via the
 * entry's derivation path.
 *
 * Returns { wif, address, derivationPath } or null when the branch binds
 * no key from this wallet — callers must treat null as reject-signing.
 */
const findWalletKeyForRedeemScript = ({
  redeemScriptHex,
  btcAddressData,
  btcHDWallet,
  branch,
}) => {
  try {
    const htlc = parseHtlcRedeemScript(redeemScriptHex)
    const branchPubkeyHex =
      branch === 'spend'
        ? htlc?.spendPubkeyHex
        : branch === 'refund'
          ? htlc?.refundPubkeyHex
          : null
    if (!branchPubkeyHex) return null

    const entries = [
      ...(btcAddressData?.btcReceivingAddresses ?? []),
      ...(btcAddressData?.btcChangeAddresses ?? []),
    ]
    const toPubkeyHex = (entry) => {
      if (isBytes(entry?.pubkey)) return toBuffer(entry.pubkey).toString('hex')
      return typeof entry?.pubkey === 'string' ? entry.pubkey : ''
    }

    const match = entries.find(
      (entry) => toPubkeyHex(entry) === branchPubkeyHex,
    )
    if (match) {
      if (match.privateKey) {
        return {
          wif: match.privateKey,
          address: match.address,
          derivationPath: match.derivationPath,
        }
      }
      if (btcHDWallet && match.derivationPath) {
        const child = btcHDWallet.derivePath(match.derivationPath)
        return {
          wif: child.toWIF(),
          address: match.address,
          derivationPath: match.derivationPath,
        }
      }
      return null
    }

    // No entry matched by stored pubkey: re-derive every known path and
    // compare the derived pubkeys (covers store blobs without pubkeys).
    const derivableEntries = btcHDWallet
      ? entries.filter((entry) => entry?.derivationPath)
      : []
    for (const entry of derivableEntries) {
      const child = btcHDWallet.derivePath(entry.derivationPath)
      if (toBuffer(child.publicKey).toString('hex') === branchPubkeyHex) {
        return {
          wif: child.toWIF(),
          address: entry.address,
          derivationPath: entry.derivationPath,
        }
      }
    }

    return null
  } catch {
    // Malformed script/hex: not signable by us.
    return null
  }
}

// Refusal for an HTLC outpoint that is not verified against the chain.
// Carries no secret: it is thrown before any secret is fetched.
const unverifiedOutpoint = (message) =>
  Object.assign(new Error(message), { code: 'HTLC_OUTPOINT_UNVERIFIED' })

// Satoshis as BigInt from an on-chain output value, or null when unreadable.
const chainSatoshis = (raw) => {
  if (typeof raw === 'number' && Number.isSafeInteger(raw)) return BigInt(raw)
  if (typeof raw === 'string' && /^[0-9]+$/.test(raw)) return BigInt(raw)
  return null
}

/**
 * Confirms against the chain that the output a claim or refund spends is
 * the HTLC output the request describes and is still there to spend: the
 * transaction utxo.txid is CONFIRMED (an explicit status.confirmed true —
 * a missing status is not confirmation), has an output at utxo.vout locked
 * to p2wsh(redeemScript) worth utxo.value, and that output is UNSPENT
 * (the outspend answer says spent === false).
 *
 * Returns { txid, vout, value, scriptPubKeyHex } for the verified output.
 * Fail closed: a lookup that cannot be completed, and any disagreement
 * with the request, throws (code HTLC_OUTPOINT_UNVERIFIED) — nothing is
 * ever signed from an unverified, unconfirmed or spent outpoint.
 */
const verifyHtlcOutpoint = async ({
  networkType = 'testnet',
  utxo,
  redeemScriptHex,
}) => {
  if (!isTxid(utxo?.txid)) {
    throw unverifiedOutpoint('Invalid UTXO: txid must be a 64-character hex id')
  }
  if (!Number.isInteger(utxo.vout) || utxo.vout < 0) {
    throw unverifiedOutpoint(
      'Invalid UTXO: vout must be a non-negative integer',
    )
  }
  const utxoValueSat = toSatoshiBigInt(utxo.value)
  if (!isHexBytes(redeemScriptHex)) {
    throw unverifiedOutpoint(
      'Invalid redeemScriptHex: must be a valid hex string',
    )
  }
  const network = bitcoin.networks[networkType]
  const scriptPubKeyHex = Buffer.from(
    bitcoin.payments.p2wsh({
      redeem: { output: u8FromHex(redeemScriptHex) },
      network,
    }).output,
  ).toString('hex')

  let transaction
  try {
    transaction = JSON.parse(await Electrum.getTransactionData(utxo.txid))
  } catch {
    throw unverifiedOutpoint(
      'The HTLC output could not be looked up on chain. Check your connection and try again.',
    )
  }
  if (!transaction || typeof transaction !== 'object') {
    throw unverifiedOutpoint(
      'The transaction holding the HTLC output could not be read from the chain.',
    )
  }
  if (
    !isTxid(transaction.txid) ||
    transaction.txid.toLowerCase() !== utxo.txid.toLowerCase()
  ) {
    throw unverifiedOutpoint(
      'The chain returned a different transaction than the one being spent.',
    )
  }
  // Only a confirmed funding transaction is accepted: one still in the
  // mempool can be replaced or double-spent after the claim is signed.
  if (transaction.status?.confirmed !== true) {
    throw unverifiedOutpoint(
      'The transaction holding the HTLC output is not confirmed on chain yet.',
    )
  }
  const output = Array.isArray(transaction.vout)
    ? transaction.vout[utxo.vout]
    : undefined
  if (!output || typeof output !== 'object') {
    throw unverifiedOutpoint('The output being spent does not exist on chain.')
  }
  if (
    typeof output.scriptpubkey !== 'string' ||
    output.scriptpubkey.toLowerCase() !== scriptPubKeyHex
  ) {
    throw unverifiedOutpoint(
      'The output being spent is not locked to this HTLC script on chain.',
    )
  }
  const chainValueSat = chainSatoshis(output.value)
  if (chainValueSat === null || chainValueSat !== utxoValueSat) {
    throw unverifiedOutpoint(
      'The output being spent holds a different amount on chain than the request states.',
    )
  }

  let outspend
  try {
    outspend = JSON.parse(await Electrum.getOutspend(utxo.txid, utxo.vout))
  } catch {
    // The transaction itself was read above; only the spend-status lookup
    // failed (no answer from the chain for that route).
    throw unverifiedOutpoint(
      'The spend status of the HTLC output could not be looked up on chain.',
    )
  }
  if (
    !outspend ||
    typeof outspend !== 'object' ||
    typeof outspend.spent !== 'boolean'
  ) {
    throw unverifiedOutpoint(
      'The spend status of the HTLC output could not be read from the chain.',
    )
  }
  if (outspend.spent) {
    throw unverifiedOutpoint('The HTLC output has already been spent on chain.')
  }
  return {
    txid: utxo.txid.toLowerCase(),
    vout: utxo.vout,
    value: utxoValueSat,
    scriptPubKeyHex,
  }
}

const calculateBtcTransactionFee = async ({
  to,
  amount,
  utxos,
  feeRate,
  walletType,
}) => {
  const targets = [
    {
      address: to,
      value: amount,
    },
  ]
  const formatedUtxos = await getFormattedFeeUtxos(utxos, walletType)
  const { fee } = coinSelect(formatedUtxos, targets, feeRate)
  return fee
}

const buildTransaction = async ({
  to,
  amount,
  utxos,
  feeRate,
  walletType,
  changeAddress,
  root,
}) => {
  const targets = [
    {
      address: to,
      value: amount,
    },
  ]

  const formatedUtxos = await getFormattedUtxos(
    utxos,
    walletType,
    root.btcAddressData,
    root.btcHDWallet,
  )
  const { inputs, outputs, fee } = coinSelect(formatedUtxos, targets, feeRate)
  if (!inputs || !outputs) {
    throw new InsufficientFundsError()
  }

  const transactionBuilder = new bitcoin.Psbt({
    network: BTC.getNetwork(),
  })

  inputs.forEach((input) => {
    const psbtInput = {
      hash: input.txId || input.txid,
      index: input.vout,
      bip32Derivation: input.bip32Derivation?.map((d) => ({
        ...d,
        masterFingerprint: toU8(d.masterFingerprint),
        pubkey: toU8(d.pubkey),
      })),
    }

    if (input.nonWitnessUtxo) {
      psbtInput.nonWitnessUtxo = toU8(input.nonWitnessUtxo)
    } else if (input.witnessUtxo) {
      psbtInput.witnessUtxo = input.witnessUtxo
    }

    transactionBuilder.addInput(psbtInput)
  })

  outputs.forEach((output) => {
    if (!output.address) {
      output.address = changeAddress
    }

    transactionBuilder.addOutput({
      address: output.address,
      value: BigInt(output.value),
    })
  })

  transactionBuilder.signAllInputsHD(root.btcHDWallet)
  transactionBuilder.finalizeAllInputs()

  const feeValidity = BTC.checkFee(
    transactionBuilder,
    fee,
    AppInfo.BTC_MAX_TRANSACTION_FEE,
    AppInfo.BTC_MAX_FEERATE,
  )

  if (!feeValidity) {
    throw new FeeTooHighError(fee)
  }

  return [
    transactionBuilder.extractTransaction(),
    transactionBuilder.extractTransaction().toHex(),
  ]
}

const buildHTLCAndFundingAddress = async (input) => {
  const {
    receiverPubKey,
    senderPubKey,
    secretHashHex,
    lock: lockBlockCount,
    networkType = 'testnet',
  } = input

  const network = bitcoin.networks[networkType]

  const redeemScript = toBuffer(
    bitcoin.script.compile([
      bitcoin.opcodes.OP_IF,
      bitcoin.opcodes.OP_HASH160,
      u8FromHex(secretHashHex),
      bitcoin.opcodes.OP_EQUALVERIFY,
      u8FromHex(receiverPubKey),
      bitcoin.opcodes.OP_ELSE,
      bitcoin.script.number.encode(parseInt(lockBlockCount)),
      bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
      bitcoin.opcodes.OP_DROP,
      u8FromHex(senderPubKey),
      bitcoin.opcodes.OP_ENDIF,
      bitcoin.opcodes.OP_CHECKSIG,
    ]),
  )

  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: redeemScript },
    network,
  })
  // payments outputs come back as plain Uint8Array in this build.
  const p2wshOutput = Buffer.from(p2wsh.output)

  return {
    redeemScript,
    redeemScriptHex: redeemScript.toString('hex'),
    redeemScriptAsm: bitcoin.script.toASM(redeemScript),
    witnessScript: redeemScript,
    p2wshOutput,
    scriptPubKeyHex: p2wshOutput.toString('hex'),
    p2wshAddress: p2wsh.address,
  }
}

const buildHtlcClaimTx = async (params) => {
  const {
    networkType = 'testnet',
    utxo,
    toAddress,
    wif,
    redeemScriptHex,
    secretHex,
  } = params

  // Same validation contract as buildHtlcRefundTx: a malformed request must
  // fail here, loudly, before any key material is used.
  if (!utxo?.txid || !Number.isInteger(utxo.vout)) {
    throw new Error('Invalid UTXO: txid or vout missing/invalid')
  }
  const utxoValueSat = toSatoshiBigInt(utxo.value)
  if (!redeemScriptHex || !/^[0-9a-fA-F]+$/.test(redeemScriptHex)) {
    throw new Error('Invalid redeemScriptHex: must be a valid hex string')
  }
  if (redeemScriptHex.length % 2 !== 0) {
    throw new Error('Invalid redeemScriptHex: must be a valid hex string')
  }
  if (!toAddress) {
    throw new Error('toAddress missing')
  }
  if (!wif) {
    throw new Error('wif missing')
  }
  if (!secretHex || !/^[0-9a-fA-F]{64}$/.test(secretHex)) {
    throw new Error('Invalid secret: must be a 64-character hex string')
  }
  if (utxoValueSat <= BigInt(HTLC_CLAIM_FEE_SATOSHIS)) {
    throw new Error('UTXO amount too low to cover fee')
  }

  const network = bitcoin.networks[networkType]

  const psbt = new bitcoin.Psbt({ network })
  const redeemScript = u8FromHex(redeemScriptHex)

  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    witnessUtxo: {
      script: bitcoin.payments.p2wsh({
        redeem: { output: redeemScript },
        network,
      }).output,
      value: utxoValueSat,
    },
    witnessScript: redeemScript,
  })

  psbt.addOutput({
    address: toAddress,
    value: utxoValueSat - BigInt(HTLC_CLAIM_FEE_SATOSHIS), // fee
  })

  const ECPair = ECPairFactory(ecc)

  const keyPair = ECPair.fromWIF(wif, bitcoin.networks[networkType])

  psbt.signInput(0, keyPair)
  psbt.finalizeInput(0, (_, input) => {
    const sig = input.partialSig[0].signature
    const witness = witnessStackToScriptWitness([
      toU8(sig),
      u8FromHex(secretHex),
      Uint8Array.of(0x01),
      toU8(redeemScript),
    ])
    return { finalScriptWitness: witness }
  })

  return psbt.extractTransaction().toHex()
}

const buildHtlcRefundTx = async (params) => {
  const {
    networkType = 'testnet',
    utxo,
    toAddress,
    wif,
    redeemScriptHex,
  } = params

  // Validate inputs
  if (!utxo?.txid || !Number.isInteger(utxo.vout)) {
    throw new Error('Invalid UTXO: txid or vout missing/invalid')
  }
  const utxoValueSat = toSatoshiBigInt(utxo.value)

  if (!redeemScriptHex || !/^[0-9a-fA-F]+$/.test(redeemScriptHex)) {
    throw new Error('Invalid redeemScriptHex: must be a valid hex string')
  }
  // Same parity contract as buildHtlcClaimTx: the Buffer polyfill's hex
  // decode silently truncates odd-length strings, so a truncated redeem
  // script would otherwise reach the PSBT and only fail at broadcast.
  if (redeemScriptHex.length % 2 !== 0) {
    throw new Error('Invalid redeemScriptHex: must be a valid hex string')
  }
  if (!toAddress || !wif) {
    throw new Error('toAddress or wif missing')
  }

  const network = bitcoin.networks[networkType]

  // Parse redeemScript (normalized to plain Uint8Array for bitcoinjs)
  let redeemScript
  try {
    redeemScript = u8FromHex(redeemScriptHex)
  } catch (e) {
    throw new Error(`Failed to parse redeemScriptHex: ${e.message}`)
  }

  // Placeholder for parseLockBlockCount (assuming it extracts relative locktime)
  const lockBlockCount = parseLockBlockCount(redeemScriptHex)
  if (!Number.isInteger(lockBlockCount)) {
    throw new Error('Invalid lockBlockCount: must be an integer')
  }

  // Create P2WSH script
  let p2wshOutput
  try {
    p2wshOutput = bitcoin.payments.p2wsh({
      redeem: { output: redeemScript, network },
      network,
    }).output
  } catch (e) {
    throw new Error(`Failed to create P2WSH output: ${e.message}`)
  }

  // Validate the output script shape (this build returns plain Uint8Array).
  if (!isBytes(p2wshOutput)) {
    throw new Error('Failed to create P2WSH output: invalid output script')
  }

  const psbt = new bitcoin.Psbt({ network })

  // Add input with witnessUtxo
  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    sequence: lockBlockCount,
    witnessUtxo: {
      script: p2wshOutput,
      value: utxoValueSat,
    },
    witnessScript: redeemScript,
  })

  // Add output
  const refundFee = BigInt(HTLC_REFUND_FEE_SATOSHIS) // Fixed fee in satoshis
  if (utxoValueSat <= refundFee) {
    throw new Error('UTXO amount too low to cover fee')
  }
  psbt.addOutput({
    address: toAddress,
    value: utxoValueSat - refundFee,
  })

  // Set version for CHECKSEQUENCEVERIFY
  psbt.setVersion(2)

  // Sign the input
  const ECPair = ECPairFactory(ecc)
  let keyPair
  try {
    keyPair = ECPair.fromWIF(wif, network)
  } catch (e) {
    throw new Error(`Invalid WIF: ${e.message}`)
  }

  try {
    psbt.signInput(0, keyPair)
  } catch (e) {
    throw new Error(`Failed to sign input: ${e.message}`)
  }

  // Finalize input with custom witness stack
  try {
    psbt.finalizeInput(0, (_, input) => {
      const sig = input.partialSig[0].signature
      const witness = witnessStackToScriptWitness([
        toU8(sig),
        new Uint8Array(0), // OP_FALSE for refund path
        toU8(redeemScript),
      ])
      return { finalScriptWitness: witness }
    })
  } catch (e) {
    throw new Error(`Failed to finalize input: ${e.message}`)
  }

  // Extract and return transaction hex
  try {
    return psbt.extractTransaction().toHex()
  } catch (e) {
    throw new Error(`Failed to extract transaction: ${e.message}`)
  }
}

const parseLockBlockCount = (redeemScriptHex) => {
  const chunks = bitcoin.script.decompile(u8FromHex(redeemScriptHex))
  if (!chunks) throw new Error('Invalid redeemScript')

  const csvIndex = chunks.findIndex(
    (op) => op === bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
  )
  if (csvIndex === -1) throw new Error('No CHECKSEQUENCEVERIFY in redeemScript')

  const lockBlockCount = decodeLockBlockCount(chunks[csvIndex - 1])
  if (lockBlockCount === null) {
    throw new Error('LockBlockCount not found before CHECKSEQUENCEVERIFY')
  }
  return lockBlockCount
}

export {
  buildTransaction,
  calculateBtcTransactionFee,
  getMasterFingerprint,
  getFormattedFeeUtxos,
  getFormattedUtxos,
  buildHTLCAndFundingAddress,
  buildHtlcClaimTx,
  buildHtlcRefundTx,
  parseLockBlockCount,
  parseHtlcRedeemScript,
  findWalletKeyForRedeemScript,
  verifyHtlcOutpoint,
  HTLC_CLAIM_FEE_SATOSHIS,
  HTLC_REFUND_FEE_SATOSHIS,
  toSatoshiBigInt,
}
