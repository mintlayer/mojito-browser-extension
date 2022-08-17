import React from 'react'
import { line, scaleLinear, curveNatural } from 'd3'

const Line = ({
  points,
  fill = 'none',
  stroke = '#999999',
  strokeWidth = '1px',
  height,
}) => {
  const min = Math.min(...points.map((item) => Number(item[1])))
  const max = Math.max(...points.map((item) => Number(item[1])))

  const scale = scaleLinear()
    .domain([min, max])
    .range([0, parseInt(height)])

  const lineGenerator = line()
    .y((d) => scale(d[1]).toFixed(2))
    .curve(curveNatural)

  const pathData = lineGenerator(points)

  return (
    <path
      d={pathData}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      data-testid="path-container"
    />
  )
}

export default Line
