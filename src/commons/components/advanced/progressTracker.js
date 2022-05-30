import React from 'react'

import './progressTracker.css'

const defaultSteps = [
  { name: 'Step 1' },
  { name: 'Step 2', active: true },
  { name: 'Step 3' },
]

const ProgressTracker = ({ steps = defaultSteps }) => {
  return (
    <ol className="progressTracker" data-testid="progress-tracker-container">
      {steps.map((step, index) => (
        <li
          key={`${step.name}-${index}`}
          className={`step ${step.active && 'active'}`}
          data-testid="progress-step"
        >
          {step.name}
        </li>
      ))}
    </ol>
  )
}

export default ProgressTracker
