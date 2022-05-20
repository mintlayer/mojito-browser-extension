import React from 'react'
import Input from './input'

import '../../../constants.css'
import '../../assets/css/index_stories.css'

export default {
  title: 'Components/Basic/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    placeholder: {
      description: 'The contents of the field when empty',
      defaultValue: 'Placeholder',
      type: 'string',
      table: {
        type: {
          summary: 'string'
        },
      },
      control: 'text',
    },
    value: {
      description: 'The contents of the field',
      defaultValue: '',
      type: 'string',
      table: {
        type: {
          summary: 'string'
        },
      },
      control: 'text',
    },
    validity: {
      description: 'List of custom CSS classes to the field',
      defaultValue: [],
      type: 'array',
      table: {
        type: {
          summary: 'array'
        },
      },
      control: 'radio',
      options: ['valid', 'invalid', 'unset']
    },
    extraStyleClasses: {
      description: 'List of custom CSS classes to the field',
      defaultValue: [],
      type: 'array',
      table: {
        type: {
          summary: 'array'
        },
      },
      control: 'null'
    },
    onBlurHandle: {
      description: 'Function to handle blur event on the field',
      defaultValue: () => {},
      type: 'function',
      table: {
        type: {
          summary: 'function'
        },
      },
      control: null,
    },
    onFocusHandle: {
      description: 'Function to handle focus event on the field',
      defaultValue: () => {},
      type: 'function',
      table: {
        type: {
          summary: 'function'
        },
      },
      control: {
        type: 'null',
      },
    },
    onChangeHandle: {
      description: 'Function to handle change event on the field',
      defaultValue: () => {},
      type: 'function',
      table: {
        type: {
          summary: 'function',
          detail: 'The function receives as parameter the event dispatched'
        },
      },
      control: null,
    },
  },
}

const Template = (args) => <Input {...args} />

export const Primary = Template.bind({})

// export const Alternate = Template.bind({})
// Alternate.args = {
//   children: 'Label',
//   alternate: true,
// }
