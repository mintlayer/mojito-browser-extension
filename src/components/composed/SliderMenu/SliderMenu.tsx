import React, {
  ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react'
import ReactDOM from 'react-dom'
import { Button } from '@BasicComponents'
import { ReactComponent as IconClose } from '@Assets/images/icon-close.svg'

import styles from './SliderMenu.module.css'

interface SliderMenuProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
}

const SliderMenu = ({ children, isOpen, onClose }: SliderMenuProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [prevIsOpen, setPrevIsOpen] = useState(false)

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setIsVisible(true)
    }
  }

  useEffect(() => {
    if (!isOpen && isVisible) {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isVisible])

  const sliderRef = useRef<HTMLDivElement>(null)

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  const portalTarget = document.getElementById('root') || document.body

  const sliderMenuClass = `${styles.sliderMenu} ${isOpen ? styles.open : styles.close}`

  return ReactDOM.createPortal(
    isVisible && (
      <div
        className={styles.backdrop}
        data-testid="backdrop"
        onClick={handleBackdropClick}
      >
        <div
          ref={sliderRef}
          className={sliderMenuClass}
          data-testid="slider-menu"
        >
          <Button
            extraStyleClasses={[styles.closeButton]}
            onClickHandle={onClose}
          >
            <IconClose />
          </Button>
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    ),
    portalTarget,
  )
}

export default SliderMenu
