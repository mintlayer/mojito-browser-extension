import React from 'react'
import InputsListItem from './InputsListItem'

export default {
  title: 'Components/Composed/InputsListItem',
  component: InputsListItem,
  args: {
    number: 1,
    value: 'value',
    validity: 'valid',
    restoreMode: true,
  },
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    number: {
      description: 'Number',
      type: 'number',
      control: 'number',
      table: {
        type: {
          summary: 'number',
        },
      },
    },
    value: {
      description: 'value',
      type: 'string',
      control: 'text',
      table: {
        type: {
          summary: 'string',
        },
      },
    },
    restoreMode: {
      description: 'to restore mode or not',
      type: 'boolean',
      control: 'boolean',
      table: {
        type: {
          summary: 'boolean',
        },
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
        options: [undefined, true, false],
      },
    },
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
