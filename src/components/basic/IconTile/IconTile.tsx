import { ReactNode } from 'react'
import styles from './IconTile.module.css'
import Icon from '../Icon/Icon'

interface IconTileProps {
  icon: string
  color?: string
  size?: number
  radius?: number | string
  bg?: string
  children?: ReactNode
}

// Colored rounded tile holding an icon (design system).
const IconTile = ({
  icon,
  color = 'var(--be-text-1)',
  size = 32,
  radius = 10,
  bg,
  children,
}: IconTileProps) => {
  return (
    <div
      className={styles.tile}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: bg || `oklch(from ${color} l c h / 0.14)`,
      }}
      data-testid="icon-tile"
    >
      {icon ? (
        <Icon
          name={icon}
          size={size * 0.47}
          color={color}
        />
      ) : (
        children
      )}
    </div>
  )
}

export default IconTile
