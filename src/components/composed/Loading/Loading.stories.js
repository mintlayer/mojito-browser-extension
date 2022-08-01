import React from 'react'
import Loading from './Loading'

export default {
  title: 'Components/Composed/Loading',
  component: Loading,
  parameters: {
    layout: 'centered',
  },
  argTypes: {},
}

const Template = (args) => <Loading {...args} />

export const empty = Template.bind({})
empty.args = {}
