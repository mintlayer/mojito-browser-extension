import React from 'react'
import Carousel from './Carousel'

export default {
  title: 'Components/Composed/Carousel',
  component: Carousel,
  args: {
    accounts: [],
  },
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    accounts: {
      description: 'List of accounts',
      type: 'array',
      table: {
        type: {
          summary: 'Array<{id: number, name: string}>',
        },
      },
    },
    onClick: {
      description: 'Function to handle data click',
      action: 'onClick',
      table: {
        type: {
          summary: 'function',
        },
      },
    },
    onPrevious: {
      description: 'Function to handle previous button click',
      action: 'onPrevious',
      table: {
        type: {
          summary: 'function',
        },
      },
    },
    onNext: {
      description: 'Function to handle next button click',
      action: 'onNext',
      table: {
        type: {
          summary: 'function',
        },
      },
    },
  },
}

const Template = (args) => <Carousel {...args} />

export const AccountsMore = Template.bind({})
AccountsMore.args = {
  accounts: [...Array(10).keys()].map((i) => ({
    id: i,
    name: `Account ${i + 1}`,
  })),
}

export const Empty = Template.bind({})
Empty.args = {}

export const OneAccount = Template.bind({})
OneAccount.args = {
  accounts: [{ id: '1', name: 'Account Name' }],
}

export const MaxName = Template.bind({})
MaxName.args = {
  accounts: [
    {
      id: '1',
      name: '12345678901234 12345678901234 12345678901234 12345678901234 12345678901234',
    },
  ],
}
