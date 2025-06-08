export const MOCKS = {
  createHtlc: {
    request: {
      data: {
        txData: {
          JSONRepresentation: {
            amount: '1000',
            recipientPublicKey:
              '027b87bd06d549c49e3809adacefc62ea8beec177c32aeffaf5c00ac04ffd00749',
            refundPublicKey:
              '023cf249c6c8927d7db3a6537f1ca2c95a8b707a376243218a16a3048ebb07d880',
            secretHash:
              '{"secret_hash_hex":"e62cab42e999a96cd5ef5a429b4bedf456c55a71"}',
            timeoutBlocks: '144',
          },
        },
      },
    },
  },
  spendHtlc: {
    request: {
      data: {
        txData: {
          JSONRepresentation: {
            type: 'spendHtlc',
            utxo: {
              txid: '4829e08cade16f88213884749c76d95374e8e0b12ed8ab64d8439b0cf590d249',
              vout: 0,
              status: {
                confirmed: true,
                block_height: 4579068,
                block_hash:
                  '0000000003550c7c73063c93bdc2c181c712834bdf7586ec62b88b013698d4d7',
                block_time: 1753399088,
              },
              value: 1000,
            },
            redeemScriptHex:
              '63a914e62cab42e999a96cd5ef5a429b4bedf456c55a718821027b87bd06d549c49e3809adacefc62ea8beec177c32aeffaf5c00ac04ffd007496700b27521023cf249c6c8927d7db3a6537f1ca2c95a8b707a376243218a16a3048ebb07d88068ac',
            to: 'tb1qz5e8eqw4r960nz5xjcw0fvek3xfcyhn32gdksg',
          },
        },
      },
    },
  },
}
