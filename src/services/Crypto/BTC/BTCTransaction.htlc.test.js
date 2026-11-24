import * as bitcoin from 'bitcoinjs-lib'
import { BIP32Factory } from 'bip32'
import { ECPairFactory, networks as ecpairNetworks } from 'ecpair'
import * as ecc from '@bitcoinerlab/secp256k1'
import {
  findWalletKeyForRedeemScript,
  parseHtlcRedeemScript,
  verifyHtlcOutpoint,
  buildHtlcClaimTx,
  buildHtlcRefundTx,
  readPublicKeyHex,
  walletBtcPublicKeyHexes,
  verifyHtlcCreateKeys,
  HTLC_CREATE_KEY_CODES,
  HTLC_CLAIM_FEE_SATOSHIS,
  HTLC_REFUND_FEE_SATOSHIS,
  toSatoshiBigInt,
} from './BTCTransaction'
import { Electrum } from '@APIs'

// The chain: the Electrum client is a mock, no network is ever touched.
jest.mock('@APIs', () => ({
  __esModule: true,
  Electrum: {
    getTransactionData: jest.fn(),
    getTransactionHex: jest.fn(),
    getOutspend: jest.fn(),
  },
  Mintlayer: {},
}))

const bip32 = BIP32Factory(ecc)

// Deterministic testnet signer bound into the psbt-construction fixtures
// below (never holds funds; rng-seeded so the WIF is stable).
const ECPair = ECPairFactory(ecc)
const claimSigner = ECPair.makeRandom({
  network: ecpairNetworks.testnet,
  rng: (size) => new Uint8Array(size).fill(7),
})
const claimSignerWif = claimSigner.toWIF()

// Deterministic test HD wallet (never holds funds).
const root = bip32.fromSeed(new Uint8Array(64).fill(1))
const ourChild = root.derivePath("m/84'/0'/0'/0/0")

// This bitcoinjs build validates strict Uint8Array inputs (valibot), so
// Buffer-derived fixtures are converted before compiling.
const u8 = (bytes) => new Uint8Array(bytes)

const compileHtlc = (
  receiverPubkey,
  senderPubkey,
  lockBlocks = 100,
  secretHash = Buffer.alloc(20, 2),
) => {
  const compiled = bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    bitcoin.opcodes.OP_HASH160,
    u8(secretHash),
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
// our key behind the timelock only
const ourRefundBranchScriptHex = compileHtlc(foreignPubkey, ourChild.publicKey)

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
const hexOf = (bytes) => Buffer.from(bytes).toString('hex')
// Deterministic keys (never hold funds): another key of the test wallet,
// and two valid keys it does not hold.
const seededKey = (seed) =>
  ECPair.makeRandom({
    network: ecpairNetworks.testnet,
    rng: (size) => new Uint8Array(size).fill(seed),
  })
const walletChangeKey = seededKey(5)
// The same point as an uncompressed (65-byte, 04) public key.
const uncompressedHex = hexOf(ecc.pointCompress(ourChild.publicKey, false))
const foreignKey = seededKey(6)
const counterpartyKey = seededKey(9)
describe('parseHtlcRedeemScript', () => {
  it("reads the hash, both branch keys and the lock of the wallet's script shape", () => {
    const secretHash = Buffer.alloc(20, 7)
    expect(
      parseHtlcRedeemScript(
        compileHtlc(ourChild.publicKey, foreignPubkey, 144, secretHash),
      ),
    ).toEqual({
      secretHashHex: secretHash.toString('hex'),
      spendPubkeyHex: Buffer.from(ourChild.publicKey).toString('hex'),
      refundPubkeyHex: foreignPubkey.toString('hex'),
      lockBlockCount: 144,
    })
  })

  it('reads a lock encoded as OP_1…OP_16, as other compilers emit it', () => {
    const withOpN = Buffer.from(
      bitcoin.script.compile([
        bitcoin.opcodes.OP_IF,
        bitcoin.opcodes.OP_HASH160,
        u8(Buffer.alloc(20, 2)),
        bitcoin.opcodes.OP_EQUALVERIFY,
        u8(ourChild.publicKey),
        bitcoin.opcodes.OP_ELSE,
        bitcoin.opcodes.OP_4,
        bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
        bitcoin.opcodes.OP_DROP,
        u8(foreignPubkey),
        bitcoin.opcodes.OP_ENDIF,
        bitcoin.opcodes.OP_CHECKSIG,
      ]),
    ).toString('hex')
    expect(parseHtlcRedeemScript(withOpN).lockBlockCount).toBe(4)
  })

  it.each([
    ['an empty value', ''],
    ['non-hex', 'zzzz'],
    ['an odd length', 'abc'],
    ['a missing value', undefined],
    ['a truncated script', ourScriptHex.slice(0, -4)],
    [
      'a script whose hash is 32 bytes',
      compileHtlc(ourChild.publicKey, foreignPubkey, 100, Buffer.alloc(32, 2)),
    ],
  ])('returns null for %s', (_description, redeemScriptHex) => {
    expect(parseHtlcRedeemScript(redeemScriptHex)).toBeNull()
  })
})

describe('readPublicKeyHex', () => {
  it.each([
    ['a compressed key', hexOf(ourChild.publicKey)],
    ['an uppercase hex key', hexOf(ourChild.publicKey).toUpperCase()],
  ])('accepts %s and returns lowercase hex', (_shape, raw) => {
    expect(readPublicKeyHex(raw)).toEqual({
      valid: true,
      hex: raw.toLowerCase(),
    })
  })

  // Each shape the hex decode would otherwise accept by cutting the value
  // down: an odd length, a non-hex character, a key one digit short.
  it.each([
    ['not text', 42, 'it is not text'],
    ['an object', { toString: 1 }, 'it is not text'],
    ['empty', '', 'it is empty'],
    [
      'an odd number of hex digits',
      `${hexOf(ourChild.publicKey).slice(0, -1)}`,
      'odd number of digits',
    ],
    [
      'a non-hex character',
      `${hexOf(ourChild.publicKey).slice(0, -2)}zz`,
      'not hex digits',
    ],
    [
      'a key one byte short',
      hexOf(ourChild.publicKey).slice(0, -2),
      'it is 32 bytes starting',
    ],
    [
      '33 bytes starting 04',
      `04${hexOf(ourChild.publicKey).slice(2)}`,
      'it is 33 bytes starting 04',
    ],
    [
      '32 bytes (an x-only key)',
      hexOf(ourChild.publicKey).slice(2),
      'it is 32 bytes starting',
    ],
    [
      'a well-formed 33-byte value that is not a point on the curve',
      `02${'00'.repeat(31)}05`,
      'not a point on the secp256k1 curve',
    ],
    // a valid point, but no escrow script can carry it: the address
    // builder rejects a script holding an uncompressed key
    [
      'an uncompressed key (65 bytes starting 04)',
      uncompressedHex,
      'it is an uncompressed key, and the escrow script carries compressed keys only',
    ],
    [
      '65 bytes starting 02',
      `02${uncompressedHex.slice(2)}`,
      'it is 65 bytes starting 02, not 33 bytes starting 02 or 03',
    ],
  ])('refuses %s without truncating it', (_shape, raw, reason) => {
    const key = readPublicKeyHex(raw)
    expect(key.valid).toBe(false)
    expect(key.reason).toContain(reason)
    expect(key.hex).toBeUndefined()
  })
})

describe('walletBtcPublicKeyHexes', () => {
  const ourHex = hexOf(ourChild.publicKey)
  const otherHex = hexOf(counterpartyKey.publicKey)
  const stored = { bc1qours: { pubkey: ourChild.publicKey } }
  const unlocked = addressData.btcReceivingAddresses[0]
  // a typed array that round-tripped through the JSON store
  const roundTripped = {
    bc1qours: { pubkey: JSON.parse(JSON.stringify(ourChild.publicKey)) },
  }
  const asHex = { bc1qours: { pubkey: ourHex } }

  it.each([
    ['the stored entry shape', [stored]],
    ['the unlocked entry shape', [unlocked]],
    ['a byte object from the store', [roundTripped]],
    ['a hex string', [asHex]],
  ])('reads the public key from %s', (_shape, receiving) => {
    expect(
      walletBtcPublicKeyHexes({ btcReceivingAddresses: receiving }),
    ).toEqual(new Set([ourHex]))
  })

  it('reads receiving and change keys, and only valid public keys', () => {
    const keys = walletBtcPublicKeyHexes({
      btcReceivingAddresses: [
        stored,
        // a value that is not a public key can never refund an escrow
        { bc1qbad: { pubkey: { nope: 1 } } },
        { bc1qshort: { pubkey: ourHex.slice(0, -2) } },
        'bc1qstring',
      ],
      btcChangeAddresses: [{ bc1qchange: { pubkey: otherHex.toUpperCase() } }],
    })
    expect(keys).toEqual(new Set([ourHex, otherHex]))
  })

  it.each([
    ['no address data', undefined],
    ['no lists', {}],
    [
      'lists that are not arrays',
      { btcReceivingAddresses: {}, btcChangeAddresses: 'x' },
    ],
    [
      'entries without a public key',
      {
        btcReceivingAddresses: [{ bc1qnokey: {} }, null],
        btcChangeAddresses: [],
      },
    ],
  ])('reads nothing from %s', (_shape, btcAddressData) => {
    expect(walletBtcPublicKeyHexes(btcAddressData)).toEqual(new Set())
  })
})

describe("verifyHtlcCreateKeys — the verdict on a create request's two keys", () => {
  const refundHex = hexOf(ourChild.publicKey)
  const recipientHex = hexOf(counterpartyKey.publicKey)
  const otherWalletHex = hexOf(walletChangeKey.publicKey)
  const btcAddressData = {
    btcReceivingAddresses: [addressData.btcReceivingAddresses[0]],
    btcChangeAddresses: [
      {
        address: 'bc1qchange',
        pubkey: Buffer.from(otherWalletHex, 'hex'),
        derivationPath: "m/84'/0'/1'/0/0",
      },
    ],
  }
  const verify = (overrides = {}) =>
    verifyHtlcCreateKeys({
      refundPublicKey: refundHex,
      recipientPublicKey: recipientHex,
      btcAddressData,
      ...overrides,
    })
  const accepted = {
    ok: true,
    code: null,
    message: null,
    refundKey: { valid: true, hex: refundHex, isWallet: true },
    recipientKey: { valid: true, hex: recipientHex, isWallet: false },
  }

  it('accepts a refund key of the wallet and a valid recipient key', () => {
    expect(verify()).toEqual(accepted)
  })

  it('matches the refund key case-insensitively, on either address list', () => {
    expect(verify({ refundPublicKey: refundHex.toUpperCase() })).toEqual(
      accepted,
    )
    expect(
      verify({
        refundPublicKey: otherWalletHex,
        btcAddressData: {
          btcChangeAddresses: [{ bc1qc: { pubkey: otherWalletHex } }],
        },
      }),
    ).toEqual({
      ...accepted,
      refundKey: { valid: true, hex: otherWalletHex, isWallet: true },
    })
  })

  // The loss of funds: a refund key the dApp holds leaves the user with no
  // key that can recover the escrow after the lock time.
  it("refuses a valid refund key that is not one of the wallet's", () => {
    const foreignHex = hexOf(foreignKey.publicKey)
    const verdict = verify({ refundPublicKey: foreignHex })
    expect(verdict).toEqual({
      ok: false,
      code: HTLC_CREATE_KEY_CODES.REFUND_KEY_NOT_WALLET,
      message:
        'Refund key: not a key of this wallet. After the lock time, only the holder of that key could recover these funds.',
      refundKey: { valid: true, hex: foreignHex, isWallet: false },
      recipientKey: { valid: true, hex: recipientHex, isWallet: false },
    })
  })

  it('refuses an invalid refund key, naming it and why, before any membership check', () => {
    const verdict = verify({ refundPublicKey: `${refundHex.slice(0, -1)}` })
    expect(verdict).toEqual({
      ok: false,
      code: HTLC_CREATE_KEY_CODES.REFUND_KEY_INVALID,
      message:
        "Refund key: not a valid public key — its hex has an odd number of digits. The escrow's refund branch could never be spent, so these funds could never be recovered.",
      refundKey: {
        valid: false,
        hex: null,
        isWallet: null,
        reason: 'its hex has an odd number of digits',
      },
      recipientKey: { valid: true, hex: recipientHex, isWallet: false },
    })
  })

  it('refuses an invalid recipient key, naming it and why', () => {
    const verdict = verify({
      recipientPublicKey: `04${recipientHex.slice(2)}`,
    })
    expect(verdict).toMatchObject({
      ok: false,
      code: HTLC_CREATE_KEY_CODES.RECIPIENT_KEY_INVALID,
      refundKey: { valid: true, hex: refundHex, isWallet: true },
      recipientKey: { valid: false, hex: null, isWallet: null },
    })
    expect(verdict.message).toBe(
      "Recipient key: not a valid public key — it is 33 bytes starting 04, not 33 bytes starting 02 or 03. The escrow's claim branch could never be spent.",
    )
  })

  // A valid point, but an uncompressed one: no escrow script can carry it
  // (the address builder rejects a script holding it), so the verdict
  // refuses it by name instead of letting the address build fail.
  it.each([
    [
      'refundPublicKey',
      HTLC_CREATE_KEY_CODES.REFUND_KEY_INVALID,
      /^Refund key: not a valid public key — it is an uncompressed key, and the escrow script carries compressed keys only\. The escrow's refund branch could never be spent, so these funds could never be recovered\.$/,
    ],
    [
      'recipientPublicKey',
      HTLC_CREATE_KEY_CODES.RECIPIENT_KEY_INVALID,
      /^Recipient key: not a valid public key — it is an uncompressed key, and the escrow script carries compressed keys only\. The escrow's claim branch could never be spent\.$/,
    ],
  ])(
    'refuses an uncompressed %s, naming it and why',
    (field, code, message) => {
      const verdict = verify({ [field]: uncompressedHex })
      expect(verdict).toMatchObject({
        ok: false,
        code,
        [field === 'refundPublicKey' ? 'refundKey' : 'recipientKey']: {
          valid: false,
          hex: null,
          isWallet: null,
          reason:
            'it is an uncompressed key, and the escrow script carries compressed keys only',
        },
      })
      expect(verdict.message).toMatch(message)
    },
  )

  // Fail closed: without the wallet's public keys the refund key cannot
  // be checked, whatever it is. Both keys are still read, and neither is
  // called the wallet's or a foreign one: isWallet is null, "not checked",
  // for a valid key when the wallet's key set is empty.
  it.each([
    ['no address data', undefined],
    [
      'lists without public keys',
      { btcReceivingAddresses: [{ bc1qnokey: {} }], btcChangeAddresses: [] },
    ],
  ])('refuses everything when the wallet has %s', (_shape, data) => {
    const verdict = verify({ btcAddressData: data })
    expect(verdict).toEqual({
      ok: false,
      code: HTLC_CREATE_KEY_CODES.WALLET_KEYS_UNREADABLE,
      message:
        'The public keys of this wallet could not be read, so the refund key cannot be checked against them. If it is not a key of this wallet, after the lock time only the holder of that key could recover these funds.',
      refundKey: { valid: true, hex: refundHex, isWallet: null },
      recipientKey: { valid: true, hex: recipientHex, isWallet: null },
    })
  })

  it('reads an invalid key as invalid, not as unchecked, when the wallet has no public keys', () => {
    expect(
      verify({ refundPublicKey: 'zz', btcAddressData: undefined }),
    ).toEqual({
      ok: false,
      code: HTLC_CREATE_KEY_CODES.REFUND_KEY_INVALID,
      message:
        "Refund key: not a valid public key — it contains characters that are not hex digits. The escrow's refund branch could never be spent, so these funds could never be recovered.",
      refundKey: {
        valid: false,
        hex: null,
        isWallet: null,
        reason: 'it contains characters that are not hex digits',
      },
      recipientKey: { valid: true, hex: recipientHex, isWallet: null },
    })
  })

  it("accepts a recipient key that happens to be one of the wallet's own keys", () => {
    expect(verify({ recipientPublicKey: refundHex })).toEqual({
      ...accepted,
      recipientKey: { valid: true, hex: refundHex, isWallet: true },
    })
  })
})

describe('findWalletKeyForRedeemScript', () => {
  it('finds the stored WIF when the SPEND branch binds one of our pubkeys', () => {
    const keyInfo = findWalletKeyForRedeemScript({
      redeemScriptHex: ourScriptHex,
      btcAddressData: addressData,
      btcHDWallet: root,
      branch: 'spend',
    })

    expect(keyInfo).toEqual({
      wif: ourChild.toWIF(),
      address: 'bc1qours',
      derivationPath: "m/84'/0'/0'/0/0",
    })
  })

  it('finds the stored WIF when the REFUND branch binds one of our pubkeys', () => {
    const keyInfo = findWalletKeyForRedeemScript({
      redeemScriptHex: ourRefundBranchScriptHex,
      btcAddressData: addressData,
      btcHDWallet: root,
      branch: 'refund',
    })

    expect(keyInfo.wif).toBe(ourChild.toWIF())
  })

  it('refuses our key when it sits only on the other branch', () => {
    // our key behind the timelock only: not the key a claim signs with
    expect(
      findWalletKeyForRedeemScript({
        redeemScriptHex: ourRefundBranchScriptHex,
        btcAddressData: addressData,
        btcHDWallet: root,
        branch: 'spend',
      }),
    ).toBeNull()
    // our key on the secret branch only: not the key a refund signs with
    expect(
      findWalletKeyForRedeemScript({
        redeemScriptHex: ourScriptHex,
        btcAddressData: addressData,
        btcHDWallet: root,
        branch: 'refund',
      }),
    ).toBeNull()
  })

  it('refuses when no branch is named', () => {
    expect(
      findWalletKeyForRedeemScript({
        redeemScriptHex: ourScriptHex,
        btcAddressData: addressData,
        btcHDWallet: root,
      }),
    ).toBeNull()
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
      branch: 'spend',
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
      branch: 'spend',
    })

    expect(keyInfo.wif).toBe(ourChild.toWIF())
  })

  it('returns null when the branch binds only foreign keys', () => {
    const keyInfo = findWalletKeyForRedeemScript({
      redeemScriptHex: foreignScriptHex,
      btcAddressData: addressData,
      btcHDWallet: root,
      branch: 'spend',
    })

    expect(keyInfo).toBeNull()
  })

  it('returns null for malformed input', () => {
    expect(
      findWalletKeyForRedeemScript({
        redeemScriptHex: 'zzzz',
        btcAddressData: addressData,
        btcHDWallet: root,
        branch: 'spend',
      }),
    ).toBeNull()
    expect(
      findWalletKeyForRedeemScript({
        redeemScriptHex: undefined,
        btcAddressData: addressData,
        btcHDWallet: root,
        branch: 'spend',
      }),
    ).toBeNull()
  })
})

describe('verifyHtlcOutpoint — the output on chain', () => {
  const txid = 'a'.repeat(64)
  const utxo = { txid, vout: 0, value: 2000 }
  const p2wshHex = (redeemScriptHex) =>
    Buffer.from(
      bitcoin.payments.p2wsh({
        redeem: { output: u8(Buffer.from(redeemScriptHex, 'hex')) },
      }).output,
    ).toString('hex')
  // An Esplora-style /tx/:txid answer; confirmed unless stated otherwise
  // (null = no status object at all).
  const chainTransaction = (outputs, id = txid, confirmed = true) =>
    JSON.stringify({
      txid: id,
      vin: [],
      vout: outputs,
      ...(confirmed === null ? {} : { status: { confirmed } }),
    })
  const chainOutput = (scriptPubKeyHex, value) => ({
    scriptpubkey: scriptPubKeyHex,
    value,
  })
  // An Esplora-style /tx/:txid/outspend/:vout answer
  const chainOutspend = (spent) => JSON.stringify({ spent })

  beforeEach(() => {
    jest.clearAllMocks()
    // the output is unspent unless a case says otherwise
    Electrum.getOutspend.mockResolvedValue(chainOutspend(false))
  })

  it('returns the confirmed, unspent output the chain holds for the script and value the request names', async () => {
    Electrum.getTransactionData.mockResolvedValue(
      chainTransaction([
        chainOutput('0020' + '0'.repeat(64), 1),
        chainOutput(p2wshHex(ourScriptHex), 2000),
      ]),
    )

    await expect(
      verifyHtlcOutpoint({
        networkType: 'testnet',
        utxo: { ...utxo, vout: 1, value: '2000' },
        redeemScriptHex: ourScriptHex,
      }),
    ).resolves.toEqual({
      txid,
      vout: 1,
      value: 2000n,
      scriptPubKeyHex: p2wshHex(ourScriptHex),
    })
    expect(Electrum.getTransactionData).toHaveBeenCalledWith(txid)
    expect(Electrum.getOutspend).toHaveBeenCalledWith(txid, 1)
  })

  it.each([
    [
      'the transaction is not found',
      new Error('Request not successful'),
      /could not be looked up on chain/,
    ],
    ['the answer is not JSON', 'not json', /could not be looked up on chain/],
    [
      'the answer is a different transaction',
      chainTransaction(
        [chainOutput(p2wshHex(ourScriptHex), 2000)],
        'b'.repeat(64),
      ),
      /different transaction/,
    ],
    [
      'the transaction is unconfirmed',
      chainTransaction(
        [chainOutput(p2wshHex(ourScriptHex), 2000)],
        txid,
        false,
      ),
      /not confirmed on chain yet/,
    ],
    [
      'the answer carries no status',
      chainTransaction([chainOutput(p2wshHex(ourScriptHex), 2000)], txid, null),
      /not confirmed on chain yet/,
    ],
    [
      'the output at the index does not exist',
      chainTransaction([]),
      /does not exist on chain/,
    ],
    [
      'the output is locked to another script',
      chainTransaction([chainOutput(p2wshHex(foreignScriptHex), 2000)]),
      /not locked to this HTLC script/,
    ],
    [
      'the output holds another amount',
      chainTransaction([chainOutput(p2wshHex(ourScriptHex), 1999)]),
      /different amount on chain/,
    ],
    [
      'the output value is unreadable',
      chainTransaction([chainOutput(p2wshHex(ourScriptHex), '2.5')]),
      /different amount on chain/,
    ],
  ])('refuses, fail closed, when %s', async (_description, answer, error) => {
    if (answer instanceof Error) {
      Electrum.getTransactionData.mockRejectedValue(answer)
    } else {
      Electrum.getTransactionData.mockResolvedValue(answer)
    }

    await expect(
      verifyHtlcOutpoint({ utxo, redeemScriptHex: ourScriptHex }),
    ).rejects.toMatchObject({
      code: 'HTLC_OUTPOINT_UNVERIFIED',
      message: expect.stringMatching(error),
    })
  })

  it.each([
    [
      'the output is already spent',
      () => Electrum.getOutspend.mockResolvedValue(chainOutspend(true)),
      /already been spent on chain/,
    ],
    [
      'the spend status has no spent flag',
      () => Electrum.getOutspend.mockResolvedValue('{}'),
      /spend status of the HTLC output could not be read/,
    ],
    [
      'the spend status is not JSON',
      () => Electrum.getOutspend.mockResolvedValue('not json'),
      /spend status of the HTLC output could not be looked up on chain/,
    ],
    [
      'the spend status lookup fails',
      () => Electrum.getOutspend.mockRejectedValue(new Error('network down')),
      /spend status of the HTLC output could not be looked up on chain/,
    ],
  ])('refuses, fail closed, when %s', async (_description, arrange, error) => {
    Electrum.getTransactionData.mockResolvedValue(
      chainTransaction([chainOutput(p2wshHex(ourScriptHex), 2000)]),
    )
    arrange()

    await expect(
      verifyHtlcOutpoint({ utxo, redeemScriptHex: ourScriptHex }),
    ).rejects.toMatchObject({
      code: 'HTLC_OUTPOINT_UNVERIFIED',
      message: expect.stringMatching(error),
    })
  })

  it.each([
    ['a malformed txid', { ...utxo, txid: 'abc' }, ourScriptHex],
    ['a negative vout', { ...utxo, vout: -1 }, ourScriptHex],
    ['a non-integer vout', { ...utxo, vout: 0.5 }, ourScriptHex],
    ['an unreadable value', { ...utxo, value: '2.5' }, ourScriptHex],
    ['a non-hex script', utxo, 'not-hex'],
    ['an odd-length script', utxo, ourScriptHex.slice(0, -1)],
  ])(
    'refuses %s before any lookup',
    async (_description, utxo_, redeemScriptHex) => {
      await expect(
        verifyHtlcOutpoint({ utxo: utxo_, redeemScriptHex }),
      ).rejects.toThrow()
      expect(Electrum.getTransactionData).not.toHaveBeenCalled()
      expect(Electrum.getOutspend).not.toHaveBeenCalled()
    },
  )

  it('does not ask for the spend status before the output itself is verified', async () => {
    Electrum.getTransactionData.mockResolvedValue(chainTransaction([]))

    await expect(
      verifyHtlcOutpoint({ utxo, redeemScriptHex: ourScriptHex }),
    ).rejects.toThrow(/does not exist on chain/)
    expect(Electrum.getOutspend).not.toHaveBeenCalled()
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
      buildHtlcClaimTx({ ...base, utxo: { ...base.utxo, value: '2.5' } }),
    ).rejects.toThrow('Invalid UTXO: value must be a positive integer')
    await expect(
      buildHtlcClaimTx({ ...base, utxo: { ...base.utxo, value: 0 } }),
    ).rejects.toThrow('Invalid UTXO: value must be a positive integer')
    // Numbers >= 2^53 are rounded before this code runs (lossy JSON), so
    // they must be rejected instead of signed with a wrong amount.
    await expect(
      buildHtlcClaimTx({ ...base, utxo: { ...base.utxo, value: 2 ** 53 } }),
    ).rejects.toThrow('Invalid UTXO: value must be a positive integer')
    // Above consensus MAX_MONEY no utxo can exist on-chain.
    await expect(
      buildHtlcClaimTx({
        ...base,
        utxo: { ...base.utxo, value: '2100000000000001' },
      }),
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

describe('buildHtlcClaimTx — psbt construction (BigInt witness utxos)', () => {
  const claimScriptHex = compileHtlc(claimSigner.publicKey, foreignPubkey, 100)
  const utxo = { txid: 'f'.repeat(64), vout: 0, value: 2000 }
  const base = {
    networkType: 'testnet',
    utxo,
    toAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    wif: claimSignerWif,
    redeemScriptHex: claimScriptHex,
    secretHex: 'a'.repeat(64),
  }

  it('builds a signed claim transaction from a Number utxo value', async () => {
    const hex = await buildHtlcClaimTx(base)
    const tx = bitcoin.Transaction.fromHex(hex)

    expect(tx.ins).toHaveLength(1)
    expect(Buffer.from(tx.ins[0].hash).reverse().toString('hex')).toBe(
      utxo.txid,
    )
    expect(tx.ins[0].index).toBe(0)

    // claim output = input value − fixed claim fee
    expect(tx.outs).toHaveLength(1)
    expect(tx.outs[0].value).toBe(
      BigInt(utxo.value) - BigInt(HTLC_CLAIM_FEE_SATOSHIS),
    )

    // OP_IF claim witness: [signature, secret, OP_1, witness script]
    const witness = tx.ins[0].witness
    expect(witness).toHaveLength(4)
    expect(Buffer.from(witness[1]).toString('hex')).toBe(base.secretHex)
    expect(Array.from(witness[2])).toEqual([0x01])
    expect(Buffer.from(witness[3]).toString('hex')).toBe(claimScriptHex)
  })

  it('keeps satoshi exactness at the MAX_MONEY boundary (exact string source)', async () => {
    // Consensus MAX_MONEY — the largest utxo value that can exist on-chain;
    // it must be spent as the exact BigInt, not a float approximation.
    const maxMoneySat = '2100000000000000'
    const hex = await buildHtlcClaimTx({
      ...base,
      utxo: { ...utxo, value: maxMoneySat },
    })
    const tx = bitcoin.Transaction.fromHex(hex)

    expect(tx.outs[0].value).toBe(
      BigInt(maxMoneySat) - BigInt(HTLC_CLAIM_FEE_SATOSHIS),
    )
    expect(tx.outs[0].value).toBe(
      2100000000000000n - BigInt(HTLC_CLAIM_FEE_SATOSHIS),
    )
  })

  it('accepts a BigInt utxo value', async () => {
    const hex = await buildHtlcClaimTx({
      ...base,
      utxo: { ...utxo, value: 2000n },
    })
    const tx = bitcoin.Transaction.fromHex(hex)
    expect(tx.outs[0].value).toBe(2000n - BigInt(HTLC_CLAIM_FEE_SATOSHIS))
  })
})

describe('buildHtlcRefundTx — psbt construction (BigInt witness utxos)', () => {
  // refund binds the sender (timelock) branch of the script
  const refundScriptHex = compileHtlc(foreignPubkey, claimSigner.publicKey, 100)
  const utxo = { txid: 'e'.repeat(64), vout: 0, value: 2500 }
  const base = {
    networkType: 'testnet',
    utxo,
    toAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    wif: claimSignerWif,
    redeemScriptHex: refundScriptHex,
  }

  it('builds a version-2 refund with the CSV sequence and fixed fee', async () => {
    const hex = await buildHtlcRefundTx(base)
    const tx = bitcoin.Transaction.fromHex(hex)

    expect(tx.version).toBe(2)
    expect(tx.ins).toHaveLength(1)
    expect(tx.ins[0].sequence).toBe(100)

    // refund output = input value − fixed refund fee
    expect(tx.outs).toHaveLength(1)
    expect(tx.outs[0].value).toBe(
      BigInt(utxo.value) - BigInt(HTLC_REFUND_FEE_SATOSHIS),
    )

    // refund witness: [signature, empty (OP_FALSE), witness script]
    const witness = tx.ins[0].witness
    expect(witness).toHaveLength(3)
    expect(witness[1]).toHaveLength(0)
    expect(Buffer.from(witness[2]).toString('hex')).toBe(refundScriptHex)
  })

  it('keeps satoshi exactness at the MAX_MONEY boundary (exact string source)', async () => {
    const maxMoneySat = '2100000000000000'
    const hex = await buildHtlcRefundTx({
      ...base,
      utxo: { ...utxo, value: maxMoneySat },
    })
    const tx = bitcoin.Transaction.fromHex(hex)
    expect(tx.outs[0].value).toBe(
      BigInt(maxMoneySat) - BigInt(HTLC_REFUND_FEE_SATOSHIS),
    )
  })

  it('rejects an odd-length redeem script (hex decode would truncate)', async () => {
    await expect(
      buildHtlcRefundTx({
        ...base,
        redeemScriptHex: refundScriptHex.slice(0, -1),
      }),
    ).rejects.toThrow('Invalid redeemScriptHex')
  })

  it('rejects a missing, non-integer or fee-devouring utxo value', async () => {
    await expect(
      buildHtlcRefundTx({ ...base, utxo: { txid: utxo.txid, vout: 0 } }),
    ).rejects.toThrow('Invalid UTXO: value must be a positive integer')
    await expect(
      buildHtlcRefundTx({ ...base, utxo: { ...utxo, value: '2.5' } }),
    ).rejects.toThrow('Invalid UTXO: value must be a positive integer')
    await expect(
      buildHtlcRefundTx({
        ...base,
        utxo: { ...utxo, value: HTLC_REFUND_FEE_SATOSHIS },
      }),
    ).rejects.toThrow('UTXO amount too low to cover fee')
  })
})

describe('toSatoshiBigInt — the dApp value trust boundary', () => {
  it.each([
    ['0x10', 'hex literal'],
    ['1e3', 'exponent notation'],
    [' 5', 'leading whitespace'],
    ['+1', 'explicit sign'],
    ['-1', 'negative'],
    ['2100000000000001', 'one sat above MAX_MONEY'],
    ['9223372036854775808', 'int64 overflow'],
  ])('rejects %p (%s)', (raw) => {
    expect(() => toSatoshiBigInt(raw)).toThrow(
      'Invalid UTXO: value must be a positive integer',
    )
  })

  it.each([
    ['007', 7n],
    ['2100000000000000', 2100000000000000n],
  ])(
    'accepts %p exactly as %p (leading digits, MAX_MONEY bound)',
    (raw, expected) => {
      expect(toSatoshiBigInt(raw)).toBe(expected)
    },
  )
})

describe('buildHtlcClaimTx / buildHtlcRefundTx — network binding', () => {
  // Deterministic MAINNET signer: a mainnet WIF carries the 0x80 version
  // byte, so these fixtures fail closed unless the caller's networkType
  // string actually reaches the sink — the psbt is pinned to
  // bitcoin.networks[networkType] by it, never by a Mintlayer enum number.
  const mainnetSigner = ECPair.makeRandom({
    network: ecpairNetworks.mainnet,
    rng: (size) => new Uint8Array(size).fill(11),
  })
  const mainnetWif = mainnetSigner.toWIF()
  // BIP173 mainnet P2WPKH test vector address.
  const mainnetDest = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
  const mainnetClaimScriptHex = compileHtlc(
    mainnetSigner.publicKey,
    foreignPubkey,
    100,
  )
  const mainnetRefundScriptHex = compileHtlc(
    foreignPubkey,
    mainnetSigner.publicKey,
    100,
  )

  it('builds a mainnet claim that pays the mainnet bc1 destination', async () => {
    const hex = await buildHtlcClaimTx({
      networkType: 'mainnet',
      utxo: { txid: 'a'.repeat(64), vout: 0, value: 2000 },
      toAddress: mainnetDest,
      wif: mainnetWif,
      redeemScriptHex: mainnetClaimScriptHex,
      secretHex: 'a'.repeat(64),
    })
    const tx = bitcoin.Transaction.fromHex(hex)

    expect(tx.outs).toHaveLength(1)
    expect(Buffer.from(tx.outs[0].script)).toEqual(
      Buffer.from(
        bitcoin.address.toOutputScript(mainnetDest, bitcoin.networks.mainnet),
      ),
    )
    expect(tx.outs[0].value).toBe(2000n - BigInt(HTLC_CLAIM_FEE_SATOSHIS))
    expect(tx.ins[0].witness).toHaveLength(4)
  })

  it('builds a mainnet refund that pays the mainnet bc1 destination', async () => {
    const hex = await buildHtlcRefundTx({
      networkType: 'mainnet',
      utxo: { txid: 'b'.repeat(64), vout: 0, value: 2500 },
      toAddress: mainnetDest,
      wif: mainnetWif,
      redeemScriptHex: mainnetRefundScriptHex,
    })
    const tx = bitcoin.Transaction.fromHex(hex)

    expect(tx.version).toBe(2)
    expect(tx.outs).toHaveLength(1)
    expect(Buffer.from(tx.outs[0].script)).toEqual(
      Buffer.from(
        bitcoin.address.toOutputScript(mainnetDest, bitcoin.networks.mainnet),
      ),
    )
    expect(tx.outs[0].value).toBe(2500n - BigInt(HTLC_REFUND_FEE_SATOSHIS))
  })

  it('fails closed when mainnet material is signed under a testnet pin (missing or explicit testnet networkType)', async () => {
    const mainnetClaimRequest = {
      utxo: { txid: 'a'.repeat(64), vout: 0, value: 2000 },
      toAddress: mainnetDest,
      wif: mainnetWif,
      redeemScriptHex: mainnetClaimScriptHex,
      secretHex: 'a'.repeat(64),
    }

    // networkType dropped (what the page's enum-vs-string bug did) →
    // 'testnet' default → mainnet address rejected.
    await expect(buildHtlcClaimTx(mainnetClaimRequest)).rejects.toThrow()

    // Explicitly pinned to the wrong Bitcoin network fails closed too.
    await expect(
      buildHtlcClaimTx({
        ...mainnetClaimRequest,
        networkType: 'testnet',
      }),
    ).rejects.toThrow()

    // Testnet material under an explicit mainnet pin fails closed the
    // same way — the parameter genuinely selects the network.
    await expect(
      buildHtlcClaimTx({
        networkType: 'mainnet',
        utxo: { txid: 'a'.repeat(64), vout: 0, value: 2000 },
        toAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        wif: claimSignerWif,
        redeemScriptHex: compileHtlc(claimSigner.publicKey, foreignPubkey, 100),
        secretHex: 'a'.repeat(64),
      }),
    ).rejects.toThrow()
  })
})
