import React from 'react'

import './CenteredLayout.css'

const CenteredLayout = ({ children }) => {
  return (
    <div
      className="centeredLayout"
      data-testid="centered-layout-container"
    >
      {children}
    </div>
  )
}

export default CenteredLayout
