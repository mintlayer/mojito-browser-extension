import React from 'react'
import './error.css'

const Error = ({ error }) => {
  return (
    <div
      className="error"
      data-testid="error"
    >
      {error}
    </div>
  )
}

export default Error
