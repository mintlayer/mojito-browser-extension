export const validateOutput = (output) => {
  // validate output
  return true
}

export const getInfoAboutOutput = (output) => {
  const parsedOutput = output

  if (parsedOutput.type === 'Transfer') {
    return {
      type: 'Transfer',
      requiredFields: ['destination', 'value'],
      amountToSend: parsedOutput.value.amount.decimal,
      allFields: {
        destination: parsedOutput.destination,
        'value.amount.decimal': parsedOutput.value.amount.decimal,
      },
    }
  }

  if (parsedOutput.type === 'LockThenTransfer') {
    return {
      type: 'LockThenTransfer',
      requiredFields: ['destination', 'value'],
      amountToSend: parsedOutput.value.amount.decimal,
      allFields: {
        destination: parsedOutput.destination,
        'value.amount.decimal': parsedOutput.value.amount.decimal,
      },
    }
  }

  if (parsedOutput.type === 'IssueFungibleToken') {
    return {
      type: 'IssueFungibleToken',
      requiredFields: ['authority'],
      extraFee: 100 * 1e11, // Decimal
      allFields: {
        authority: parsedOutput.authority,
        is_freezable: parsedOutput.is_freezable,
        'metadata_uri.string': parsedOutput.metadata_uri.string,
        number_of_decimals: parsedOutput.number_of_decimals,
        'token_ticker.string': parsedOutput.token_ticker.string,
        'total_supply.amount.decimal': parsedOutput.total_supply.amount.decimal,
        'total_supply.type': parsedOutput.total_supply.type,
      },
    }
  }

  if (parsedOutput.type === 'IssueNft') {
    return {
      type: 'IssueNft',
      requiredFields: ['authority'],
      extraFee: 5 * 1e11, // Decimal
      allFields: {
        token_id: parsedOutput.token_id,
        destination: parsedOutput.destination,
        'data.additional_metadata_uri':
          parsedOutput.data.additional_metadata_uri,
        'data.creator': parsedOutput.data.creator,
        'data.description.string': parsedOutput.data.description.string,
        'data.icon_uri': parsedOutput.data.icon_uri,
        'data.media_hash.string': parsedOutput.data.media_hash.string,
        'data.media_uri': parsedOutput.data.media_uri,
        'data.name.string': parsedOutput.data.name.string,
        'data.ticker.string': parsedOutput.data.ticker.string,
      },
    }
  }

  if (parsedOutput.type === 'DataDeposit') {
    return {
      type: 'DataDeposit',
      requiredFields: ['authority'],
      extraFee: 50 * 1e11, // Decimal
      allFields: {
        data: parsedOutput.data,
      },
    }
  }

  return {}
}

export const getTemplate = (name) => {
  if (name === 'Transfer') {
    return {
      type: 'Transfer',
      value: {
        type: 'Coin',
        amount: {
          atoms: '',
          decimal: '',
        },
      },
      destination: '',
    }
  }
  if (name === 'IssueFungibleToken') {
    return {
      type: 'IssueFungibleToken',
      authority: '',
      is_freezable: false,
      metadata_uri: {
        hex: '',
        string: '',
      },
      number_of_decimals: 8,
      token_ticker: {
        hex: '',
        string: '',
      },
      total_supply: {
        amount: {
          atoms: '',
          decimal: '',
        },
        type: 'Unlimited',
      },
    }
  }
  if (name === 'IssueNft') {
    return {
      type: 'IssueNft',
      token_id: '',
      destination: 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z',
      data: {
        additional_metadata_uri:
          'ipfs://bafybeib3r2befelhmzzm3eiyteg76e2qkea26kodwqlx2ksqqji2pcxn3y/token_metadata.json',
        creator: 'ss',
        description: {
          hex: '6969',
          string: 'ii',
        },
        icon_uri:
          'ipfs://bafybeib3r2befelhmzzm3eiyteg76e2qkea26kodwqlx2ksqqji2pcxn3y/E0A7060D-0A9C-4A79-BBDE-06F47FB5A2FF.jpeg',
        media_hash: {
          hex: '36333363653865313234396139373662366433663534616230306430316262626132373937393066343431376336356434353463323839336136643538306366',
          string:
            '633ce8e1249a976b6d3f54ab00d01bbba279790f4417c65d454c2893a6d580cf',
        },
        media_uri:
          'ipfs://bafybeib3r2befelhmzzm3eiyteg76e2qkea26kodwqlx2ksqqji2pcxn3y/E0A7060D-0A9C-4A79-BBDE-06F47FB5A2FF.jpeg',
        name: {
          hex: '6969',
          string: 'ii',
        },
        ticker: {
          hex: '6969',
          string: 'ii',
        },
      },
    }
    // return {
    //   type: 'IssueNft',
    //   token_id: '',
    //   destination: '',
    //   data: {
    //     additional_metadata_uri: '',
    //     creator: null,
    //     description: {
    //       hex: '',
    //       string: '',
    //     },
    //     icon_uri: '',
    //     media_hash: {
    //       hex: '',
    //       string: null,
    //     },
    //     media_uri: '',
    //     name: {
    //       hex: '',
    //       string: '',
    //     },
    //     ticker: {
    //       hex: '',
    //       string: '',
    //     },
    //   },
    // }
  }
  if (name === 'DataDeposit') {
    return {
      type: 'DataDeposit',
      data: '',
    }
  }
}

export const stringToHex = (str) => {
  let hex = ''
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16)
  }
  return hex
}
