import React, { useRef, useEffect, useState } from 'react'
import Svg from '../basic/svg'
import {
  createArcGenerator,
  createPieGenerator,
  createTooltip,
  buildArc
} from '../basic/arc'
import './arcChart.css'

const DATASAMPLE = [
  { value: 35, asset: 'ASSET 1', color: 'orange'},
  { value: 65, asset: 'ASSET 2', color: 'lightblue'},
]

const ArcChart = ({
  data = DATASAMPLE,
  width = '200px',
  height = '100px',
}) => {
  const container = useRef(null)
  const [tooltip] = useState(createTooltip)
  const [pieGenerator] = useState(createPieGenerator)
  const [arcGenerator] = useState(createArcGenerator)

  useEffect(() => {
    const pathData = pieGenerator(data)

    buildArc({
      pathData,
      arcGenerator,
      tooltip,
      container: container.current
    })
  }, [data, pieGenerator, arcGenerator, tooltip])

  return (
    <Svg
      width={width}
      height={height}
      sizeH={parseInt(height)}
      sizeW={parseInt(width)+2}>

      <g
        transform="translate(102, 100)"
        ref={container}
        data-testid="arc-container"/>

    </Svg>
  )
}

export default ArcChart
