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
    lockBlockCount,
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
    bitcoin.script.number.encode(lockBlockCount),
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
    value: utxo.value - 500, // fee
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
  const { network, utxo, toAddress, keyPair, redeemScriptHex, lockBlockCount } =
    params

  const psbt = new bitcoin.Psbt({ network })
  const redeemScript = Buffer.from(redeemScriptHex, 'hex')

  psbt.addInput({
    hash: utxo.txid,
    index: utxo.vout,
    sequence: lockBlockCount,
    witnessUtxo: {
      script: bitcoin.payments.p2wsh({
        redeem: { output: redeemScript },
        network,
      }).output,
      value: utxo.amount,
    },
    redeemScript,
  })

  psbt.addOutput({
    address: toAddress,
    value: utxo.amount - 500, // fee
  })

  psbt.setVersion(2) // for CHECKSEQUENCEVERIFY
  psbt.signInput(0, keyPair)
  psbt.finalizeInput(0, (_, input) => {
    const sig = input.partialSig[0].signature
    const witness = bitcoin.script.witnessStackToScriptWitness([
      sig,
      Buffer.from([]), // OP_FALSE
      redeemScript,
    ])
    return { finalScriptWitness: witness }
  })

  return psbt.extractTransaction().toHex()
}

export {
  buildTransaction,
  buildHTLCAndFundingAddress,
  buildHtlcClaimTx,
  buildHtlcRefundTx,
}
