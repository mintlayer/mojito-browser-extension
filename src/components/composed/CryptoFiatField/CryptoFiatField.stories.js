import React from 'react'
import CryptoFiatField from './CryptoFiatField'

export default {
  title: 'Components/Composed/CryptoFiatField',
  component: CryptoFiatField,
  parameters: {
    layout: 'centered',
  },
  argTypes: {},
}

const Template = (args) => <CryptoFiatField {...args} />

const _data = {
  label: 'Label',
  placeholder: 'Placeholder',
  buttonTitle: 'Button',
}

export const Empty = Template.bind({})
Empty.args = {}

export const Btc450 = Template.bind({})
Btc450.args = {
  ..._data,
  transactionData: {
    fiatName: 'USD',
    tokenName: 'BTC',
    exchangeRate: 22343.23,
    maxValueInToken: 450,
  },
  inputValue: 450,
}
