import ECPairFactory from 'ecpair'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'

import { Electrum } from '@APIs'
import { EnvVars } from '@Constants'
import {
  Concurrency,
  BTC,
  BTCTransaction
} from '@Helpers'

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
  const utxos = JSON.parse(await Electrum.getAddressUtxo(from))
  const selectedUtxo = BTCTransaction.utxoSelect(utxos, amount + fee)
  const fullTransactions = await getFullTransactionsFromUtxoList(selectedUtxo)
  const rawTransactions = await getHexTransactions(fullTransactions)
  const change = BTC.calculateBalanceFromUtxoList(selectedUtxo) - fee - amount
  const nonSegwitTransactions = fullTransactions.filter(BTC.nonSegwitFilter)

  return {
    EcPair,
    fullTransactions,
    selectedUtxo,
    rawTransactions,
    change,
    nonSegwitTransactions
  }
}

const buildTransaction = async ({ to, amount, fee, wif, from }) => {
  const {
    EcPair,
    fullTransactions,
    selectedUtxo,
    rawTransactions,
    change
  } = getTransactionData({ from, fee, amount })

  const transactionBuilder = new bitcoin.Psbt({
    network: bitcoin.networks[EnvVars.BTC_NETWORK],
  })

  fullTransactions.forEach((transaction) => {
    const idx = selectedUtxo.find((utxo) => utxo.txid === transaction.txid).vout
    const input = {
      hash: transaction.txid,
      index: idx,
    }

    if (BTC.isTransactionSegwit(transaction)) {
      const vout = transaction.vout.find(vout => vout.scriptpubkey_address === from)
      input.witnessUtxo = {
        script: Buffer.from(vout.scriptpubkey, 'hex'),
        value: vout.value
      }
    } else {
      const raw = rawTransactions.find(
        (rawTransaction) => rawTransaction.txid === transaction.txid,
      ).raw
      input.nonWitnessUtxo = Buffer.from(raw, 'hex')
    }
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

export {
  buildTransaction
}
