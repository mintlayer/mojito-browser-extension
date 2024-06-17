import ECPairFactory from 'ecpair'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs'

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

const buildTransaction = async ({ to, amount, fee, wif, from }) => {
  if (!BTCTransaction.isValidAmount(amount))
    return Promise.reject('Amount out of bounds.')
  if (!BTCTransaction.isValidAmount(fee))
    return Promise.reject('Fee out of bounds.')

  const { EcPair, fullTransactions, selectedUtxo, rawTransactions, change } =
    await getTransactionData({ from, fee, amount })

  const transactionBuilder = new bitcoin.Psbt({
    network: BTC.getNetwork(),
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

  transactionBuilder.addOutput({
    address: to,
    value: amount,
  })
  transactionBuilder.addOutput({
    address: from,
    value: change,
  })

  transactionBuilder.signAllInputs(EcPair.fromWIF(wif, BTC.getNetwork()))
  transactionBuilder.finalizeAllInputs()

  return [
    transactionBuilder.extractTransaction(),
    transactionBuilder.extractTransaction().toHex(),
  ]
}

export { buildTransaction }
