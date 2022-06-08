/* eslint-disable */
import { BIP32Factory } from 'bip32'
import * as Bip39 from 'bip39'
import * as bitcoin from 'bitcoinjs-lib'

const generateAddr = async () => {
  const ecc = await import('tiny-secp256k1')
  const bip32 = BIP32Factory(ecc)
  const network = bitcoin.networks.testnet
  const path = "m/49'/0'/0'/0"
  const mnemonic = Bip39.generateMnemonic()
  const seed = Bip39.mnemonicToSeedSync()
  const root = bip32.fromSeed(seed, network)
  const account = root.derivePath(path)
  const node = account.derive(0).derive(0)
  
  const addr = bitcoin.payments.p2pk({
    pubkey: node.publicKey,
    network,
  }).address
  console.log(`
  Wallet generated:
  - Address  : ${addr},
  - Key : ${node.toWIF()},
  - Mnemonic : ${mnemonic}
  `)
}
export { generateAddr }