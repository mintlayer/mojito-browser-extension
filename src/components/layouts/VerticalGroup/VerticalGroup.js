import React, { useEffect } from 'react'
import { useStyleClasses } from '@Hooks'

import './VerticalGroup.css'

const VerticalGroup = ({ children, bigGap = false }) => {
  const classesList = ['v-group']
  bigGap && classesList.push('bigGap')
  const { styleClasses, addStyleClass, removeStyleClass } =
    useStyleClasses(classesList)

  useEffect(() => {
    bigGap ? addStyleClass('bigGap') : removeStyleClass('bigGap')
  }, [bigGap, addStyleClass, removeStyleClass])

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
