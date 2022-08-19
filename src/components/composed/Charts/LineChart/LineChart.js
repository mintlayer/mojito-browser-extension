import React, { useState, useEffect } from 'react'

import { Svg, Line } from '@BasicComponents'

const POINTSSAMPLE = [
  [0, 10],
  [3, 2],
  [6, 50],
  [9, 30],
  [12, 2],
  [15, 50],
]

const EXTRABOUNDARIES = 5

const maxWidthPoint = (points) =>
  points.reduce((max, coordinate) => {
    const x = coordinate[0]
    return max < x ? x : max
  }, 0)

const maxHeightPoint = (points) =>
  points.reduce((max, coordinate) => {
    const y = coordinate[1]
    return max < y ? y : max
  }, 0)

const getProportionalHeight = (size, width) => {
  const proportion = size.h / size.w || 0
  return `${Math.round(proportion * parseInt(width))}px`
}

const LineChart = ({
  lineColor,
  lineWidth,
  points = POINTSSAMPLE,
  height,
  width = '100px',
}) => {
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [proportionalHeight, setProportionalHeight] = useState()

  useEffect(() => {
    setSize({
      w: maxWidthPoint(points) + EXTRABOUNDARIES,
      h: parseInt(height) + EXTRABOUNDARIES,
    })
  }, [points, height])

  useEffect(() => {
    setProportionalHeight(height || getProportionalHeight(size, width))
  }, [width, height, size])

  return (
    <Svg
      width={width}
      height={proportionalHeight}
      sizeH={size.h}
      sizeW={size.w}
    >
      <Line
        points={points}
        stroke={lineColor}
        height={height}
        strokeWidth={lineWidth}
      />
    </Svg>
  )
}

export { maxWidthPoint, maxHeightPoint, getProportionalHeight, EXTRABOUNDARIES }
export default LineChart
