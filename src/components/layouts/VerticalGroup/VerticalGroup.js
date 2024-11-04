import React, { useEffect } from 'react'
import { useStyleClasses } from '@Hooks'

import './VerticalGroup.css'

const VerticalGroup = ({
  children,
  bigGap = false,
  midGap = false,
  smallGap = false,
  fullWidth = false,
}) => {
  const classesList = ['v-group']
  bigGap && classesList.push('bigGap')
  midGap && classesList.push('midGap')
  smallGap && classesList.push('smallGap')
  fullWidth && classesList.push('fullWidth')
  const { styleClasses, addStyleClass, removeStyleClass } =
    useStyleClasses(classesList)

  useEffect(() => {
    bigGap ? addStyleClass('bigGap') : removeStyleClass('bigGap')
  }, [bigGap, addStyleClass, removeStyleClass])

  useEffect(() => {
    midGap ? addStyleClass('midGap') : removeStyleClass('midGap')
  }, [midGap, addStyleClass, removeStyleClass])

  useEffect(() => {
    smallGap ? addStyleClass('smallGap') : removeStyleClass('smallGap')
  }, [smallGap, addStyleClass, removeStyleClass])

  useEffect(() => {
    fullWidth && addStyleClass('fullWidth')
  }, [fullWidth, addStyleClass, removeStyleClass])

  return (
    <div
      className={styleClasses}
      data-testid="vertical-group-container"
    >
      {children}
    </div>
  )
}

export default VerticalGroup
