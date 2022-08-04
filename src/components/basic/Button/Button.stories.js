import React from 'react'
import Button from './Button'

export default {
  title: 'Components/Basic/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Label',
    alternate: false,
    extraStyleClasses: [],
  },
  argTypes: {
    children: {
      description: 'Contents of the button',
      type: { name: 'string', required: true },
      table: {
        type: {
          summary: 'string | component',
        },
      },
      control: {
        type: 'text',
      },
    },
    alternate: {
      description: 'Changes button to alternate style',
      type: { name: 'boolean' },
      table: {
        type: {
          summary: 'boolean',
        },
      },
      control: {
        type: 'boolean',
      },
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
    onClickHandle: {
      description: 'Function to handle button click',
      action: 'clicked',
      table: {
        type: {
          summary: 'function',
        },
      },
    },
  },
}

const Template = (args) => <Button {...args} />

export const Primary = Template.bind({})
Primary.args = {
  children: 'Label',
}

export const Alternate = Template.bind({})
Alternate.args = {
  children: 'Label',
  alternate: true,
}

export const ExtraStyle = Template.bind({})
ExtraStyle.args = {
  children: 'Label',
  extraStyleClasses: ['extra-style'],
}
