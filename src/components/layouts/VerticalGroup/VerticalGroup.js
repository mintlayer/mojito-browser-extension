import React, { useMemo } from 'react'

import './VerticalGroup.css'

const VerticalGroup = ({
  children,
  bigGap = false,
  midGap = false,
  smallGap = false,
  fullWidth = false,
  grow = false,
  center = false,
}) => {
  const styleClasses = useMemo(() => {
    const classes = ['v-group']
    if (bigGap) classes.push('bigGap')
    if (midGap) classes.push('midGap')
    if (smallGap) classes.push('smallGap')
    if (fullWidth) classes.push('fullWidth')
    if (grow) classes.push('grow')
    if (center) classes.push('center')
    return classes.join(' ')
  }, [bigGap, midGap, smallGap, fullWidth, grow, center])

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
