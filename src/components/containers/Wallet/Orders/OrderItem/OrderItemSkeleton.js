import styles from './OrderItemSkeleton.module.css'

const OrderItemSkeleton = () => {
  return (
    <tr
      className={styles.row}
      data-testid="order-skeleton"
    >
      <td className={styles.orderIdCell}>
        <span className={`${styles.bar} ${styles.orderIdBar}`} />
        <span className={`${styles.bar} ${styles.rateBar}`} />
      </td>
      <td className={styles.amountCell}>
        <span className={`${styles.bar} ${styles.amountBar}`} />
      </td>
      <td className={styles.amountCell}>
        <span className={`${styles.bar} ${styles.amountBar}`} />
      </td>
      <td className={styles.chevronCell}>
        <span className={`${styles.bar} ${styles.chevronBar}`} />
      </td>
    </tr>
  )
}

export default OrderItemSkeleton
