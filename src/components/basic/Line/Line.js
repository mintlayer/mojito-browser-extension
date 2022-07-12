import React from 'react'
import { line } from 'd3'

const Line = ({ points, fill = 'none', stroke = '#999999' }) => {
  const lineGenerator = line()
  const pathData = lineGenerator(points)

  return (
    <path
      d={pathData}
      fill={fill}
      stroke={stroke}
      data-testid="path-container"
    />
  )
}

export default Line
