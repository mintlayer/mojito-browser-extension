import React from 'react'
import TextField from './TextField'

export default {
  title: 'Components/Composed/TextField',
  component: TextField,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    value: {
      control: {
        type: 'text',
      },
      table: {
        type: {
          summary: 'string',
        },
      },
    },
    label: {
      control: {
        type: 'text',
      },
      table: {
        type: {
          summary: 'string',
        },
      },
    },
    pattern: {
      control: {
        type: 'text',
      },

      table: {
        type: {
          summary: 'string',
        },
      },
    },
    extraStyleClasses: {
      control: {
        type: 'array',
      },
      table: {
        type: {
          summary: 'Array<string>',
        },
      },
    },
    errorMessages: {
      control: {
        type: 'text',
      },
      table: {
        type: {
          summary: 'string',
        },
      },
    },
    pristinity: {
      control: {
        type: 'boolean',
      },
      table: {
        type: {
          summary: 'boolean',
        },
      },
    },
    placeHolder: {
      control: {
        type: 'text',
      },
      table: {
        type: {
          summary: 'string',
        },
      },
    },
    alternate: {
      control: {
        type: 'boolean',
      },
      table: {
        type: {
          summary: 'boolean',
        },
      },
    },
    password: {
      control: {
        type: 'boolean',
      },
      table: {
        type: {
          summary: 'boolean',
        },
      },
    },

    onChangeHandle: {
      description: 'callback after change',
      action: 'onChangeHandle',
      table: {
        type: { summary: 'function' },
      },
    },
  },
}

const Template = (args) => <TextField {...args} />

export const Label = Template.bind({})
Label.args = {
  label: 'label',
  value: undefined,
  pattern: 'pattern',
  extraStyleClasses: [''],
  errorMessages: 'errorMessages',
  placeHolder: 'placeHolder',
}

export const empty = Template.bind({})
empty.args = {}
