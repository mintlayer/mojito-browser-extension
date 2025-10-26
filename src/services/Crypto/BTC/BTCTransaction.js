import * as bitcoin from 'bitcoinjs-lib'
import coinSelect from 'coinselect'
import { AppInfo } from '@Constants'

import { Electrum } from '@APIs'
import ECPairFactory from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import { witnessStackToScriptWitness } from 'bitcoinjs-lib/src/psbt/psbtutils'
import { BTC } from '@Helpers'

const getMasterFingerprint = (node) => {
  if (node?.fingerprint) {
    if (Buffer.isBuffer(node.fingerprint)) return node.fingerprint
    if (Number.isInteger(node.fingerprint)) {
      const b = Buffer.alloc(4)
      b.writeUInt32BE(node.fingerprint >>> 0, 0)
      return b
    }
  }
  const h160 = bitcoin.crypto.hash160(node.publicKey)
  return Buffer.from(h160.subarray(0, 4))
}

const getFormattedFeeUtxos = async (walletUtxo, walletType) => {
  const results = []

  for (const utxo of walletUtxo) {
    const formatted = {
      txId: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
    }

    if (walletType === 'legacy' || walletType === 'p2sh') {
      const rawTxHex = await Electrum.getTransactionHex(utxo.txid)
      formatted.nonWitnessUtxo = Buffer.from(rawTxHex, 'hex')
    } else if (walletType === 'nativeSegwit') {
      formatted.witnessUtxo = {
        script: bitcoin.address.toOutputScript(utxo.address, BTC.getNetwork()),
        value: utxo.value,
      }
    } else {
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
    const pubkey = Buffer.isBuffer(addrData.pubkey)
      ? addrData.pubkey
      : Buffer.from(addrData.pubkey, 'hex')
    const bip32Derivation = [
      {
        masterFingerprint: getMasterFingerprint(hdWallet),
        path: addrData.derivationPath,
        pubkey: pubkey,
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
      formatted.nonWitnessUtxo = Buffer.from(rawTxHex, 'hex')
    } else if (walletType === 'nativeSegwit') {
      formatted.witnessUtxo = {
        script: bitcoin.address.toOutputScript(utxo.address, BTC.getNetwork()),
        value: utxo.value,
      }
    } else {
      throw new Error(`Unknown wallet type: ${walletType}`)
    }

    results.push(formatted)
  }

  return results
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
  if (!inputs || !outputs) return

  const transactionBuilder = new bitcoin.Psbt({
    network: BTC.getNetwork(),
  })

  inputs.forEach((input) => {
    const psbtInput = {
      hash: input.txId || input.txid,
      index: input.vout,
      bip32Derivation: input.bip32Derivation,
    }

    if (input.nonWitnessUtxo) {
      psbtInput.nonWitnessUtxo = input.nonWitnessUtxo
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
      value: output.value,
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
    console.error('Transaction fee is not valid:', feeValidity)
    return
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

  const redeemScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    bitcoin.opcodes.OP_HASH160,
    Buffer.from(secretHashHex, 'hex'),
    bitcoin.opcodes.OP_EQUALVERIFY,
    Buffer.from(receiverPubKey, 'hex'),
    bitcoin.opcodes.OP_ELSE,
    bitcoin.script.number.encode(parseInt(lockBlockCount)),
    bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
    bitcoin.opcodes.OP_DROP,
    Buffer.from(senderPubKey, 'hex'),
    bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_CHECKSIG,
  ])

  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: redeemScript },
    network,
  })

  return {
    redeemScript,
    redeemScriptHex: redeemScript.toString('hex'),
    redeemScriptAsm: bitcoin.script.toASM(redeemScript),
    witnessScript: redeemScript,
    p2wshOutput: p2wsh.output,
    scriptPubKeyHex: p2wsh.output.toString('hex'),
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

  const network = bitcoin.networks[networkType]

  const psbt = new bitcoin.Psbt({ network })
  const redeemScript = Buffer.from(redeemScriptHex, 'hex')

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
    value: utxo.value - 500, // fee
  })

  const ECPair = ECPairFactory(ecc)

  const keyPair = ECPair.fromWIF(wif, bitcoin.networks[networkType])

  psbt.signInput(0, keyPair)
  psbt.finalizeInput(0, (_, input) => {
    const sig = input.partialSig[0].signature
    const witness = witnessStackToScriptWitness([
      sig,
      Buffer.from(secretHex, 'hex'),
      Buffer.from([0x01]),
      redeemScript,
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

  // Parse redeemScript
  let redeemScript
  try {
    redeemScript = Buffer.from(redeemScriptHex, 'hex')
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

  // Validate that p2wshOutput is a Buffer
  if (!Buffer.isBuffer(p2wshOutput)) {
    throw new Error('P2WSH output is not a Buffer')
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
        sig,
        Buffer.from([]), // OP_FALSE for refund path
        redeemScript,
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
  const chunks = bitcoin.script.decompile(Buffer.from(redeemScriptHex, 'hex'))
  if (!chunks) throw new Error('Invalid redeemScript')

  const csvIndex = chunks.findIndex(
    (op) => op === bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
  )
  if (csvIndex === -1) throw new Error('No CHECKSEQUENCEVERIFY in redeemScript')

  const lockChunk = chunks[csvIndex - 1]
  if (typeof lockChunk === 'number') {
    // OP_1 … OP_16
    return lockChunk - bitcoin.opcodes.OP_RESERVED // OP_0 = 0x00
  } else if (Buffer.isBuffer(lockChunk)) {
    return bitcoin.script.number.decode(lockChunk)
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
}
