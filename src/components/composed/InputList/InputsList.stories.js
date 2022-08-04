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

export const words12 = Template.bind({})
words12.args = {
  restoreMode: true,
  fields: [...Array(12).keys()].map((i) => ({
    order: i,
    validity: true,
    value: `word${i + 1}`,
  })),
  wordsList: ['word1', 'word2', 'word3'],
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

export const bip39list = Template.bind({})
bip39list.args = {
  restoreMode: true,
  fields: [{ order: 0, value: 'bip39', validity: true }],
  wordsList: ['car', 'house', 'cat'],
  BIP39DefaultWordList: ['bip39'],
}
