import React from 'react'
import Popup from './Popup'

export default {
  title: 'Components/Composed/Popup',
  component: Popup,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    children: {
      description: 'Children',
      type: 'any',
      options: ['String', 'Component'],
      mapping: {
        String: 'String',
        Component: <b>A Example Component</b>,
      },
      table: {
        type: {
          summary: 'any',
        },
      },
    },
    setOpen: {
      description: 'callback after click on close button in the popup',
      action: 'setOpen',
    },
  },
}

const Template = (args) => <Popup {...args} />

export const Empty = Template.bind({})
Empty.args = {}

export const Content = Template.bind({})
Content.args = {
  children: 'String content',
}

export const Full = Template.bind({})
Full.args = {
  children: (
    <div
      style={{ backgroundColor: 'gray', width: '100%', height: '100%' }}
    ></div>
  ),
}

export const Longer = Template.bind({})
Longer.args = {
  children: (
    <div>
      {[...Array(15).keys()].map((i) => (
        <div key={i}>
          <p>data {i + 1}</p>
        </div>
      ))}
    </div>
  ),
}
