import { BIP32Factory } from 'bip32'
import * as Bip39 from 'bip39'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import { BTC_NETWORK } from '../../environmentVars'

// eslint-disable-next-line
const DERIVATION_PATH = "m/44'/0'/0'/0/0"
const NETWORK = bitcoin.networks[BTC_NETWORK]

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

const calculateBalanceFromUtxoList = (list) =>
  list.reduce((accumulator, transaction) => accumulator + transaction.value, 0)

const convertSatoshiToBtc = (satoshiAmount) => satoshiAmount / 100_000_000

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

    const otherPart = getTransactionOtherParts(direction, transaction)

    return {
      txid: transaction.txid,
      date,
      direction,
      value,
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
  getParsedTransactions,
}
