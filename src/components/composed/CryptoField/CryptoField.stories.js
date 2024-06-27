import React from 'react'
import CryptoFiatField from './CryptoFiatField'

export default {
  title: 'Components/Composed/CryptoFiatField',
  component: CryptoFiatField,
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Placeholder',
    buttonTitle: 'Button',
  },
  argTypes: {
    placeholder: {
      description: 'The contents of the field when empty',
      type: 'string',
      table: {
        type: {
          summary: 'string',
        },
      },
      control: 'text',
    },
    buttonTitle: {
      description: 'The contents of the button',
      control: {
        type: 'text',
      },
      table: {
        type: {
          summary: 'string',
        },
      },
    },
    transactionData: {
      control: 'object',
    },
    inputValue: {
      description: 'The contents of the field',
      type: 'number',
      table: {
        type: {
          summary: 'number',
        },
      },
      control: 'number',
    },
    validity: {
      description: 'Validity of the input',
      type: { name: 'boolean' },
      table: {
        type: {
          summary: 'boolean',
        },
      },
      control: {
        type: 'select',
        options: [undefined, true, false],
      },
    },
    id: {
      description: 'The id of the input',
      type: 'string',
      table: {
        type: {
          summary: 'string',
        },
      },
      control: 'text',
    },
    changeValueHandle: {
      control: 'func',
    },
  },
}

const Template = (args) => <CryptoFiatField {...args} />

export const Empty = Template.bind({})
Empty.args = {}

export const Btc450 = Template.bind({})
Btc450.args = {
  transactionData: {
    fiatName: 'USD',
    tokenName: 'BTC',
    exchangeRate: 22343.23,
    maxValueInToken: 450,
  },
  inputValue: 450,
}

export const BtcSmall = Template.bind({})
BtcSmall.args = {
  transactionData: {
    fiatName: 'USD',
    tokenName: 'BTC',
    exchangeRate: 1,
    maxValueInToken: 450,
  },
  inputValue: 0.00000001,
}
