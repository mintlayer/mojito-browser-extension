import ECPairFactory from 'ecpair'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from '@bitcoinerlab/secp256k1'
import { witnessStackToScriptWitness } from 'bitcoinjs-lib/src/psbt/psbtutils'

import { Electrum } from '@APIs'
import { Concurrency, BTC, BTCTransaction } from '@Helpers'

const getFullTransactionsFromUtxoList = async (utxoList) =>
  await Concurrency.map(utxoList, async (utxo) =>
    JSON.parse(await Electrum.getTransactionData(utxo.txid)),
  )

const getHexTransactions = async (transactionList) =>
  await Concurrency.map(transactionList, async (utxo) => ({
    txid: utxo.txid,
    raw: await Electrum.getTransactionHex(utxo.txid),
  }))

const getTransactionData = async ({ from, amount, fee }) => {
  const EcPair = ECPairFactory(ecc)
  const selectedUtxo = await BTCTransaction.selectNeededUtxos(from, amount, fee)
  const fullTransactions = await getFullTransactionsFromUtxoList(selectedUtxo)
  const rawTransactions = await getHexTransactions(fullTransactions)
  const change = BTC.calculateBalanceFromUtxoList(selectedUtxo) - fee - amount

  return {
    EcPair,
    fullTransactions,
    selectedUtxo,
    rawTransactions,
    change,
  }
}

const buildTransaction = async ({
  to,
  amount,
  fee,
  wif,
  from,
  networkType,
}) => {
  if (!BTCTransaction.isValidAmount(amount))
    return Promise.reject('Amount out of bounds.')
  if (!BTCTransaction.isValidAmount(fee))
    return Promise.reject('Fee out of bounds.')

  const { EcPair, fullTransactions, selectedUtxo, rawTransactions, change } =
    await getTransactionData({ from, fee, amount })

  const network = bitcoin.networks[networkType]

  const transactionBuilder = new bitcoin.Psbt({
    network,
  })

  fullTransactions.forEach((transaction) => {
    const idx = selectedUtxo.find((utxo) => utxo.txid === transaction.txid).vout
    const input = {
      hash: transaction.txid,
      index: idx,
    }

    const raw = rawTransactions.find(
      (rawTransaction) => rawTransaction.txid === transaction.txid,
    ).raw
    input.nonWitnessUtxo = Buffer.from(raw, 'hex')
    transactionBuilder.addInput(input)
  })

  console.log('to', to)
  console.log('from', from)
  console.log('amount', amount)
  console.log('change', change)

  transactionBuilder.addOutput({
    address: to,
    value: amount,
  })
  console.log('transactionBuilder', transactionBuilder)
  transactionBuilder.addOutput({
    address: from,
    value: change,
  })

  transactionBuilder.signAllInputs(EcPair.fromWIF(wif, network))
  transactionBuilder.finalizeAllInputs()
  return [
    transactionBuilder.extractTransaction(),
    transactionBuilder.extractTransaction().toHex(),
    transactionBuilder.extractTransaction().getId(),
  ]
}

const buildHTLCAndFundingAddress = async (input) => {
  console.log('input', input)
  const {
    receiverPubKey,
    senderPubKey,
    secretHashHex,
    lock: lockBlockCount,
    networkType = 'testnet',
  } = input

  const network = bitcoin.networks[networkType]

  console.log('network', network)

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

  console.log('redeemScript', redeemScript)

  const p2wsh = bitcoin.payments.p2wsh({
    redeem: { output: redeemScript },
    network,
  })

  console.log('p2wsh', p2wsh)

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
  console.log('params', params)
  const {
    networkType = 'testnet',
    utxo,
    toAddress,
    wif,
    redeemScriptHex,
    secretHex,
  } = params

  console.log('networkType', networkType)

  const network = bitcoin.networks[networkType]

  console.log('network', network)

  const psbt = new bitcoin.Psbt({ network })
  const redeemScript = Buffer.from(redeemScriptHex, 'hex')

  console.log('psbt1', psbt)

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
    value: utxo.value - 2000, // fee
  })

  console.log('psbt2', psbt)

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

  // Ensure amount is in satoshis
  const amountInSatoshis = utxo.value
  // if (typeof utxo.amount === 'string') {
  //   amountInSatoshis = Math.round(parseFloat(utxo.amount) * 1e8)
  // } else if (typeof utxo.amount === 'number') {
  //   amountInSatoshis =
  //     utxo.amount < 1000 ? Math.round(utxo.amount * 1e8) : utxo.amount
  // } else {
  //   throw new Error('Invalid utxo.amount: must be a number or string in BTC')
  // }

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

export function parseLockBlockCount(redeemScriptHex) {
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
  buildHTLCAndFundingAddress,
  buildHtlcClaimTx,
  buildHtlcRefundTx,
}
