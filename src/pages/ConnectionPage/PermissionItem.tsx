import { FC, SVGProps } from 'react'

import styles from './PermissionItem.module.css'

interface PermissionItemProps {
  icon: FC<SVGProps<SVGSVGElement>>
  title: string
  description: string
}

const PermissionItem = ({
  icon: Icon,
  title,
  description,
}: PermissionItemProps) => {
  return (
    <li className={styles.item}>
      <span className={styles.iconWrapper}>
        <Icon className={styles.icon} />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.description}>{description}</span>
      </span>
    </li>
  )
}

export default PermissionItem
