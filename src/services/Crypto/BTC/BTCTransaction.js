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

/**
 * Finds the wallet key that a redeem script binds, so HTLC spend/refund
 * requests can be signed with OUR key (and only ours).
 *
 * Walks the script chunks, collects pubkey-sized pushes (32/33 bytes —
 * compressed pubkeys; the 20-byte OP_HASH160 digest is excluded), and
 * matches them against the wallet's derived addresses. Prefers the WIF
 * stored on the address entry, falls back to re-deriving the child node
 * from the HD root via the entry's derivation path.
 *
 * Returns { wif, address, derivationPath } or null when the script binds
 * no key from this wallet — callers must treat null as reject-signing.
 */
const findWalletKeyForRedeemScript = ({
  redeemScriptHex,
  btcAddressData,
  btcHDWallet,
}) => {
  try {
    if (!redeemScriptHex || typeof redeemScriptHex !== 'string') return null
    const chunks = bitcoin.script.decompile(u8FromHex(redeemScriptHex))
    if (!chunks) return null

    const scriptPubkeys = chunks
      .filter(
        (chunk) =>
          isBytes(chunk) && (chunk.length === 33 || chunk.length === 32),
      )
      .map((chunk) => Buffer.from(chunk).toString('hex'))
    if (scriptPubkeys.length === 0) return null

    const entries = [
      ...(btcAddressData?.btcReceivingAddresses ?? []),
      ...(btcAddressData?.btcChangeAddresses ?? []),
    ]
    const toPubkeyHex = (entry) => {
      if (isBytes(entry?.pubkey)) return toBuffer(entry.pubkey).toString('hex')
      return typeof entry?.pubkey === 'string' ? entry.pubkey : ''
    }

    const match = entries.find((entry) =>
      scriptPubkeys.includes(toPubkeyHex(entry)),
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
      if (scriptPubkeys.includes(toBuffer(child.publicKey).toString('hex'))) {
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
  if (!Number.isSafeInteger(utxo.value) || utxo.value <= 0) {
    throw new Error('Invalid UTXO: value must be a positive integer')
  }
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
  if (utxo.value <= HTLC_CLAIM_FEE_SATOSHIS) {
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
      value: utxo.value,
    },
    witnessScript: redeemScript,
  })

  psbt.addOutput({
    address: toAddress,
    value: utxo.value - HTLC_CLAIM_FEE_SATOSHIS, // fee
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
  if (!redeemScriptHex || !/^[0-9a-fA-F]+$/.test(redeemScriptHex)) {
    throw new Error('Invalid redeemScriptHex: must be a valid hex string')
  }
  if (!toAddress || !wif) {
    throw new Error('toAddress or wif missing')
  }

  const amountInSatoshis = utxo.value

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
      value: amountInSatoshis,
    },
    witnessScript: redeemScript,
  })

  // Add output
  const fee = '1000' // Fixed fee in satoshis
  if (amountInSatoshis <= fee) {
    throw new Error('UTXO amount too low to cover fee')
  }
  psbt.addOutput({
    address: toAddress,
    value: amountInSatoshis - fee,
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

  const lockChunk = chunks[csvIndex - 1]
  if (typeof lockChunk === 'number') {
    // OP_1 … OP_16
    return lockChunk - bitcoin.opcodes.OP_RESERVED // OP_0 = 0x00
  } else if (isBytes(lockChunk)) {
    return bitcoin.script.number.decode(toBuffer(lockChunk))
  } else {
    throw new Error('LockBlockCount not found before CHECKSEQUENCEVERIFY')
  }
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
  findWalletKeyForRedeemScript,
  HTLC_CLAIM_FEE_SATOSHIS,
}
