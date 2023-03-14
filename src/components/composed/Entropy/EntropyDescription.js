import React from 'react'

import './EntropyDescription.css'

import { VerticalGroup } from '@LayoutComponents'

const EntropyDescriptionItem = ({ description }) => {
  return (
    <p
      className="entropy-paragraph"
      data-testid="entropy-paragraph"
    >
      {description}
    </p>
  )
}

const EntropyDescription = ({ descriptionItems }) => {
  return (
    <div
      className="entropy-description"
      data-testid="entropy-description"
    >
      <VerticalGroup>
        {descriptionItems.map((item, index) => (
          <EntropyDescriptionItem
            key={index}
            description={item}
          />
        ))}
      </VerticalGroup>
    </div>
  )
}

export default EntropyDescription
