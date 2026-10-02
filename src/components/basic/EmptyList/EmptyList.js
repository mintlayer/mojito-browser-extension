import styles from './EmptyList.module.css'

const EmptyListMessage = ({ message }) => {
  return (
    <div
      className={styles.emptyList}
      data-testid="empty-list"
    >
      {message}
    </div>
  )
}

export default EmptyListMessage
