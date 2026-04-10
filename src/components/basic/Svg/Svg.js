import React from 'react'

const Svg = ({
  children,
  sizeH,
  sizeW,
  size = 100,
  width = '100px',
  height = '100px',
}) => {
  const viewboxWidth = sizeW || size
  const viewboxHeight = sizeH || size

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewboxWidth} ${viewboxHeight}`}
      data-testid="svg-container"
    >
      {children}
    </svg>
  )
}

export default Svg
