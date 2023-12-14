import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { Mintlayer } from '@APIs'
import { Format, ML } from '@Helpers'
import { AccountContext } from '@Contexts'

import { ML as MLCrypto } from '@Cryptos'
import { Account } from '@Entities'

const useMlWalletInfo = (addresses) => {
  const { setWalletDataLoading } = useContext(AccountContext)
  const effectCalled = useRef(false)
  const [mlTransactionsList, setMlTransactionsList] = useState([])
  const [mlBalance, setMlBalance] = useState(0)

  const getTransactions = useCallback(async () => {
    try {
      if (!addresses) return
      const addressList = [
        ...addresses.mlReceivingAddresses,
        ...addresses.mlChangeAddresses,
      ]
      const transactions = await Mintlayer.getWalletTransactions(addressList)
      const parsedTransactions = ML.getParsedTransactions(transactions)
      setMlTransactionsList(parsedTransactions)
    } catch (error) {
      console.error(error)
    }
  }, [addresses])

  const getBalance = useCallback(async () => {
    try {
      if (!addresses) return
      setWalletDataLoading(true)
      const addressList = [
        ...addresses.mlReceivingAddresses,
        ...addresses.mlChangeAddresses,
      ]

      // get master private key
      const { mlPrivKeys } = await Account.unlockAccount(
        1,
        'Crawling!123',
      )
      // get wallet private keys
      const walletPrivKeys = await MLCrypto.getWalletPrivKeysList(
        mlPrivKeys.mlTestnetPrivateKey,
        'testnet'
      )
      console.log('-------walletPrivKeys_utxo', walletPrivKeys)

      // const firstReceivingAddress = await MLCrypto.getFirstReceivingAddress(
      //   mlPrivKeys.mlTestnetPrivateKey,
      //   'testnet'
      // )
      // console.log('-------firstReceivingAddress_utxo', firstReceivingAddress)

      // get address private key
      const address = 'tmt1qysmvag4tmpgyk7g8d93yz2lvku8mc2npqscga46'
      const addressPrivkey = walletPrivKeys[address]

      // get wallet utxos
      const utxos = await Mintlayer.getWalletUtxos(addressList)
      console.log('-------utxos_utxo', utxos)
      // remove empty utxos
      const parsedUtxos = utxos
        .map((utxo) => JSON.parse(utxo))
        .filter((utxo) => utxo.length > 0).flatMap((utxo) => utxo)
      console.log('-------parsedUtxo_utxo', parsedUtxos)

      // make buffer from txid
      const txidBytes = Buffer.from(parsedUtxos[0].outpoint.id.Transaction, 'hex')
      console.log('-------txidBytes_utxo', txidBytes)

      // get encoded outpoint source id
      const outpointSourceId = await MLCrypto.getEncodedOutpointSourceId(
        txidBytes
      )
      // console.log('-------outpointSourceId_utxo', outpointSourceId)

      // get tx input
      const txInput = await MLCrypto.getTxInput(outpointSourceId, 0)
      // console.log('-------txInput_1_utxo', txInput)
      const txInputs = [...txInput]
      // console.log('-------txInputsArray_utxo', txInputs)


      // console.log('-------txInputs_utxo', await getTxInputs(outpointSourceIds))

      // get tx output
      const txOutput = await MLCrypto.getOutputs(
        '810000000000',
        'tmt1q8sxxjxpn7pt0dtdf8644tp3u7y28vjh65l0t4nn',
        'testnet',
      )
      console.log('-------txOutput_1_utxo', txOutput)
      const txOutputs = [...txOutput]
      console.log('-------txOutputsArray_utxo', txOutputs)

      // get transaction
      const transaction = await MLCrypto.getTransaction(txInputs, txOutputs)
      console.log('-------transaction_utxo', transaction)

      // get utxo output
      const outputsUtxo = await MLCrypto.getOutputs(
        '1011000000000',
        'tmt1qysmvag4tmpgyk7g8d93yz2lvku8mc2npqscga46',
        'testnet',
      )

      const opt_utxos = [1, ...outputsUtxo]

      // get encoded witness
      const encodedWitness = await MLCrypto.getEncodedWitness(
        addressPrivkey,
        address,
        transaction,
        opt_utxos,
        0,
        'testnet',
      )
      console.log('-------encodedWitness_utxo', encodedWitness)

      // get encoded signed transaction
      const encodedSignedTransaction = await MLCrypto.getEncodedSignedTransaction(
        transaction,
        encodedWitness,
      )

      console.log('-------encodedSignedTransaction_utxo', encodedSignedTransaction)
      const finalHex = encodedSignedTransaction.reduce(
        (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
        '',
      )

      console.log('-------finalHex_utxo', finalHex)
      // const resultBroadcast = await Mintlayer.broadcastTransaction(finalHex)
      // console.log('-------resultBroadcast_utxo', resultBroadcast)

      const balance = await Mintlayer.getWalletBalance(addressList)

      const formattedBalance = Format.BTCValue(balance.balanceInCoins)

      if (balance) setMlBalance(formattedBalance)
      else setMlBalance(0)
      setWalletDataLoading(false)
    } catch (error) {
      console.error(error)
      setMlBalance(0)
      setWalletDataLoading(false)
      return
    }
  }, [addresses, setWalletDataLoading])

  useEffect(() => {
    /* istanbul ignore next */
    if (effectCalled.current) return
    effectCalled.current = true

    getTransactions()
    getBalance()
  }, [getBalance, getTransactions])

  return { mlTransactionsList, mlBalance }
}

export default useMlWalletInfo
