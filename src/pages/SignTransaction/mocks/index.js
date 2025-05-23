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
}
