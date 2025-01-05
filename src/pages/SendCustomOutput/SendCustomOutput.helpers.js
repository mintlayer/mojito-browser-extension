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
      extraFee: 50 * 1e11, // Decimal
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
      destination: '',
      data: {
        additional_metadata_uri: '',
        creator: null,
        description: {
          hex: '',
          string: '',
        },
        icon_uri: '',
        media_hash: {
          hex: '',
          string: null,
        },
        media_uri: '',
        name: {
          hex: '',
          string: '',
        },
        ticker: {
          hex: '',
          string: '',
        },
      },
    }
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
