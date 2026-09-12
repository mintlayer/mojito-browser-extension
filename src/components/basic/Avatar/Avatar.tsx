import styles from './Avatar.module.css'

interface AvatarProps {
  name: string
  color?: string
  size?: number
}

// Account avatar with gradient from the design system.
const Avatar = ({
  name,
  color = 'var(--be-amber)',
  size = 28,
}: AvatarProps) => {
  return (
    <div
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: `linear-gradient(135deg, ${color}, oklch(from ${color} calc(l - 0.15) c h))`,
        font: `700 ${size * 0.42}px Montserrat, sans-serif`,
      }}
      data-testid="avatar"
    >
      {name[0]}
    </div>
  )
}

export default Avatar
