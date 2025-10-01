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
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1707148604300000',
                      decimal: '17071.486043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q8hmm58xyscp0q8yh8r7q2zmkfc5cfmzeu5k0phq',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1705948604300000',
                    decimal: '17059.486043',
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
  transfer_token: {
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
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1707148604300000',
                      decimal: '17071.486043',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 2,
                  input_type: 'UTXO',
                  source_id:
                    '3ac01a6e57a89b594857b1b9b9bd6a2e54bc0b52f01707a27e8440857c20ea71',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qylwcqnt5p0kajj6rnwa8fvrtqgf4jcvaun5h7h8',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '91400',
                      decimal: '914',
                    },
                    token_id:
                      'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530',
                    type: 'TokenV1',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1qy9987wg35ehqm4r0t5mr8p7z0v6y8ul4sp7yl6q',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1706948604300000',
                    decimal: '17069.486043',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '441300768',
                    decimal: '4.41300768',
                  },
                  token_id:
                    'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530',
                  type: 'TokenV1',
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
  bridge_request: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          intent: '0x12312312312312312312312313',
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1707148604300000',
                      decimal: '17071.486043',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 2,
                  input_type: 'UTXO',
                  source_id:
                    '3ac01a6e57a89b594857b1b9b9bd6a2e54bc0b52f01707a27e8440857c20ea71',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qylwcqnt5p0kajj6rnwa8fvrtqgf4jcvaun5h7h8',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '91400',
                      decimal: '914',
                    },
                    token_id:
                      'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530',
                    type: 'TokenV1',
                  },
                },
              },
            ],
            outputs: [
              {
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1706748604300000',
                    decimal: '17067.486043',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '90400',
                    decimal: '904',
                  },
                  token_id:
                    'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530',
                  type: 'TokenV1',
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
  tokens_mint: {
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
  tokensunmint: {
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
                    atoms: '10000000000000',
                    decimal: '100',
                  },
                  authority: 'tmt1qyjlh9w9t7qwx7cawlqz6rqwapflsvm3dulgmxyx',
                  command: 'UnmintTokens',
                  input_type: 'AccountCommand',
                  nonce: 6,
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
                    '2868b6a5384e62c0040c58276ae650c8c59ea1c0fe5a3f291b7f1986a3a45250',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1789748604300000',
                      decimal: '17897.486043',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    'cd86fa3aa7b141691feb87f892ede669f5bb59bd32778874c901d56943156743',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qyjlh9w9t7qwx7cawlqz6rqwapflsvm3dulgmxyx',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '100000000000',
                      decimal: '1000',
                    },
                    token_id:
                      'tmltk1jzgup986mh3x9n5024svm4wtuf2qp5vedlgy5632wah0pjffwhpqgsvmuq',
                    type: 'TokenV1',
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
                    atoms: '1774148604300000',
                    decimal: '17741.486043',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '99500000000',
                    decimal: '995',
                  },
                  token_id:
                    'tmltk1jzgup986mh3x9n5024svm4wtuf2qp5vedlgy5632wah0pjffwhpqgsvmuq',
                  type: 'TokenV1',
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
                  command: 'ConcludeOrder',
                  destination: 'tmt1qxf50ffxunjw557a9zf2et0vywkwjszyxyppa0py',
                  input_type: 'AccountCommand',
                  nonce: 1,
                  order_id:
                    'tordr1thu5ykcdl0uj30g97wqkam7kart50lgzaq60edh8nq6zrn366lmql50gnu',
                },
                utxo: null,
              },
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    '0b9844f148f6ce71f0ec3741b9ed40ba1a709f1bdf2dc3144ff31d7b49c9be07',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1701905604300000',
                      decimal: '17019.056043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1qxf50ffxunjw557a9zf2et0vywkwjszyxyppa0py',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '900000000000',
                    decimal: '9',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxf50ffxunjw557a9zf2et0vywkwjszyxyppa0py',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk17jgtcm3gc8fne3su8s96gwj0yw8k2khx3fglfe8mz72jhygemgnqm57l7l',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1701705604300000',
                    decimal: '17017.056043',
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
  burnCoin: {
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
                    '8dbe2ac78ab6ab2648babb5f970994384ba639f6be84ff84a24a0e3490f00fac',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1q832erm9ta8vwvs08qrvdj480ddquex80qfvkn8d',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1791948604300000',
                      decimal: '17919.486043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                type: 'BurnToken',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1790348604300000',
                    decimal: '17903.486043',
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
  burnToken: {
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
                    '2868b6a5384e62c0040c58276ae650c8c59ea1c0fe5a3f291b7f1986a3a45250',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1789748604300000',
                      decimal: '17897.486043',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '0da4ad912602b87fe0ae40691ddc075e6e3cdd1891724456ab9a44490dc3f69b',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qy9l2pvaz84z60uvlggcy5ttxdvw825uhsxeaxc5',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '10000000000000',
                      decimal: '100',
                    },
                    token_id:
                      'tmltk16u754a6su60wd3tra669a3gt0su79zehqeavu4ffgrnjzgaedasqtfurcu',
                    type: 'TokenV1',
                  },
                },
              },
            ],
            outputs: [
              {
                type: 'BurnToken',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk16u754a6su60wd3tra669a3gt0su79zehqeavu4ffgrnjzgaedasqtfurcu',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1789148604300000',
                    decimal: '17891.486043',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '9000000000000',
                    decimal: '90',
                  },
                  token_id:
                    'tmltk16u754a6su60wd3tra669a3gt0su79zehqeavu4ffgrnjzgaedasqtfurcu',
                  type: 'TokenV1',
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
  lockTokenSupply: {
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
                  authority: 'tmt1qxn502fssxk8e3wpn7h24avw2anwr8y7rgdsqmle',
                  command: 'LockTokenSupply',
                  input_type: 'AccountCommand',
                  nonce: 0,
                  token_id:
                    'tmltk1n569zrcce0njma7cehpatyc8nqg3kqy7fx9sqyl9cuw6spg3je9qspqh35',
                },
                utxo: null,
              },
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'ca1ce85c5ef7e987d098832a367562ecfa5c08b6c681e3af952017dbde4fbb53',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qx66ux2w4cjj3ctsu9469s7k7vde6xmhkq2my0h2',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1779621711700428',
                      decimal: '17796.21711700428',
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
                    atoms: '1764021711700428',
                    decimal: '17640.21711700428',
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
  changeTokenAuthority: {
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
                  authority: 'tmt1q8jpdd7e6yfzx44pjdkgtpz2y3tql4dmzu5a34wu',
                  command: 'ChangeTokenAuthority',
                  input_type: 'AccountCommand',
                  new_authority: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                  nonce: 0,
                  token_id:
                    'tmltk1rmz3lv0rw3smzlzaeg3xctpmtvzelpht89qj3u0stye3rulalfqsahsvqq',
                },
                utxo: null,
              },
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    '080479b8ac6884e23ceb2ef0747b1b04143931b79571f33972a4100034850a2c',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1733421711700428',
                      decimal: '17334.21711700428',
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
                    atoms: '1717821711700428',
                    decimal: '17178.21711700428',
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
  changeTokenMetadata: {
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
                  authority: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                  command: 'ChangeMetadataUri',
                  input_type: 'AccountCommand',
                  new_metadata_uri: 'https://example.com',
                  nonce: 2,
                  token_id:
                    'tmltk1rmz3lv0rw3smzlzaeg3xctpmtvzelpht89qj3u0stye3rulalfqsahsvqq',
                },
                utxo: null,
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '3475110f90d9e34a521643d05e8bf87e1946cab86d96749c7bd95d73a9d8c047',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1717821711700428',
                      decimal: '17178.21711700428',
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
                    atoms: '1707421711700428',
                    decimal: '17074.21711700428',
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
  freezeToken: {
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
                  authority: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                  command: 'FreezeToken',
                  input_type: 'AccountCommand',
                  is_unfreezable: true,
                  nonce: 1,
                  token_id:
                    'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530',
                },
                utxo: null,
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '3475110f90d9e34a521643d05e8bf87e1946cab86d96749c7bd95d73a9d8c047',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1717821711700428',
                      decimal: '17178.21711700428',
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
                    atoms: '1707421711700428',
                    decimal: '17074.21711700428',
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
  unfreezeToken: {
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
                  authority: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                  command: 'UnfreezeToken',
                  input_type: 'AccountCommand',
                  nonce: 2,
                  token_id:
                    'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530',
                },
                utxo: null,
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '4fe15ef6d9a97ad2f33a96fb934a8390b2d684f5849ba135ed2b57498f0690ae',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1717548604300000',
                      decimal: '17175.486043',
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
                    atoms: '1707148604300000',
                    decimal: '17071.486043',
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
  dataDeposit: {
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
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    'b69876c1b963422723926b6dc452cb9787107f84948b1e65a22f2d0f8ca36694',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1707421711700428',
                      decimal: '17074.21711700428',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                data: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                type: 'DataDeposit',
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1687021711700428',
                    decimal: '16870.21711700428',
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
  issueNft: {
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
                    '9dc1221aa78551c7529068c021531df59103226d8b46277cd2ab40c6f78455ef',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1705748604300000',
                      decimal: '17057.486043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                data: {
                  additional_metadata_uri: {
                    hex: '697066733a2f2f6261666b726569656d6861676332736e706a6a6e64766471346a786d68346c6f6267336d707465327a3432627269657164336d6564677367633471',
                    string:
                      'ipfs://bafkreiemhagc2snpjjndvdq4jxmh4lobg3mpte2z42brieqd3medgsgc4q',
                  },
                  creator: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  description: {
                    hex: '4465736372697074696f6e',
                    string: 'Description',
                  },
                  icon_uri: {
                    hex: '697066733a2f2f62616679626569627732796c363432336561673433746c6765757074636564726632666c78706e707674796d736e71627063666e6c786a637a34692f70686f746f5f323032342d31302d30332d32332e32342e30342e6a706567',
                    string:
                      'ipfs://bafybeibw2yl6423eag43tlgeuptcedrf2flxpnpvtymsnqbpcfnlxjcz4i/photo_2024-10-03-23.24.04.jpeg',
                  },
                  media_hash: {
                    hex: '316336653936303431306132',
                    string: '1c6e960410a2',
                  },
                  media_uri: {
                    hex: '697066733a2f2f62616679626569627732796c363432336561673433746c6765757074636564726632666c78706e707674796d736e71627063666e6c786a637a34692f70686f746f5f323032342d31302d30332d32332e32342e30342e6a706567',
                    string:
                      'ipfs://bafybeibw2yl6423eag43tlgeuptcedrf2flxpnpvtymsnqbpcfnlxjcz4i/photo_2024-10-03-23.24.04.jpeg',
                  },
                  name: {
                    hex: '4e616d65',
                    string: 'Name',
                  },
                  ticker: {
                    hex: '505050',
                    string: 'PPP',
                  },
                },
                destination: 'tmt1q96glhddzd2u9wcyzfeqm53yrxxqgfm66yezu0gd',
                token_id:
                  'tmltk1hulyp284e3kc522ta435wyckrqy4j4842perueyge6ctjlp2mpds65mcx8',
                type: 'IssueNft',
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1705048604300000',
                    decimal: '17050.486043',
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
  transferNft: {
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
                    '6eed78dd553ea0125a54fb95b960217d3509aeeb2ec80196d5d21aefa4487d01',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1705048604300000',
                      decimal: '17050.486043',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    'aed5bdd295db9889faed63de972ec6099805474c3f260e6a0d1b2814e9e8d9f9',
                  source_type: 'Transaction',
                },
                utxo: {
                  data: {
                    additional_metadata_uri: {
                      hex: '697066733a2f2f6261667962656962337232626566656c686d7a7a6d3365697974656737366532716b656132366b6f6477716c78326b7371716a69327063786e33792f746f6b656e5f6d657461646174612e6a736f6e',
                      string:
                        'ipfs://bafybeib3r2befelhmzzm3eiyteg76e2qkea26kodwqlx2ksqqji2pcxn3y/token_metadata.json',
                    },
                    creator: null,
                    description: {
                      hex: '46756e6e79646f67',
                      string: 'Funnydog',
                    },
                    icon_uri: {
                      hex: '697066733a2f2f6261667962656962337232626566656c686d7a7a6d3365697974656737366532716b656132366b6f6477716c78326b7371716a69327063786e33792f45304137303630442d304139432d344137392d424244452d3036463437464235413246462e6a706567',
                      string:
                        'ipfs://bafybeib3r2befelhmzzm3eiyteg76e2qkea26kodwqlx2ksqqji2pcxn3y/E0A7060D-0A9C-4A79-BBDE-06F47FB5A2FF.jpeg',
                    },
                    media_hash: {
                      hex: '363333636538653132343961393736623664',
                      string: '633ce8e1249a976b6d',
                    },
                    media_uri: {
                      hex: '697066733a2f2f6261667962656962337232626566656c686d7a7a6d3365697974656737366532716b656132366b6f6477716c78326b7371716a69327063786e33792f45304137303630442d304139432d344137392d424244452d3036463437464235413246462e6a706567',
                      string:
                        'ipfs://bafybeib3r2befelhmzzm3eiyteg76e2qkea26kodwqlx2ksqqji2pcxn3y/E0A7060D-0A9C-4A79-BBDE-06F47FB5A2FF.jpeg',
                    },
                    name: {
                      hex: '5665737061446f67',
                      string: 'VespaDog',
                    },
                    ticker: {
                      hex: '564544',
                      string: 'VED',
                    },
                  },
                  destination: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                  token_id:
                    'tmltk1xvjg47rcn6j9afcpwzcv8rut5edys8yakgktrkjpzpw5ys83v4tqtqzrd4',
                  type: 'IssueNft',
                  value: {
                    amount: {
                      atoms: '1',
                      decimal: '1',
                    },
                    token_id:
                      'tmltk1xvjg47rcn6j9afcpwzcv8rut5edys8yakgktrkjpzpw5ys83v4tqtqzrd4',
                    type: 'TokenV1',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q9efmjwt59a2z5vnsakavl5npalescjj7ualmhe9',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1',
                    decimal: '1',
                  },
                  token_id:
                    'tmltk1xvjg47rcn6j9afcpwzcv8rut5edys8yakgktrkjpzpw5ys83v4tqtqzrd4',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1704648604300000',
                    decimal: '17046.486043',
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
  delegationCreateId: {
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
                  source_id:
                    'af3b5fad20f6f97eb210934e942176f7f7d0f70423590659ee0e0217053a7cab',
                  source_type: 'Transaction',
                  input_type: 'UTXO',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1703205604300000',
                      decimal: '17032.056043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                type: 'CreateDelegationId',
                destination: 'tmt1qyrjfd5e3nref7zga24jcthffahjwyg3csxu3xgc',
                pool_id:
                  'tpool1dwpe7zy0mhagnwl36ywt5q20xxvu5dwmph4z6q8sc0a3srz5h8jqr0r2yg',
              },
              {
                type: 'Transfer',
                value: {
                  type: 'Coin',
                  amount: {
                    atoms: '1703005604300000',
                    decimal: '17030.056043',
                  },
                },
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  delegationStake: {
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
                  source_id:
                    'af3b5fad20f6f97eb210934e942176f7f7d0f70423590659ee0e0217053a7cab',
                  source_type: 'Transaction',
                  input_type: 'UTXO',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1703205604300000',
                      decimal: '17032.056043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                type: 'DelegateStaking',
                delegation_id:
                  'tdelg1d57nmkp24k0rh0fgsjnjy78wxql8wvgr420ncdsesvssvdgfcg6sx6262w',
                amount: {
                  atoms: '1000000000000',
                  decimal: '10',
                },
              },
              {
                type: 'Transfer',
                value: {
                  type: 'Coin',
                  amount: {
                    atoms: '1702005604300000',
                    decimal: '17020.056043',
                  },
                },
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
              },
            ],
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  delegationWithdraw: {
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
                  account_type: 'DelegationBalance',
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  delegation_id:
                    'tdelg1mfust4vvrn3xy6slm9qvtf8kjlzw4ezspkqwenfnzryyeumgdahqp2upjz',
                  input_type: 'Account',
                  nonce: 1,
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q9l0g4kd3s6x5rmesaznegz06pw9hxu6qvqu3pa7',
                lock: {
                  content: '7200',
                  type: 'ForBlockCount',
                },
                type: 'LockThenTransfer',
                value: {
                  amount: {
                    atoms: '800000000000',
                    decimal: '8',
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
  createHtlc: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            fee: {
              atoms: '124900000000',
              decimal: '1.249',
            },
            id: '513932890fb1fee9b21d3004d4292e7eace8753f43d601013d635b8b1195f207',
            inputs: [
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    '92b08778d6d0345f1f943f83e7969fbcece9629938dddcec94f0b28382a58feb',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1689595604300000',
                      decimal: '16895.956043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                amount: {
                  atoms: '1000000000000',
                  decimal: '10',
                },
                refund_address: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                refund_timelock: {
                  content: '20',
                  type: 'ForBlockCount',
                },
                secret_hash: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
                spend_address: 'tmt1q9mfg7d6ul2nt5yhmm7l7r6wwyqkd822rymr83uc',
                token_id: null,
                type: 'CreateHtlc',
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1688470704300000',
                    decimal: '16884.707043',
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
  refundHtlc: {
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
                  index: 0,
                  source_type: 0,
                  source_id:
                    '513932890fb1fee9b21d3004d4292e7eace8753f43d601013d635b8b1195f207',
                  input_type: 'UTXO',
                },
                utxo: {
                  type: 'Htlc',
                  value: {
                    amount: {
                      atoms: '1000000000000',
                      decimal: '10',
                    },
                    type: 'Coin',
                  },
                  htlc: {
                    refund_key: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                    refund_timelock: {
                      content: 20,
                      type: 'ForBlockCount',
                    },
                    secret_hash: {
                      hex: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
                      string: null,
                    },
                    spend_key: 'tmt1q9mfg7d6ul2nt5yhmm7l7r6wwyqkd822rymr83uc',
                  },
                },
              },
              {
                input: {
                  index: 0,
                  source_id:
                    'af3b5fad20f6f97eb210934e942176f7f7d0f70423590659ee0e0217053a7cab',
                  source_type: 'Transaction',
                  input_type: 'UTXO',
                },
                utxo: {
                  destination: 'tmt1q9l0g4kd3s6x5rmesaznegz06pw9hxu6qvqu3pa7',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1000000000000',
                      decimal: '10',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                type: 'Transfer',
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                value: {
                  type: 'Coin',
                  amount: {
                    decimal: '10',
                    atoms: '1000000000000',
                  },
                },
              },
              {
                type: 'Transfer',
                value: {
                  type: 'Coin',
                  amount: {
                    atoms: '965500000000',
                    decimal: '9.655',
                  },
                },
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
              },
            ],
            fee: {
              atoms: '34500000000',
              decimal: '0.345',
            },
            id: '63c90b6d244cdf901322fa7e75fb6499a8e7a30152d573626e5a10b06befe65a',
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  createHtlc2: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            fee: {
              atoms: '124900000000',
              decimal: '1.249',
            },
            id: '408a1e5a8c59ed10ffc6a55244f29e465b692223ef6e6ef05b03a3a4b6010507',
            inputs: [
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    '513932890fb1fee9b21d3004d4292e7eace8753f43d601013d635b8b1195f207',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1688470704300000',
                      decimal: '16884.707043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                htlc: {
                  refund_key: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  refund_timelock: {
                    content: 20,
                    type: 'ForBlockCount',
                  },
                  secret_hash: {
                    hex: '0000000000000000000000000000000000000000', // should be filled in by the wallet
                    string: null,
                  },
                  spend_key: 'tmt1q9mfg7d6ul2nt5yhmm7l7r6wwyqkd822rymr83uc',
                },
                type: 'Htlc',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1687345804300000',
                    decimal: '16873.458043',
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
  refundHtlc2: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            fee: {
              atoms: '34500000000',
              decimal: '0.345',
            },
            id: '73a881ff916842962b91167123f776b64a95f443c611040a1680306d89686eb3',
            inputs: [
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '408a1e5a8c59ed10ffc6a55244f29e465b692223ef6e6ef05b03a3a4b6010507',
                  source_type: 0,
                },
                utxo: {
                  htlc: {
                    refund_key: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                    refund_timelock: {
                      content: 20,
                      type: 'ForBlockCount',
                    },
                    secret_hash: {
                      hex: 'd5777dbd9541baea8a562381387323773b18e0f6',
                      string: null,
                    },
                    spend_key: 'tmt1q9mfg7d6ul2nt5yhmm7l7r6wwyqkd822rymr83uc',
                  },
                  type: 'Htlc',
                  value: {
                    amount: {
                      atoms: '1000000000000',
                      decimal: '10',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    'af3b5fad20f6f97eb210934e942176f7f7d0f70423590659ee0e0217053a7cab',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1q9l0g4kd3s6x5rmesaznegz06pw9hxu6qvqu3pa7',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1000000000000',
                      decimal: '10',
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
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '965500000000',
                    decimal: '9.655',
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
  spendHtlc003: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            fee: {
              atoms: '45000000000',
              decimal: '0.45',
            },
            id: '2add3f9296f07fd0be403f21349ff6f5820849075be0e837beec14f6d66d58ae',
            inputs: [
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    '7a067e2f1283e016acb329ae270a70ef6bb20e4c57295eb94b639bbcaffb8431',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1680886511700428',
                      decimal: '16808.86511700428',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '8a39d5e1b091a4b6681a9617e4ec5d4cba6f3f80b2c60e4d7bb6422536d309df',
                  source_type: 0,
                },
                utxo: {
                  htlc: {
                    refund_key: 'tmt1q9r4gz3aevjm38yq8ycd6gl3kqd25xh4jqzjthdc',
                    refund_timelock: {
                      content: 20,
                      type: 'ForBlockCount',
                    },
                    secret_hash: {
                      hex: '6fe48221f25bee488253b95514bd67aed628c848',
                      string: null,
                    },
                    spend_key: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                  },
                  type: 'Htlc',
                  value: {
                    amount: {
                      atoms: '1000000000000',
                      decimal: '10',
                    },
                    token_id:
                      'tmltk16u754a6su60wd3tra669a3gt0su79zehqeavu4ffgrnjzgaedasqtfurcu',
                    type: 'TokenV1',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1679841511700428',
                    decimal: '16798.41511700428',
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
  refundHtlc003: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            fee: {
              atoms: '45000000000',
              decimal: '0.45',
            },
            id: '0891cd57aeaef656f2b17c152f0da3be4e1ab101c400c2a0e167c26da5092ea6',
            inputs: [
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    'd2b0490b0c09f35bfaadbf42e3b4e239c6fa805596a95c14fe1edbef5f63e97d',
                  source_type: 0,
                },
                utxo: {
                  htlc: {
                    refund_key: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                    refund_timelock: {
                      content: 20,
                      type: 'ForBlockCount',
                    },
                    secret: null,
                    secret_hash: {
                      hex: 'f3379f953cf661374eaf6f5e22fe3d96342f4e75',
                      string: null,
                    },
                    spend_key: 'tmt1q9r4gz3aevjm38yq8ycd6gl3kqd25xh4jqzjthdc',
                  },
                  type: 'Htlc',
                  value: {
                    amount: {
                      atoms: '1000000000000',
                      decimal: '10',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    '1067780d1f96c2fa66a6a99cccebecc92b0e94ab17c6be6f7dd7ff7ec99303be',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1575786605844429',
                      decimal: '15757.86605844429',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1575741605844429',
                    decimal: '15757.41605844429',
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
  refundHtlc004: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            fee: {
              atoms: '45000000000',
              decimal: '0.45',
            },
            id: '5c773621c90d67e7e4dab67ada6f2e7dd42905e135125da29a8e5ad53a6e8480',
            inputs: [
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    'd964a60d19d5b8c95e45c303867b097bedd257b2b3da72a3a12efa16ec7683b0',
                  source_type: 0,
                },
                utxo: {
                  htlc: {
                    refund_key: 'tmt1qxjkxwfcv7cscypmxhugss6jjzxh6c6k7u48acjf',
                    refund_timelock: {
                      content: 20,
                      type: 'ForBlockCount',
                    },
                    secret: null,
                    secret_hash: {
                      hex: '73d01e927b39d3d4150c59751d493379537c6810',
                      string: null,
                    },
                    spend_key: 'tmt1q9l0g4kd3s6x5rmesaznegz06pw9hxu6qvqu3pa7',
                  },
                  type: 'Htlc',
                  value: {
                    amount: {
                      atoms: '1000000000000',
                      decimal: '10',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    '6978c743d518230dec177484847c4ea7ac4b1830892beea7731c582b2240f891',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxr8pg9suckl32jgm3a8x5z237e00c3rvcwnfsye',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1551009504300000',
                      decimal: '15510.095043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1qxjkxwfcv7cscypmxhugss6jjzxh6c6k7u48acjf',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1550964504300000',
                    decimal: '15509.645043',
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
  refundHtlc005: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          BINRepresentation: {},
          HEXRepresentation_unsigned: {},
          JSONRepresentation: {
            fee: {
              atoms: '45000000000',
              decimal: '0.45',
            },
            id: '27935275cdb56ec7a0642c86fa2fede661e8fd841e90f35c4cdda478a730bc74',
            inputs: [
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '18cf188d0e4b4456fe4fc30ab0df219803f311b32dc39351d237940b2d44d181',
                  source_type: 0,
                },
                utxo: {
                  htlc: {
                    refund_key: 'tmt1q8xqrjnm0329ax0vz6929ar5srgdnyk7ryfpjcun',
                    refund_timelock: {
                      content: 2,
                      type: 'ForBlockCount',
                    },
                    secret: null,
                    secret_hash: {
                      hex: 'd5836c42fdad436cf6d870585975cee0d2184c1e',
                      string: null,
                    },
                    spend_key: 'tmt1q9r4gz3aevjm38yq8ycd6gl3kqd25xh4jqzjthdc',
                  },
                  type: 'Htlc',
                  value: {
                    amount: {
                      atoms: '1000000000000',
                      decimal: '10',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    '18cf188d0e4b4456fe4fc30ab0df219803f311b32dc39351d237940b2d44d181',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1546069604300000',
                      decimal: '15460.696043',
                    },
                    type: 'Coin',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q8xqrjnm0329ax0vz6929ar5srgdnyk7ryfpjcun',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1546024604300000',
                    decimal: '15460.246043',
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
  createHtlcWRefund: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          JSONRepresentation: {
            inputs: [
              {
                input: {
                  index: 1,
                  source_id:
                    '3fc7f046c469662d76288bdcff644f207d9e995083da1b815e8592ccd91d5f14',
                  source_type: 'Transaction',
                  input_type: 'UTXO',
                },
                utxo: {
                  destination: 'tmt1qxn6genn5dl765l9gvnnjjz7eskxu06fhu83cpk5',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '6565137000000',
                      decimal: '65.65137',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 1,
                  source_id:
                    '4e7fc6e7cca5e0fb049ba651fe0817e88dd13551992f4690d193de1bf852e41f',
                  source_type: 'Transaction',
                  input_type: 'UTXO',
                },
                utxo: {
                  destination: 'tmt1q9r4gz3aevjm38yq8ycd6gl3kqd25xh4jqzjthdc',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '2000000000000',
                      decimal: '20',
                    },
                    token_id:
                      'tmltk18wg2xa7qxflwmcjpcd7nepsrsjj0gcrqyc7k5ej4cq5q3lf7ry7qtm2l6z',
                    type: 'TokenV1',
                  },
                },
              },
            ],
            outputs: [
              {
                type: 'Htlc',
                htlc: {
                  refund_key: 'tmt1q9r4gz3aevjm38yq8ycd6gl3kqd25xh4jqzjthdc',
                  refund_timelock: {
                    type: 'ForBlockCount',
                    content: '5',
                  },
                  secret_hash: {
                    hex: '0000000000000000000000000000000000000000',
                    string: null,
                  },
                  spend_key: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                },
                value: {
                  amount: {
                    decimal: '10',
                    atoms: '1000000000000',
                  },
                  type: 'TokenV1',
                  token_id:
                    'tmltk18wg2xa7qxflwmcjpcd7nepsrsjj0gcrqyc7k5ej4cq5q3lf7ry7qtm2l6z',
                },
              },
              {
                type: 'Transfer',
                value: {
                  type: 'Coin',
                  amount: {
                    atoms: '6416937000000',
                    decimal: '64.16937',
                  },
                },
                destination: 'tmt1q8fx589gdhcpprz0mcewca7a7h4wmtzeqccj4jdv',
              },
              {
                type: 'Transfer',
                value: {
                  type: 'TokenV1',
                  token_id:
                    'tmltk18wg2xa7qxflwmcjpcd7nepsrsjj0gcrqyc7k5ej4cq5q3lf7ry7qtm2l6z',
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                },
                destination: 'tmt1q8fx589gdhcpprz0mcewca7a7h4wmtzeqccj4jdv',
              },
            ],
            fee: {
              atoms: '148200000000',
              decimal: '1.482',
            },
            id: '3931577a59733b6b2b9db2f0ca4291fdb6a7adcde6839e0b14637f8c04c53202',
          },
          BINRepresentation: {},
          HEXRepresentation_unsigned:
            '01000800003fc7f046c469662d76288bdcff644f207d9e995083da1b815e8592ccd91d5f140100000000004e7fc6e7cca5e0fb049ba651fe0817e88dd13551992f4690d193de1bf852e41f010000000c0a023b90a377c0327eede241c37d3c860384a4f46060263d6a6655c02808fd3e193c070010a5d4e80000000000000000000000000000000000000000014feab906d667b56c49e3c86b8bf9e1ea10bdff2d02140147540a3dcb25b89c803930dd23f1b01aaa1af59000000b401c400fd60501d26a1ca86df0108c4fde32ec77ddf5eaedac590600023b90a377c0327eede241c37d3c860384a4f46060263d6a6655c02808fd3e193c070010a5d4e801d26a1ca86df0108c4fde32ec77ddf5eaedac5906',
          transaction_id:
            '3931577a59733b6b2b9db2f0ca4291fdb6a7adcde6839e0b14637f8c04c53202',
          htlc: {
            spend_pubkey:
              '0002aac655156131ce3a06eab9f0a38f43df1b1c1f25f4944bae262ed614fd52d4c6',
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  refundHtlcWRefund: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          JSONRepresentation: {
            id: null,
            inputs: [
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    '3931577a59733b6b2b9db2f0ca4291fdb6a7adcde6839e0b14637f8c04c53202',
                  source_type: 'Transaction',
                },
                utxo: {
                  type: 'Htlc',
                  htlc: {
                    refund_key: 'tmt1q9r4gz3aevjm38yq8ycd6gl3kqd25xh4jqzjthdc',
                    refund_timelock: {
                      type: 'ForBlockCount',
                      content: '5',
                    },
                    secret_hash: {
                      hex: '4a0ac45551164f161e8318f06b0fd8da1c07476f',
                      string: null,
                    },
                    spend_key: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                  },
                  value: {
                    amount: {
                      decimal: '10',
                      atoms: '1000000000000',
                    },
                    type: 'TokenV1',
                    token_id:
                      'tmltk18wg2xa7qxflwmcjpcd7nepsrsjj0gcrqyc7k5ej4cq5q3lf7ry7qtm2l6z',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q9r4gz3aevjm38yq8ycd6gl3kqd25xh4jqzjthdc',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  type: 'Coin',
                },
              },
            ],
          },
          BINRepresentation: {},
          HEXRepresentation_unsigned:
            '01000800003fc7f046c469662d76288bdcff644f207d9e995083da1b815e8592ccd91d5f140100000000004e7fc6e7cca5e0fb049ba651fe0817e88dd13551992f4690d193de1bf852e41f010000000c0a023b90a377c0327eede241c37d3c860384a4f46060263d6a6655c02808fd3e193c070010a5d4e80000000000000000000000000000000000000000014feab906d667b56c49e3c86b8bf9e1ea10bdff2d02140147540a3dcb25b89c803930dd23f1b01aaa1af59000000b401c400fd60501d26a1ca86df0108c4fde32ec77ddf5eaedac590600023b90a377c0327eede241c37d3c860384a4f46060263d6a6655c02808fd3e193c070010a5d4e801d26a1ca86df0108c4fde32ec77ddf5eaedac5906',
          transaction_id:
            '3931577a59733b6b2b9db2f0ca4291fdb6a7adcde6839e0b14637f8c04c53202',
          htlc: {
            multisig_challenge:
              '02080003b7aa540098fd02952470bd324fcf1976531a4a6125517e92c369ccc86c65d38d0002aac655156131ce3a06eab9f0a38f43df1b1c1f25f4944bae262ed614fd52d4c6',
            witness_input:
              '010131020125020400004d289db78cd77834d8fceeb16500731ed5d4abfe5a2a41c1804694d0257b99c46163c3c4cecb184604ffc7ef03ce69a7dab89a5f42947ecbd6fb14620a20f7b502080003b7aa540098fd02952470bd324fcf1976531a4a6125517e92c369ccc86c65d38d0002aac655156131ce3a06eab9f0a38f43df1b1c1f25f4944bae262ed614fd52d4c6',
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  clamHTLC2: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          JSONRepresentation: {
            fee: {
              atoms: '68600000000',
              decimal: '0.686',
            },
            id: 'd715e101cfcd268a0013dfd8b30cee4dfbdba6ad3da96cd8214201c5415ac472',
            inputs: [
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'ee674161da300e36334f4fb644403ca1e8e1cb601a4c8b37d0b579760a3c23b3',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1523680304300000',
                      decimal: '15236.803043',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    'f902a75999200e3e84382bfd4c499547433b2473a3fe8a1c1ae5864171d785b0',
                  source_type: 0,
                },
                utxo: {
                  htlc: {
                    refund_key: 'tmt1q9r4gz3aevjm38yq8ycd6gl3kqd25xh4jqzjthdc',
                    refund_timelock: {
                      content: 144,
                      type: 'ForBlockCount',
                    },
                    secret: null,
                    secret_hash: {
                      hex: '610df940305b95c8b28a433541303dbf0322a5ee',
                      string: null,
                    },
                    spend_key: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                  },
                  type: 'Htlc',
                  value: {
                    amount: {
                      atoms: '1000000000000',
                      decimal: '10',
                    },
                    token_id:
                      'tmltk18wg2xa7qxflwmcjpcd7nepsrsjj0gcrqyc7k5ej4cq5q3lf7ry7qtm2l6z',
                    type: 'TokenV1',
                  },
                },
              },
              {
                input: {
                  index: 2,
                  input_type: 'UTXO',
                  source_id:
                    '05520d5d070d750f9f794a6806ae0e796e020ee08a130aa7f4498f24a7b2a8e9',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '900000000000000',
                      decimal: '9000',
                    },
                    token_id:
                      'tmltk18wg2xa7qxflwmcjpcd7nepsrsjj0gcrqyc7k5ej4cq5q3lf7ry7qtm2l6z',
                    type: 'TokenV1',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1000000000000',
                    decimal: '10',
                  },
                  token_id:
                    'tmltk18wg2xa7qxflwmcjpcd7nepsrsjj0gcrqyc7k5ej4cq5q3lf7ry7qtm2l6z',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1523611704300000',
                    decimal: '15236.117043',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '900000000000000',
                    decimal: '9000',
                  },
                  token_id:
                    'tmltk18wg2xa7qxflwmcjpcd7nepsrsjj0gcrqyc7k5ej4cq5q3lf7ry7qtm2l6z',
                  type: 'TokenV1',
                },
              },
            ],
          },
          BINRepresentation: {},
          HEXRepresentation_unsigned:
            '01000800003fc7f046c469662d76288bdcff644f207d9e995083da1b815e8592ccd91d5f140100000000004e7fc6e7cca5e0fb049ba651fe0817e88dd13551992f4690d193de1bf852e41f010000000c0a023b90a377c0327eede241c37d3c860384a4f46060263d6a6655c02808fd3e193c070010a5d4e80000000000000000000000000000000000000000014feab906d667b56c49e3c86b8bf9e1ea10bdff2d02140147540a3dcb25b89c803930dd23f1b01aaa1af59000000b401c400fd60501d26a1ca86df0108c4fde32ec77ddf5eaedac590600023b90a377c0327eede241c37d3c860384a4f46060263d6a6655c02808fd3e193c070010a5d4e801d26a1ca86df0108c4fde32ec77ddf5eaedac5906',
          transaction_id:
            '3931577a59733b6b2b9db2f0ca4291fdb6a7adcde6839e0b14637f8c04c53202',
          htlc: {
            multisig_challenge:
              '02080003b7aa540098fd02952470bd324fcf1976531a4a6125517e92c369ccc86c65d38d0002aac655156131ce3a06eab9f0a38f43df1b1c1f25f4944bae262ed614fd52d4c6',
            witness_input:
              '010131020125020400004d289db78cd77834d8fceeb16500731ed5d4abfe5a2a41c1804694d0257b99c46163c3c4cecb184604ffc7ef03ce69a7dab89a5f42947ecbd6fb14620a20f7b502080003b7aa540098fd02952470bd324fcf1976531a4a6125517e92c369ccc86c65d38d0002aac655156131ce3a06eab9f0a38f43df1b1c1f25f4944bae262ed614fd52d4c6',
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
  clamHTLC3: {
    action: 'signTransaction',
    request: {
      action: 'signTransaction',
      data: {
        txData: {
          JSONRepresentation: {
            fee: {
              atoms: '68500000000',
              decimal: '0.685',
            },
            id: '52cc3e2ebca5315f2528d21498de52e59ecf13981dd298a14b776ebb9b858eb1',
            inputs: [
              {
                input: {
                  index: 1,
                  input_type: 'UTXO',
                  source_id:
                    'd83087d9dee2ed0da017d87a03f1267a33e2ecd195d680dfd96624ae8958c235',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '1522436704300000',
                      decimal: '15224.367043',
                    },
                    type: 'Coin',
                  },
                },
              },
              {
                input: {
                  index: 0,
                  input_type: 'UTXO',
                  source_id:
                    'f057485ab7a42ebd057c156a0a83c04cc40d1fd32a3b6a5e3963331003f7e07a',
                  source_type: 0,
                },
                utxo: {
                  htlc: {
                    refund_key: 'tmt1q9r4gz3aevjm38yq8ycd6gl3kqd25xh4jqzjthdc',
                    refund_timelock: {
                      content: 144,
                      type: 'ForBlockCount',
                    },
                    secret: null,
                    secret_hash: {
                      hex: '4ae3643f3632e9b58fb97a3f34bdbb129fd40dc5',
                      string: null,
                    },
                    spend_key: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                  },
                  type: 'Htlc',
                  value: {
                    amount: {
                      atoms: '100000000000',
                      decimal: '1',
                    },
                    token_id:
                      'tmltk16u754a6su60wd3tra669a3gt0su79zehqeavu4ffgrnjzgaedasqtfurcu',
                    type: 'TokenV1',
                  },
                },
              },
              {
                input: {
                  index: 2,
                  input_type: 'UTXO',
                  source_id:
                    '403505e7b3da873dddcc2e38e1b4be1787645b214345cd1a6eced496244e10b6',
                  source_type: 'Transaction',
                },
                utxo: {
                  destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                  type: 'Transfer',
                  value: {
                    amount: {
                      atoms: '6200000000000',
                      decimal: '62',
                    },
                    token_id:
                      'tmltk16u754a6su60wd3tra669a3gt0su79zehqeavu4ffgrnjzgaedasqtfurcu',
                    type: 'TokenV1',
                  },
                },
              },
            ],
            outputs: [
              {
                destination: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '100000000000',
                    decimal: '1',
                  },
                  token_id:
                    'tmltk16u754a6su60wd3tra669a3gt0su79zehqeavu4ffgrnjzgaedasqtfurcu',
                  type: 'TokenV1',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '1522368204300000',
                    decimal: '15223.682043',
                  },
                  type: 'Coin',
                },
              },
              {
                destination: 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6',
                type: 'Transfer',
                value: {
                  amount: {
                    atoms: '6200000000000',
                    decimal: '62',
                  },
                  token_id:
                    'tmltk16u754a6su60wd3tra669a3gt0su79zehqeavu4ffgrnjzgaedasqtfurcu',
                  type: 'TokenV1',
                },
              },
            ],
          },
          BINRepresentation: {},
          HEXRepresentation_unsigned:
            '01000800003fc7f046c469662d76288bdcff644f207d9e995083da1b815e8592ccd91d5f140100000000004e7fc6e7cca5e0fb049ba651fe0817e88dd13551992f4690d193de1bf852e41f010000000c0a023b90a377c0327eede241c37d3c860384a4f46060263d6a6655c02808fd3e193c070010a5d4e80000000000000000000000000000000000000000014feab906d667b56c49e3c86b8bf9e1ea10bdff2d02140147540a3dcb25b89c803930dd23f1b01aaa1af59000000b401c400fd60501d26a1ca86df0108c4fde32ec77ddf5eaedac590600023b90a377c0327eede241c37d3c860384a4f46060263d6a6655c02808fd3e193c070010a5d4e801d26a1ca86df0108c4fde32ec77ddf5eaedac5906',
          transaction_id:
            '3931577a59733b6b2b9db2f0ca4291fdb6a7adcde6839e0b14637f8c04c53202',
          htlc: {
            multisig_challenge:
              '02080003b7aa540098fd02952470bd324fcf1976531a4a6125517e92c369ccc86c65d38d0002aac655156131ce3a06eab9f0a38f43df1b1c1f25f4944bae262ed614fd52d4c6',
            witness_input:
              '010131020125020400004d289db78cd77834d8fceeb16500731ed5d4abfe5a2a41c1804694d0257b99c46163c3c4cecb184604ffc7ef03ce69a7dab89a5f42947ecbd6fb14620a20f7b502080003b7aa540098fd02952470bd324fcf1976531a4a6125517e92c369ccc86c65d38d0002aac655156131ce3a06eab9f0a38f43df1b1c1f25f4944bae262ed614fd52d4c6',
          },
        },
      },
      origin: 'http://localhost:8080',
      requestId: 'wymzne7u81',
    },
  },
}
