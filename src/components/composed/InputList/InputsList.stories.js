import React from 'react'
import InputsList from './InputsList'

export default {
  title: 'Components/Composed/InputsList',
  component: InputsList,
  args: {
    wordsList: [],
  },
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    fields: {
      description: 'Array of fields',
      table: {
        type: {
          summary: 'Array<{order: number, validity: boolean, value: string}>',
        },
      },
      control: {
        type: 'array',
      },
    },
    wordsList: {
      description: 'Array of words',
      table: {
        type: {
          summary: 'Array<string>',
        },
      },
      control: {
        type: 'array',
      },
    },
    setFields: {
      description: 'Function to set fields',
      action: 'setFields',
      table: {
        type: {
          summary: 'function',
        },
      },
    },
  },
}

const Template = (args) => <InputsList {...args} />

export const InputsValid = Template.bind({})
InputsValid.args = {
  restoreMode: true,
  fields: [{ order: 0, validity: true, value: 'car' }],
  wordsList: ['car', 'house', 'cat'],
}

export const empty = Template.bind({})
empty.args = {}

export const noRestore = Template.bind({})
noRestore.args = {
  restoreMode: false,
  fields: [{ order: 0, validity: true, value: 'car' }],
}

export const InputsInvalid = Template.bind({})
InputsInvalid.args = {
  restoreMode: true,
  fields: [{ order: 0, validity: false, value: 'car' }],
  wordsList: ['car', 'house', 'cat'],
}

export const bip30list = Template.bind({})
bip30list.args = {
  restoreMode: true,
  fields: [{ order: 0, value: 'other' }],
  wordsList: ['car', 'house', 'cat'],
  BIP39DefaultWordList: ['other'],
}
