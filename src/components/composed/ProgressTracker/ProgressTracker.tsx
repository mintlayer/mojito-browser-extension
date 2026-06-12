import { useState } from 'react'

import styles from './ProgressTracker.module.css'

interface Step {
  name: string
  active?: boolean
}

interface ProgressTrackerProps {
  steps: Step[]
  direction?: string
}

const ProgressTracker = ({ steps }: ProgressTrackerProps) => {
  const activeIndex = steps.findIndex((step) => step.active)
  const [prevActiveIndex, setPrevActiveIndex] = useState(activeIndex)
  const [leavingIndex, setLeavingIndex] = useState(-1)

  if (prevActiveIndex !== activeIndex) {
    setLeavingIndex(prevActiveIndex)
    setPrevActiveIndex(activeIndex)
  }

  const isForward = leavingIndex < 0 || activeIndex > leavingIndex

  return (
    <ol
      className={styles.progressTracker}
      data-testid="progress-tracker-container"
    >
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex
        const isLeaving =
          index === leavingIndex && leavingIndex !== activeIndex && !isCompleted
        const dirClass = isForward ? styles.forward : styles.backward

        const classList = [styles.step]
        if (isCompleted) classList.push(styles.completed)
        if (step.active) classList.push(styles.active, dirClass)
        if (isLeaving) classList.push(styles.leaving, dirClass)

        return (
          <li
            key={`${step.name}-${index}`}
            className={classList.join(' ')}
            data-testid="progress-step"
          >
            <div className={styles.stepperBar} />
            {step.name}
          </li>
        )
      })}
    </ol>
  )
}

export default ProgressTracker
