import React from 'react'

import './VerticalGroup.css'

const VerticalGroup = ({
  children,
  bigGap = false,
  midGap = false,
  smallGap = false,
  fullWidth = false,
  grow = false,
  center = false,
  className,
  ...rest
}) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    [bigGap, midGap, smallGap].filter(Boolean).length > 1
  ) {
    console.warn(
      'VerticalGroup: bigGap, midGap and smallGap are mutually exclusive; CSS source order decides the winner.',
    )
  }

  const styleClasses = [
    'v-group',
    bigGap && 'bigGap',
    midGap && 'midGap',
    smallGap && 'smallGap',
    fullWidth && 'fullWidth',
    grow && 'grow',
    center && 'center',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={styleClasses}
      data-testid="vertical-group-container"
      {...rest}
    >
      {children}
    </div>
  )
}

export default VerticalGroup
