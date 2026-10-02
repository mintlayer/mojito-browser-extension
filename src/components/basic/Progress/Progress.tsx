import styles from './Progress.module.css'

interface ProgressProps {
  step: number
  total?: number
}

const Progress = ({ step, total = 4 }: ProgressProps) => {
  return (
    <div
      className={styles.track}
      data-testid="progress-track"
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`${styles.segment} ${i < step ? styles.done : ''}`}
        />
      ))}
    </div>
  )
}

export default Progress
