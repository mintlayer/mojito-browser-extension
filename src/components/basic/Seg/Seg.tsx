import styles from './Seg.module.css'

interface SegProps {
  value: string
  options: Array<string | [string, string]>
  onChange: (value: string) => void
}

// Segmented control from the design system.
const Seg = ({ value, options, onChange }: SegProps) => {
  return (
    <div
      className={styles.seg}
      data-testid="seg"
    >
      {options.map((o) => {
        const [v, l] = Array.isArray(o) ? o : [o, o]
        return (
          <button
            key={v}
            className={`${styles.item} ${value === v ? styles.on : ''}`}
            onClick={() => onChange(v)}
            type="button"
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}

export default Seg
