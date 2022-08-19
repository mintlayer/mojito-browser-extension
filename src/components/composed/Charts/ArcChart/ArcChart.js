import React, { useRef, useEffect, useState } from 'react'

import { Svg, Arc } from '@BasicComponents'

import './ArcChart.css'

const DATASAMPLE = [
  { value: 35, asset: 'ASSET 1', color: 'orange' },
  { value: 65, asset: 'ASSET 2', color: 'lightblue' },
]

const ArcChart = ({ data = DATASAMPLE, width = '200px', height = '100px' }) => {
  const container = useRef(null)
  const [tooltip] = useState(Arc.createTooltip)
  const [pieGenerator] = useState(Arc.createPieGenerator)
  const [arcGenerator] = useState(Arc.createArcGenerator)

  useEffect(() => {
    const pathData = pieGenerator(data)

    Arc.buildArc({
      pathData,
      arcGenerator,
      tooltip,
      container: container.current,
    })
  }, [data, pieGenerator, arcGenerator, tooltip])

  return (
    <Svg
      width={width}
      height={height}
      sizeH={height.includes('%') ? '100' : parseInt(height)}
      sizeW={width.includes('%') ? '202' : parseInt(width) + 2}
    >
      <g
        transform="translate(102, 100)"
        ref={container}
        data-testid="arc-container"
      />
    </Svg>
  )
}

export default ArcChart
