import Loading from '../Loading/Loading.tsx'

import styles from './LoadingScreen.module.css'

const LoadingScreen = ({ text }) => {
  return (
    <div
      className={styles.loadingScreen}
      data-testid="loading-screen"
    >
      <h1 className={styles.text}>{text}</h1>
      <Loading extraStyleClasses={[styles.spinner]} />
    </div>
  )
}

export default LoadingScreen
