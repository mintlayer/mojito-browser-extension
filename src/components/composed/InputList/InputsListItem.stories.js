import React from 'react'
import InputsListItem from './InputsListItem'

export default {
  title: 'Components/Composed/InputsListItem',
  component: InputsListItem,
  args: {
    word: '',
  },
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onChangeHandler: {
      action: 'onChangeHandler',
      method: true,
      description: 'Function to be called when the input changes',
      table: {
        type: {
          summary: 'function',
        },
      },
      control: {
        type: 'function',
      },
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
        options: [undefined, 'valid', 'invalid'],
      },
    },
  },
}

const Template = (args) => <InputsListItem {...args} />

export const valid = Template.bind({})
valid.args = {
  number: 1,
  value: 'value',
  validity: 'valid',
  restoreMode: true,
}

export const invalid = Template.bind({})
invalid.args = {
  number: 1,
  value: 'value',
  validity: 'invalid',
  restoreMode: true,
}

export const empty = Template.bind({})
empty.args = {}

export const noRestore = Template.bind({})
noRestore.args = {
  restoreMode: false,
}
