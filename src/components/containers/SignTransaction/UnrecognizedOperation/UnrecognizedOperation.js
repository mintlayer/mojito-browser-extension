import styles from './UnrecognizedOperation.module.css'

const UnrecognizedOperation = () => (
  <div
    className={styles.notice}
    data-testid="unrecognized-operation"
  >
    <h4 className={styles.title}>This operation is not recognized</h4>
    <p className={styles.text}>
      The wallet cannot name what this transaction does. Read the inputs and
      outputs below, and sign it only if you know what you are approving.
    </p>
  </div>
)

export default UnrecognizedOperation
