import * as bitcoin from 'bitcoinjs-lib'
import coinSelect from 'coinselect'
import { AppInfo } from '@Constants'

import { Electrum } from '@APIs'
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
    root.btcAddresses,
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

export { buildTransaction, calculateBtcTransactionFee }
