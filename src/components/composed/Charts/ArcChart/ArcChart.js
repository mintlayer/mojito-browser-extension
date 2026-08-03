import React, { useRef, useEffect, useState } from 'react'

import { Svg, Arc } from '@BasicComponents'

const DATASAMPLE = [
  { value: 35, asset: 'ASSET 1', color: 'orange' },
  { value: 65, asset: 'ASSET 2', color: 'lightblue' },
]

const ArcChart = ({ data = DATASAMPLE, width = '200px', height = '100px' }) => {
  const container = useRef(null)
  const [pieGenerator] = useState(Arc.createPieGenerator)
  const [arcGenerator] = useState(Arc.createArcGenerator)

  useEffect(() => {
    const pathData = pieGenerator(data)

    Arc.buildArc({
      pathData,
      arcGenerator,
      container: container.current,
    })
  }, [data, pieGenerator, arcGenerator])

  const sorted = [...data].sort((a, b) => b.value - a.value)
  const firstColor = sorted[0]?.color || '#37DB8C'
  const lastColor = sorted[sorted.length - 1]?.color || '#37DB8C'
  const dotRadius = 98

  return (
    <Svg
      width={width}
      height={height}
      sizeH={height.includes('%') ? '110' : parseInt(height) + 10}
      sizeW={width.includes('%') ? '210' : parseInt(width) + 10}
    >
      <g
        transform="translate(105, 105)"
        ref={container}
        data-testid="arc-container"
      />
      <circle
        cx={105 - dotRadius}
        cy={104}
        r={4}
        fill={firstColor}
        data-testid="arc-dot-left"
      />
      <circle
        cx={105 + dotRadius}
        cy={104}
        r={4}
        fill={lastColor}
        data-testid="arc-dot-right"
      />
    </Svg>
  )
}

export default ArcChart
