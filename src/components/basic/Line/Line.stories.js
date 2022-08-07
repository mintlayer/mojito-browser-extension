import React from 'react'
import Line from './Line'

export default {
  title: 'Components/Basic/Line',
  component: Line,
  parameters: {
    layout: 'centered',
  },
  argTypes: {},
}

const Template = (args) => (
  <svg>
    <Line {...args} />
  </svg>
)

export const Empty = Template.bind({})
Empty.args = {
  points: [],
}

export const Lines = Template.bind({})
Lines.args = {
  points: [
    [0, 10],
    [3, 2],
    [6, 50],
    [9, 30],
    [12, 2],
    [15, 50],
  ],
}

export const Square = Template.bind({})
Square.args = {
  points: [
    [1, 1],
    [40, 1],
    [40, 40],
    [1, 40],
    [1, 1],
  ],
}
