import { BIP32Factory } from 'bip32'
import * as Bip39 from 'bip39'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'

import { EnvVars } from '@Constants'
import { Electrum } from '@APIs'

// eslint-disable-next-line
const DERIVATION_PATH = "m/44'/0'/0'/0/0"
const NETWORK = bitcoin.networks[EnvVars.BTC_NETWORK]

const getBIP32Object = () => BIP32Factory(ecc)

const getSeedFromMnemonic = (mnemonic) => Bip39.mnemonicToSeedSync(mnemonic)

const getKeysFromSeed = (seed) => {
  const root = getBIP32Object().fromSeed(seed, NETWORK)
  const account = root.derivePath(DERIVATION_PATH)
  return [account.publicKey, account.toWIF()]
}
const getAddressFromPubKey = (pubkey) =>
  bitcoin.payments.p2pkh({ pubkey, network: NETWORK }).address

const generateMnemonic = () => Bip39.generateMnemonic()

const generateKeysFromMnemonic = (mnemonic) => {
  const seed = getSeedFromMnemonic(mnemonic)
  return getKeysFromSeed(seed)
}

const generateAddr = (mnemonic) => {
  const [pubKey] = generateKeysFromMnemonic(mnemonic)
  const btcAddress = getAddressFromPubKey(pubKey)

  return btcAddress
}

const convertSatoshiToBtc = (satoshiAmount) => satoshiAmount / 100_000_000

const calculateBalanceFromUtxoList = (list) =>
  list.reduce((accumulator, transaction) => accumulator + transaction.value, 0)

const validateMnemonic = (mnemonic) => Bip39.validateMnemonic(mnemonic)

const getWordList = () => Bip39.wordlists[Bip39.getDefaultWordlist()]

const getConfirmationsAmount = async (transaction) => {
  if (!transaction)
    return new Promise.reject('No transaction to check confirmations.')
  if (!transaction.blockHeight) return Promise.resolve(0)

  const lastBlockHeight = await Electrum.getLastBlockHeight()
  return lastBlockHeight - transaction.blockHeight
}

const getParsedTransactions = (rawTransactions, baseAddress) => {
  const getDirection = (transaction) =>
    transaction.vin.find(
      (item) => item.prevout.scriptpubkey_address === baseAddress,
    )
      ? 'out'
      : 'in'

  const getTransactionAmountInSatoshi = (direction, transaction) =>
    direction === 'in'
      ? transaction.vout.find(
          (item) => item.scriptpubkey_address === baseAddress,
        ).value
      : transaction.vout
          .filter((item) => item.scriptpubkey_address !== baseAddress)
          .reduce((acc, item) => acc + item.value, 0)

  const getTransactionOtherParts = (direction, transaction) =>
    direction === 'in'
      ? transaction.vin
          .filter((item) => item.prevout.scriptpubkey_address !== baseAddress)
          .reduce((acc, item) => {
            acc.push(item.prevout.scriptpubkey_address)
            return acc
          }, [])
      : transaction.vout.reduce((arr, item) => {
          if (item.scriptpubkey_address !== baseAddress)
            arr.push(item.scriptpubkey_address)
          else return arr

          return arr
        }, [])

  const parsedTransactions = rawTransactions.map((transaction) => {
    const direction = getDirection(transaction)
    const satoshi = getTransactionAmountInSatoshi(direction, transaction)
    const value = convertSatoshiToBtc(satoshi)
    const date = transaction.status.block_time
    const blockHeight = transaction.status.block_height

    const otherPart = getTransactionOtherParts(direction, transaction)

    return {
      txid: transaction.txid,
      date,
      direction,
      value,
      blockHeight,
      otherPart,
    }
  })

  return parsedTransactions
}

export {
  generateAddr,
  generateMnemonic,
  generateKeysFromMnemonic,
  getSeedFromMnemonic,
  getKeysFromSeed,
  getAddressFromPubKey,
  calculateBalanceFromUtxoList,
  convertSatoshiToBtc,
  validateMnemonic,
  getWordList,
  getParsedTransactions,
  getConfirmationsAmount,
}
