import { ReactNode, MouseEvent } from 'react'

import styles from './Button.module.css'

interface ButtonProps {
  children?: ReactNode
  alternate?: boolean
  dark?: boolean
  onClickHandle?: (e: MouseEvent<HTMLButtonElement>) => void
  extraStyleClasses?: string[]
  disabled?: boolean
  buttonType?: 'button' | 'submit' | 'reset'
  dataTestId?: string
  onMouseEnter?: (e: MouseEvent<HTMLButtonElement>) => void
  onMouseLeave?: (e: MouseEvent<HTMLButtonElement>) => void
  autoFocus?: boolean
}

const Button = ({
  children = 'Label',
  alternate = false,
  dark = false,
  onClickHandle = () => {},
  extraStyleClasses = [],
  disabled = false,
  buttonType = 'button',
  dataTestId = 'button',
  onMouseEnter,
  onMouseLeave,
  autoFocus = false,
}: ButtonProps) => {
  const classList = [styles.btn, ...extraStyleClasses]
  if (dark) {
    classList.push(styles.dark)
  } else if (alternate) {
    classList.push(styles.alternate)
  }
  const styleClasses = classList.join(' ')

  return (
    <button
      className={styleClasses}
      onClick={onClickHandle}
      data-testid={dataTestId}
      disabled={disabled}
      type={buttonType}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      autoFocus={autoFocus}
    >
      {children}
    </button>
  )
}

export default Button
