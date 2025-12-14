import React from 'react'

const SvgMock = React.forwardRef((props, ref) => {
  const { className, ...rest } = props
  return (
    <svg
      ref={ref}
      className={className}
      data-testid={props['data-testid'] || 'svg-mock'}
      {...rest}
    />
  )
})

SvgMock.displayName = 'SvgMock'

export default SvgMock
export const ReactComponent = SvgMock
