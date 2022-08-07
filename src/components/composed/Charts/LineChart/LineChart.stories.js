import React from 'react'
import LineChart from './LineChart'

export default {
  title: 'Components/Composed/LineChart',
  component: LineChart,
  args: {
    points: [],
    width: '300px',
    height: '300px',
  },
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    points: {
      description: 'Points of the line chart',
      table: {
        type: {
          summary: 'Array<[number,number]>',
        },
      },
      control: {
        type: 'array',
      },
    },
    width: {
      description: 'height of the chart',
      type: { name: 'string', required: false },
      table: {
        type: {
          summary: 'string',
        },
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
    },
  },
}
const Template = (args) => <LineChart {...args} />

export const Lines = Template.bind({})
Lines.args = {
  points: [
    [0, 10],
    [3, 2],
    [6, 50],
    [9, 30],
    [12, 2],
    [15, 40],
  ],
  height: '500px',
  width: '400px',
}

export const Empty = Template.bind({})
Empty.args = {}
