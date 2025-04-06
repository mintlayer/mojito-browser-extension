export const MOCKS = {
  transfer: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'cd86fa3aa7b141691feb87f892ede669f5bb59bd32778874c901d56943156743',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qy2dxl0nhtgv02dxljzrlknwg8skr8a3xccpmtqx',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1902977911700428',
                      decimal: '19029.77911700428',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q8jpdd7e6yfzx44pjdkgtpz2y3tql4dmzu5a34wu',
                type: 'Transfer',
                value: {
                  amount: { atoms: 1000000000000, decimal: '10' },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1901827911700428',
                    decimal: '19018.27911700428',
                  },
                  type: 'Coin',
                },
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  tokensmint: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  amount: {
                    atoms: '1000000000',
                    decimal: '10',
                  },
                  command: 'MintTokens',
                  input_type: 'AccountCommand',
                  nonce: 2,
                  authority: 'tmt1qyjlh9w9t7qwx7cawlqz6rqwapflsvm3dulgmxyx',
                  token_id:
                    'tmltk1jzgup986mh3x9n5024svm4wtuf2qp5vedlgy5632wah0pjffwhpqgsvmuq',
                },
                utxo: null,
              },
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'c4b5ad06ce2d8f0663508ef8db4c4e0e23d2b5eaeeb3da5ecbe5c9ab1b7c2dee',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1901627911700428',
                      decimal: '19016.27911700428',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q9q4gk90m5wmcjphvrnvefc750pfx0cagqwxwwxl',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk1jzgup986mh3x9n5024svm4wtuf2qp5vedlgy5632wah0pjffwhpqgsvmuq',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1890077911700428',
                    decimal: '18900.77911700428',
                  },
                  type: 'Coin',
                },
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  tokensmint_with_lock: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  amount: {
                    atoms: '4000000000',
                    decimal: '40',
                  },
                  command: 'MintTokens',
                  input_type: 'AccountCommand',
                  nonce: 5,
                  authority: 'tmt1qyjlh9w9t7qwx7cawlqz6rqwapflsvm3dulgmxyx',
                  token_id:
                    'tmltk1jzgup986mh3x9n5024svm4wtuf2qp5vedlgy5632wah0pjffwhpqgsvmuq',
                },
                utxo: null,
              },
              {
                input: {
                  index: 2,
                  input_type: 'UTXO',
                  source_id:
                    '5e842a9ac0203cd89ece59438f0134ed99e1f3c52b1edfaf563f9ef5a0b08851',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1878077911700428',
                      decimal: '18780.77911700428',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q9q4gk90m5wmcjphvrnvefc750pfx0cagqwxwwxl',
                type: 'LockThenTransfer',
                lock: {
                  type: 'ForBlockCount',
                  content: '100',
                },
                value: {
                  amount: {
                    atoms: '1000000000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk1jzgup986mh3x9n5024svm4wtuf2qp5vedlgy5632wah0pjffwhpqgsvmuq',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1q9092r369lp4vl4glxdec7lu56s47uy96uydmmel',
                type: 'LockThenTransfer',
                lock: {
                  type: 'ForBlockCount',
                  content: '100',
                },
                value: {
                  amount: {
                    atoms: '1000000000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk1jzgup986mh3x9n5024svm4wtuf2qp5vedlgy5632wah0pjffwhpqgsvmuq',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1q9q4gk90m5wmcjphvrnvefc750pfx0cagqwxwwxl',
                type: 'LockThenTransfer',
                lock: {
                  type: 'ForBlockCount',
                  content: '200',
                },
                value: {
                  amount: {
                    atoms: '1000000000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk1jzgup986mh3x9n5024svm4wtuf2qp5vedlgy5632wah0pjffwhpqgsvmuq',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1q9092r369lp4vl4glxdec7lu56s47uy96uydmmel',
                type: 'LockThenTransfer',
                lock: {
                  type: 'ForBlockCount',
                  content: '200',
                },
                value: {
                  amount: {
                    atoms: '1000000000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk1jzgup986mh3x9n5024svm4wtuf2qp5vedlgy5632wah0pjffwhpqgsvmuq',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1872077911700428',
                    decimal: '18720.77911700428',
                  },
                  type: 'Coin',
                },
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  issuetoken: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'cd86fa3aa7b141691feb87f892ede669f5bb59bd32778874c901d56943156743',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qy2dxl0nhtgv02dxljzrlknwg8skr8a3xccpmtqx',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1902977911700428',
                      decimal: '19029.77911700428',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                authority: 'tmt1q9dpdwc7cnt26qu9syx5emswpmc6gjeh7uj94x4a',
                is_freezable: false,
                metadata_uri: {
                  hex: '68747470733a2f2f6578616d706c652e636f6d2f646174612e6a736f6e',
                  string: 'https://example.com/data.json',
                },
                number_of_decimals: 8,
                token_ticker: {
                  hex: '4c4c4c',
                  string: 'LLL',
                },
                total_supply: {
                  type: 'Unlimited',
                },
                type: 'IssueFungibleToken',
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1902827911700428',
                    decimal: '19028.27911700428',
                  },
                  type: 'Coin',
                },
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  issuetoken_fixed: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'cd86fa3aa7b141691feb87f892ede669f5bb59bd32778874c901d56943156743',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qy2dxl0nhtgv02dxljzrlknwg8skr8a3xccpmtqx',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1902977911700428',
                      decimal: '19029.77911700428',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                authority: 'tmt1qy9l2pvaz84z60uvlggcy5ttxdvw825uhsxeaxc5',
                is_freezable: true,
                metadata_uri: {
                  hex: '687474703a2f2f6578616d706c652e636f6d',
                  string: 'http://example.com',
                },
                number_of_decimals: '8',
                token_ticker: {
                  hex: '5050504c',
                  string: 'PPPL',
                },
                total_supply: {
                  amount: {
                    atoms: '100000000000',
                    decimal: '1000',
                  },
                  type: 'Fixed',
                },
                type: 'IssueFungibleToken',
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1902827911700428',
                    decimal: '19028.27911700428',
                  },
                  type: 'Coin',
                },
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  createorder: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'ba0f238f74feac6d65c888469ebd3cf41195308e65cc9551032de41727b6648f',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1884769204300000',
                      decimal: '18847.692043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                ask_balance: {
                  atoms: 1000000000000,
                  decimal: '10',
                },
                ask_currency: {
                  type: 'Coin',
                },
                conclude_destination:
                  'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                give_balance: {
                  atoms: '1000000000000',
                  decimal: '10',
                },
                give_currency: {
                  token_id:
                    'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530',
                  type: 'Token',
                },
                initially_asked: {
                  atoms: '1000000000000',
                  decimal: '10',
                },
                initially_given: {
                  atoms: '1000000000000',
                  decimal: '10',
                },
                type: 'CreateOrder',
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1881619204300000',
                    decimal: '18816.192043',
                  },
                  type: 'Coin',
                },
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  fillorder: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  command: 'FillOrder',
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  fill_atoms: '1000000000000',
                  input_type: 'AccountCommand',
                  nonce: '0',
                  order_id:
                    'tordr1vz77jslw082ahk6n0h3nxzaklez7pyxkrlj6j0hy6ck9ykhzzw7sx3uaxn',
                },
                utxo: null,
              },
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'c4b5ad06ce2d8f0663508ef8db4c4e0e23d2b5eaeeb3da5ecbe5c9ab1b7c2dee',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1901627911700428',
                      decimal: '19016.27911700428',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1901477911700428',
                    decimal: '19014.77911700428',
                  },
                  type: 'Coin',
                },
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  concludeorder: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  destination: 'tmt1qxfacpkjnuzsvjcp0ynsd3zh2z5ve28hn504e2dm',
                  nonce: 0,
                  order_id:
                    'tordr1hy0l3z7yvuy2qrk4p9wkxsladukzuvjac728kumq9j22r9luzz5qyvnp7t',
                  type: 'ConcludeOrder',
                },
                utxo: null,
              },
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'c4b5ad06ce2d8f0663508ef8db4c4e0e23d2b5eaeeb3da5ecbe5c9ab1b7c2dee',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1901627911700428',
                      decimal: '19016.27911700428',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: null,
                  },
                  type: 'Coin',
                },
              },
              {
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: null,
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1901477911700428',
                    decimal: '19014.77911700428',
                  },
                  type: 'Coin',
                },
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
}
