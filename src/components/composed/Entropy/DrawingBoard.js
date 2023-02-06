import React, { useState, useRef } from 'react'
import { Stage, Layer, Line } from 'react-konva'
import { Button } from '@BasicComponents'

import './DrawingBoard.css'

const DrawingBoard = () => {
  const tool = 'pen'
  const [lines, setLines] = useState([])
  const isDrawing = useRef(false)

  const handleMouseDown = (e) => {
    isDrawing.current = true
    const pos = e.target.getStage().getPointerPosition()
    setLines([...lines, { tool, points: [pos.x, pos.y] }])
  }

  const handleMouseMove = (e) => {
    // no drawing - skipping
    if (!isDrawing.current) {
      return
    }
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    const lastLine = lines[lines.length - 1]
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y])

    // replace last
    lines.splice(lines.length - 1, 1, lastLine)
    setLines(lines.concat())
  }

  const handleMouseUp = () => {
    isDrawing.current = false
  }

  const clearButtonClickHandler = () => {
    setLines([])
  }

  return (
    <div
      className="drawingBoard"
      data-testid="entropy-drawing-board"
    >
      <Stage
        width={337}
        height={230}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        className="drawingBoardStage"
      >
        <Layer
          className="layer"
          data-testid="drawing-board-layer"
        >
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#df4b26"
              strokeWidth={5}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                line.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}
        </Layer>
      </Stage>
      <Button
        extraStyleClasses={['clearButton']}
        onClickHandle={clearButtonClickHandler}
      >
        Clear
      </Button>
    </div>
  )
}

export default DrawingBoard
