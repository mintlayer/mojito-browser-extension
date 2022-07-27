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
    validity: {
      description: 'List of custom CSS classes to the field',
      type: 'array',
      table: {
        type: {
          summary: 'array',
        },
      },
      control: 'radio',
      options: ['valid', 'invalid', 'unset'],
    },
    extraStyleClasses: {
      description: 'List of custom CSS classes to the field',
      type: 'array',
      table: {
        type: {
          summary: 'array',
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

export const Alternate = Template.bind({})
Alternate.args = {
  alternate: true,
}
