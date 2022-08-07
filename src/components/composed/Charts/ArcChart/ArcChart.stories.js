import React from 'react'
import ArcChart from './ArcChart'

export default {
  title: 'Components/Composed/ArcChart',
  component: ArcChart,
  args: {
    data: [],
    width: '100%',
    height: '100%',
  },
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    data: {
      description: 'List of Arc Chart data',
      type: 'array',
      table: {
        type: {
          summary: 'Array<{ value: number, asset: string, color: string }>',
        },
      },
    },
    width: {
      description: 'width of the chart',
      type: { name: 'string', required: false },
      table: {
        type: {
          summary: 'string',
        },
      },
      control: {
        type: 'text',
      },
    },
    height: {
      description: 'height of the chart',
      type: { name: 'string', required: false },
      table: {
        type: {
          summary: 'string',
        },
      },
      control: {
        type: 'text',
      },
    },
  },
}

const Template = (args) => <ArcChart {...args} />

export const Data3 = Template.bind({})
Data3.args = {
  data: [
    { value: 10, asset: 'BTC', color: 'orange' },
    { value: 40, asset: 'MLT', color: 'blue' },
    { value: 20, asset: 'ETH', color: 'red' },
  ],
  width: '200px',
  height: '100px',
}

export const Empty = Template.bind({})
Empty.args = {}
