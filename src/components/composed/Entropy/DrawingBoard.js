import React, { useRef, useContext } from 'react'
import { Stage, Layer, Line } from 'react-konva'
import { Button } from '@BasicComponents'
import { AccountContext } from '@Contexts'

import { ReactComponent as IconCLose } from '@Assets/images/icon-close.svg'

import './DrawingBoard.css'

const DrawingBoard = () => {
  const { lines, setLines, setEntropy } = useContext(AccountContext)
  const tool = 'pen'
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
    setEntropy([])
  }

  return (
    <div
      className="drawingBoard"
      data-testid="entropy-drawing-board"
    >
      <Stage
        width={337}
        height={238}
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
              stroke="rgb(55, 219, 140)"
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
        alternate
        onClickHandle={clearButtonClickHandler}
      >
        <IconCLose /> Clear
      </Button>
    </div>
  )
}

export default DrawingBoard
