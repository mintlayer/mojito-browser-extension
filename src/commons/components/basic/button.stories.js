import React from 'react'
import Button from './button'

import '../../../constants.css'
import '../../assets/css/index_stories.css'

export default {
  title: 'Components/Basic/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    children: {
      description: 'Contents of the button',
      defaultValue: 'Label',
      type: {name: 'string', required: true},
      table: {
        type: {
          summary: 'string | component'
        },
      },
      control: {
        type: 'text',
      },
    },
    alternate: {
      description: 'Changes button to alternate style',
      defaultValue: false,
      type: { name: 'boolean' },
      table: {
        type: {
          summary: 'boolean'
        },
      },
      control: {
        type: 'boolean',
      },
    },
    extraStyleClasses: {
      description: 'List of custom CSS classes to the button',
      defaultValue: [],
      type: { name: 'array' },
      table: {
        type: {
          summary: 'array'
        },
      },
      control: {
        type: 'null',
      },
    },
    onClickHandle: {
      description: 'Function to handle button click',
      defaultValue: () => {},
      type: { name: 'function' },
      table: {
        type: {
          summary: 'function'
        },
      },
      control: {
        type: 'null',
      },
    }
  },
}

const Template = (args) => <Button {...args} />

export const Primary = Template.bind({})
Primary.args = {
  children: 'Label',
  onClickHandle: () => {
    alert('Button clicked!')
  },
}
