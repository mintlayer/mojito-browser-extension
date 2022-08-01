import React from 'react'
import Svg from './Svg'

export default {
  title: 'Components/Basic/Svg',
  component: Svg,
  parameters: {
    layout: 'centered',
  },
  argTypes: {},
}

const Template = (args) => <Svg {...args} />

export const Semicircle = Template.bind({})
Semicircle.args = {
  size: 100,
  width: '200px',
  height: '100px',
  children: <circle r="600"></circle>,
}

export const Empty = Template.bind({})
Empty.args = {}
