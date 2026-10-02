import React from 'react'

import './CenteredLayout.css'

const CenteredLayout = ({ children, className, ...rest }) => {
  return (
    <div
      className={['centeredLayout', className].filter(Boolean).join(' ')}
      data-testid="centered-layout-container"
      {...rest}
    >
      {children}
    </div>
  )
}

export default CenteredLayout
