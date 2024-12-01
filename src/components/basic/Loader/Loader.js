import styles from './Loader.module.css'

const Loader = () => {
  return (
    <div
      className={styles.ldsEllipsis}
      data-testid="loader"
    >
      <div data-testid="loader-dot"></div>
      <div data-testid="loader-dot"></div>
      <div data-testid="loader-dot"></div>
      <div data-testid="loader-dot"></div>
    </div>
  )
}

export default Loader
