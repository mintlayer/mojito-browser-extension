// import React, { useEffect, useState } from 'react'

import './ProgressTracker.css'

const defaultSteps = [
  { name: 'Step 1' },
  { name: 'Step 2', active: true },
  { name: 'Step 3' },
]

const ProgressTracker = ({ steps = defaultSteps, direction }) => {
  return (
    <ol
      className="progressTracker"
      data-testid="progress-tracker-container"
    >
      {steps.map((step, index) => (
        <li
          key={`${step.name}-${index}`}
          //if previous step add class previous
          className={`step ${step.active && 'active'} ${direction === 'backward' ? 'backward' : ''}`}
          data-testid="progress-step"
        >
          <div className="stepper-bar" />
          {step.name}
        </li>
      ))}
    </ol>
  )
}

export default ProgressTracker
