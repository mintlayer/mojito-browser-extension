import React, { useState, useEffect } from 'react'

const Svg = ({ children, sizeH, sizeW, size = 100, width = 100, height = 100 }) => {
  const [viewboxWidth, setViewBoxWidth] = useState(size)
  const [viewboxHeight, setViewBoxHeight] = useState(size)

  useEffect(() => {
    sizeH ? setViewBoxHeight(sizeH) : setViewBoxHeight(size)
    sizeW ? setViewBoxWidth(sizeW) : setViewBoxWidth(size)
  }, [sizeH, sizeW, size])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewboxWidth} ${viewboxHeight}`}
      data-testid="svg-container">
      {children}
    </svg>
  )
}

export default Svg
