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
            timeoutBlocks: '4',
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
              txid: 'f12a6ee1ebbbf597c456af4011d90bb83ada5c6ef4d9e16eee0e5eeec9d753dc',
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
              '63a914e62cab42e999a96cd5ef5a429b4bedf456c55a718821027b87bd06d549c49e3809adacefc62ea8beec177c32aeffaf5c00ac04ffd007496754b27521023cf249c6c8927d7db3a6537f1ca2c95a8b707a376243218a16a3048ebb07d88068ac',
            to: 'tb1qz5e8eqw4r960nz5xjcw0fvek3xfcyhn32gdksg',
          },
        },
      },
    },
  },
  refundHtlc: {
    request: {
      data: {
        txData: {
          JSONRepresentation: {
            type: 'refundHtlc',
            utxo: {
              txid: '57c7cd5a7148c6231fdb422b753e46d1e08410d85d391945addcc7cd4db2d8dc',
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
              '63a914e62cab42e999a96cd5ef5a429b4bedf456c55a718821027b87bd06d549c49e3809adacefc62ea8beec177c32aeffaf5c00ac04ffd007496754b27521023cf249c6c8927d7db3a6537f1ca2c95a8b707a376243218a16a3048ebb07d88068ac',
            to: 'tb1qnqccvk59tspedgyunz258xjprs2vmndax5mcrv',
          },
        },
      },
    },
  },
}
