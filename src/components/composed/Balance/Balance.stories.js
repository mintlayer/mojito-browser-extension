import React from 'react'
import Balance from './Balance'

export default {
  title: 'Components/Composed/Balance',
  component: Balance,
  argTypes: {
    balance: {
      description: 'The contents of the field when empty',
      type: 'number',
      table: {
        defaultValue: { summary: 0 },
        type: {
          summary: 'number',
        },
      },
      control: {
        type: 'number',
      },
    },
  },
}

const Template = (args) => <Balance {...args} />

export const Balance1 = Template.bind({})
Balance1.args = {
  balance: 1,
}

export const Empty = Template.bind({})
Empty.args = {}

export const Balance20 = Template.bind({})
Balance20.args = {
  balance: 100000000000000000000,
}

export const BalanceE21 = Template.bind({})
BalanceE21.args = {
  balance: 1000000000000000000000,
}
