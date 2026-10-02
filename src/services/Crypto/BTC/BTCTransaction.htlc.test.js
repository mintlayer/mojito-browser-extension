import * as bitcoin from 'bitcoinjs-lib'
import { BIP32Factory } from 'bip32'
import * as ecc from '@bitcoinerlab/secp256k1'
import {
  findWalletKeyForRedeemScript,
  buildHtlcClaimTx,
  HTLC_CLAIM_FEE_SATOSHIS,
} from './BTCTransaction'

const bip32 = BIP32Factory(ecc)

// Deterministic test HD wallet (never holds funds).
const root = bip32.fromSeed(new Uint8Array(64).fill(1))
const ourChild = root.derivePath("m/84'/0'/0'/0/0")

// This bitcoinjs build validates strict Uint8Array inputs (valibot), so
// Buffer-derived fixtures are converted before compiling.
const u8 = (bytes) => new Uint8Array(bytes)

const compileHtlc = (receiverPubkey, senderPubkey, lockBlocks = 100) => {
  const compiled = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    bitcoin.opcodes.OP_HASH160,
    u8(Buffer.alloc(20, 2)),
    bitcoin.opcodes.OP_EQUALVERIFY,
    u8(receiverPubkey),
    bitcoin.opcodes.OP_ELSE,
    bitcoin.script.number.encode(lockBlocks),
    bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
    bitcoin.opcodes.OP_DROP,
    u8(senderPubkey),
    bitcoin.opcodes.OP_ENDIF,
    bitcoin.opcodes.OP_CHECKSIG,
  ])
  return Buffer.from(compiled).toString('hex')
}
const foreignPubkey = Buffer.alloc(33, 9)
const ourScriptHex = compileHtlc(ourChild.publicKey, foreignPubkey)
const foreignScriptHex = compileHtlc(foreignPubkey, Buffer.alloc(33, 8))

const addressData = {
  btcReceivingAddresses: [
    {
      address: 'bc1qours',
      pubkey: ourChild.publicKey,
      derivationPath: "m/84'/0'/0'/0/0",
      privateKey: ourChild.toWIF(),
    },
  ],
  btcChangeAddresses: [],
}

describe('findWalletKeyForRedeemScript', () => {
  it('finds the stored WIF when the script binds one of our pubkeys', () => {
    const keyInfo = findWalletKeyForRedeemScript({
      redeemScriptHex: ourScriptHex,
      btcAddressData: addressData,
      btcHDWallet: root,
    })

    expect(keyInfo).toEqual({
      wif: ourChild.toWIF(),
      address: 'bc1qours',
      derivationPath: "m/84'/0'/0'/0/0",
    })
  })

  it('re-derives from the HD node when the entry has no stored WIF', () => {
    const entryWithoutWif = {
      btcReceivingAddresses: [
        {
          address: 'bc1qours',
          pubkey: ourChild.publicKey,
          derivationPath: "m/84'/0'/0'/0/0",
        },
      ],
      btcChangeAddresses: [],
    }

    const keyInfo = findWalletKeyForRedeemScript({
      redeemScriptHex: ourScriptHex,
      btcAddressData: entryWithoutWif,
      btcHDWallet: root,
    })

    expect(keyInfo.wif).toBe(ourChild.toWIF())
  })

  it('re-derives from known paths when the store carries no pubkeys', () => {
    const entriesWithoutPubkeys = {
      btcReceivingAddresses: [
        {
          address: 'bc1qours',
          derivationPath: "m/84'/0'/0'/0/0",
        },
      ],
      btcChangeAddresses: [],
    }

    const keyInfo = findWalletKeyForRedeemScript({
      redeemScriptHex: ourScriptHex,
      btcAddressData: entriesWithoutPubkeys,
      btcHDWallet: root,
    })

    expect(keyInfo.wif).toBe(ourChild.toWIF())
  })

  it('returns null when the script binds only foreign keys', () => {
    const keyInfo = findWalletKeyForRedeemScript({
      redeemScriptHex: foreignScriptHex,
      btcAddressData: addressData,
      btcHDWallet: root,
    })

    expect(keyInfo).toBeNull()
  })

  it('returns null for malformed input', () => {
    expect(
      findWalletKeyForRedeemScript({
        redeemScriptHex: 'zzzz',
        btcAddressData: addressData,
        btcHDWallet: root,
      }),
    ).toBeNull()
    expect(
      findWalletKeyForRedeemScript({
        redeemScriptHex: undefined,
        btcAddressData: addressData,
        btcHDWallet: root,
      }),
    ).toBeNull()
  })
})

describe('buildHtlcClaimTx — request validation', () => {
  const validSecret = 'a'.repeat(64)
  const base = {
    networkType: 'testnet',
    utxo: { txid: 'f'.repeat(64), vout: 0, value: 2000 },
    toAddress: 'tb1qdest',
    wif: 'cWifDummyNotUsedBeforeValidation',
    redeemScriptHex: ourScriptHex,
    secretHex: validSecret,
  }

  it('rejects a utxo without txid/vout', async () => {
    await expect(
      buildHtlcClaimTx({ ...base, utxo: { value: 2000, vout: 0 } }),
    ).rejects.toThrow('Invalid UTXO: txid or vout missing/invalid')
  })

  it('rejects a non-integer or non-positive utxo value', async () => {
    await expect(
      buildHtlcClaimTx({ ...base, utxo: { ...base.utxo, value: '2000' } }),
    ).rejects.toThrow('Invalid UTXO: value must be a positive integer')
    await expect(
      buildHtlcClaimTx({ ...base, utxo: { ...base.utxo, value: 0 } }),
    ).rejects.toThrow('Invalid UTXO: value must be a positive integer')
  })

  it('rejects non-hex redeem scripts', async () => {
    await expect(
      buildHtlcClaimTx({ ...base, redeemScriptHex: 'not-hex' }),
    ).rejects.toThrow('Invalid redeemScriptHex')
  })

  it('rejects a missing wif (the old phantom-destructure path)', async () => {
    await expect(buildHtlcClaimTx({ ...base, wif: undefined })).rejects.toThrow(
      'wif missing',
    )
  })

  it('rejects secrets that are not 64 hex characters', async () => {
    await expect(
      buildHtlcClaimTx({ ...base, secretHex: 'zz' }),
    ).rejects.toThrow('Invalid secret')
    await expect(
      buildHtlcClaimTx({ ...base, secretHex: `${validSecret}ff` }),
    ).rejects.toThrow('Invalid secret')
  })

  it('rejects utxos that cannot cover the fixed claim fee', async () => {
    await expect(
      buildHtlcClaimTx({
        ...base,
        utxo: { ...base.utxo, value: HTLC_CLAIM_FEE_SATOSHIS },
      }),
    ).rejects.toThrow('UTXO amount too low to cover fee')
  })
})
