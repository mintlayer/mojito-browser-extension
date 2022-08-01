import React from 'react'
import RadioButtons from './RadioButtons'

export default {
  title: 'Components/Composed/RadioButtons',
  component: RadioButtons,
  args: {
    options: [],
  },
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    options: {
      description: 'Array of options to display',
      table: {
        type: {
          summary: 'Array<{name: string, value: string}>',
        },
      },
      control: {
        type: 'array',
      },
    },
    value: {
      description: 'Value of the selected option',
      table: {
        type: {
          summary: 'string',
        },
      },
      control: {
        type: 'text',
      },
    },
    onSelect: {
      description: 'Function to set value',
      action: 'onSelect',
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

const Template = (args) => <RadioButtons {...args} />

export const LowNormHigh = Template.bind({})
LowNormHigh.args = {
  value: 'low',
  options: [
    { name: 'low', value: 'low' },
    { name: 'norm', value: 'norm' },
    { name: 'high', value: 'high' },
  ],
}

export const empty = Template.bind({})
empty.args = {}

export const selected = Template.bind({})
selected.args = {
  value: 'selected',
  options: [
    { name: 'selected', value: 'selected' },
    { name: 'noSelected', value: 'noSelected' },
    { name: 'other', value: 'other' },
  ],
}
