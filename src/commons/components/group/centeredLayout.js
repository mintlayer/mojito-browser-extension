import React from 'react'

import './centeredLayout.css'

const CenteredLayout = ({ children }) => {
  return (
    <div className="centeredLayout" data-testid="centered-layout-container">
      {children}
    </div>
  )
}

export default CenteredLayout
