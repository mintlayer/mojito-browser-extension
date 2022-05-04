import React from 'react'

const Svg = ({ children, size, width = 100 }) => (
  <svg width={width} viewBox={`0 0 ${size} ${size}`} data-testid="svg-container">
    {children}
  </svg>
)

export default Svg
