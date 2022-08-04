import { Expressions } from '@Constants'
import React from 'react'
import Input from './Input'

export default {
  title: 'Components/Basic/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  args: {
    placeholder: 'Placeholder',
    value: '',
    validity: [],
    extraStyleClasses: [],
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
    value: {
      description: 'The contents of the field',
      type: 'string',
      table: {
        type: {
          summary: 'string',
        },
      },
      control: 'text',
    },
    pattern: {
      description: 'The pattern to validate the field against',
      type: 'any',
      options: ['pasword', 'unset'],
      mapping: {
        password: Expressions.PASSWORD,
        unset: undefined,
      },

      table: {
        type: {
          summary: 'any',
        },
      },
    },
    validity: {
      description: 'List of custom CSS classes to the field',
      type: 'string',
      table: {
        type: {
          summary: 'string',
        },
      },
      control: 'radio',
      options: ['valid', 'invalid', 'unset'],
    },
    extraStyleClasses: {
      description: 'List of custom CSS classes to the field',
      type: 'array',
      control: {
        type: 'array',
      },
      table: {
        type: {
          summary: 'Array<string>',
        },
      },
    },
    onBlurHandle: {
      description: 'Function to handle blur event on the field',
      action: 'clicked',
      table: {
        type: {
          summary: 'function',
        },
      },
    },
    onFocusHandle: {
      description: 'Function to handle focus event on the field',
      action: 'clicked',
      table: {
        type: {
          summary: 'function',
        },
      },
    },
    onChangeHandle: {
      description: 'Function to handle change event on the field',
      action: 'clicked',
      table: {
        type: {
          summary: 'function',
          detail: 'The function receives as parameter the event dispatched',
        },
      },
    },
  },
}

const Template = (args) => <Input {...args} />

export const Primary = Template.bind({})
Primary.args = {}

export const Valid = Template.bind({})
Valid.args = {
  validity: 'valid',
}

export const Invalid = Template.bind({})
Invalid.args = {
  validity: 'invalid',
}

export const ExtraStyle = Template.bind({})
ExtraStyle.args = {
  extraStyleClasses: ['extra-style'],
}
