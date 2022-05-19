import React from 'react'

import './verticalGroup.css'

const VerticalGroup = ({children}) => {
  return (
    <div
      className="v-group"
      data-testid="vertical-group-container">
      {children}
    </div>
  )
}

export default VerticalGroup
