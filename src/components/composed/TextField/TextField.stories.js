import React from 'react'
import TextField from './TextField'

export default {
  title: 'Components/Composed/TextField',
  component: TextField,
  parameters: {
    layout: 'centered',
  },
  args: {
    label: 'label',
    placeHolder: 'placeholder',
    extraStyleClasses: [],
    errorMessages: 'errorMessages',
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
    validity: {
      description: 'validity of the field',
      type: 'boolean',
      table: {
        type: {
          summary: 'boolean',
        },
      },
      control: 'boolean',
    },

    extraStyleClasses: {
      description: 'List of custom CSS classes to the button',
      type: { name: 'array' },
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
  placeHolder: 'placeHolder',
  errorMessages: 'errorMessages',
  value: 'value',
  validity: true,
  pristinity: true,
  extraStyleClasses: [''],
}

export const empty = Template.bind({})
empty.args = {}
