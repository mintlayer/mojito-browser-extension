import React from 'react'
import { useStyleClasses } from '@Hooks'

import './Loading.css'

const Loading = ({ extraStyleClasses = [] }) => {
  const classesList = ['lds-dual-ring', ...extraStyleClasses]
  const { styleClasses } = useStyleClasses(classesList)

  return (
    <div
      className={styleClasses}
      data-testid="loading"
    ></div>
  )
}

export default Loading
