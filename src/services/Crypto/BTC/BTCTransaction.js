import ECPairFactory from 'ecpair'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'

import { Electrum } from '@APIs'
import { Concurrency, BTC } from '@Helpers'
import { EnvVars } from '@Constants'

const orderByDateDesc = (transactionA, transactionB) => {
  if (transactionA.status.block_time > transactionB.status.block_time) return -1
  if (transactionA.status.block_time < transactionB.status.block_time) return 1
  return 0
}

const getEnoughUtxo = (transactions, target) =>
  transactions.reduce((acc, item) => {
    if (target < 0) return acc
    target = target - item.value
    acc.push(item)
    return acc
  }, [])

const utxoSelect = (utxoList, amountNeeded) => {
  if (BTC.calculateBalanceFromUtxoList(utxoList) < amountNeeded)
    throw Error('Not enough funds')

  /*
   * The "coin selection" algo used here is LIFO.
   * Hence, the list is first ordered from newer to older
   * then we get all transactions needed, from the first,
   * to cover the desired amount.
   */
  const newerToOlder = utxoList.sort(orderByDateDesc)
  const selectedTransactions = getEnoughUtxo(newerToOlder, amountNeeded)

  return selectedTransactions
}

const getFullTransactionsFromUtxoList = async (utxoList) =>
  await Concurrency.map(utxoList, async (utxo) =>
    JSON.parse(await Electrum.getTransactionData(utxo.txid)),
  )

const getHexTransactions = async (transactionList) =>
  await Concurrency.map(transactionList, async (utxo) => ({
    txid: utxo.txid,
    raw: await Electrum.getTransactionHex(utxo.txid),
  }))

const buildTransaction = async ({ to, amount, fee, wif, from }) => {
  const EcPair = ECPairFactory(ecc)
  const utxos = JSON.parse(await Electrum.getAddressUtxo(from))
  const selectedUtxo = utxoSelect(utxos, amount + fee)
  const fullTransactions = await getFullTransactionsFromUtxoList(selectedUtxo)
  // const nonSegwitTransaction = fullTransactions.filter(BTC.nonSegwitFilter)
  const rawTransactions = await getHexTransactions(fullTransactions)
  const change = BTC.calculateBalanceFromUtxoList(selectedUtxo) - fee - amount
  const transactionBuilder = new bitcoin.Psbt({
    network: bitcoin.networks[EnvVars.BTC_NETWORK],
  })

  fullTransactions.forEach((transaction) => {
    const idx = selectedUtxo.find((utxo) => utxo.txid === transaction.txid).vout
    const input = {
      hash: transaction.txid,
      index: idx,
    }

    // if (BTC.isTransactionSegwit(transaction)) {
    //   const vout = transaction.vout.find(vout => vout.scriptpubkey_address === from)
    //   input.witnessUtxo = {
    //     script: Buffer.from(vout.scriptpubkey, 'hex'),
    //     value: vout.value
    //   }
    // } else {
    const raw = rawTransactions.find(
      (rawTransaction) => rawTransaction.txid === transaction.txid,
    ).raw
    input.nonWitnessUtxo = Buffer.from(raw, 'hex')
    // }
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

  transactionBuilder.signAllInputs(
    EcPair.fromWIF(wif, bitcoin.networks[EnvVars.BTC_NETWORK]),
  )
  transactionBuilder.finalizeAllInputs()

  return transactionBuilder.extractTransaction()
}

export { utxoSelect, buildTransaction }
