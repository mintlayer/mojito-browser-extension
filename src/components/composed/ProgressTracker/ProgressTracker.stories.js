import React from 'react'
import ProgressTracker from './ProgressTracker'

export default {
  title: 'Components/Composed/ProgressTracker',
  component: ProgressTracker,
  parameters: {
    layout: 'centered',
  },
  argTypes: {},
}

const Template = (args) => <ProgressTracker {...args} />

export const Steps1 = Template.bind({})
Steps1.args = {
  steps: [{ name: 'Step 1' }],
}

export const empty = Template.bind({})
empty.args = {
  steps: [],
}

export const Steps5 = Template.bind({})
Steps5.args = {
  steps: [
    { name: 'Step 1' },
    { name: 'Step 2', active: true },
    { name: 'Step 3' },
    { name: 'Step 4' },
    { name: 'Step 5' },
  ],
}

export const StepsLonger = Template.bind({})
StepsLonger.args = {
  steps: [...Array(15).keys()].map((i) => ({ name: `Step ${i + 1}` })),
}
