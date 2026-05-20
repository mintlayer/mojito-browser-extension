import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Button } from '@BasicComponents'
import { ReactComponent as IconClose } from '@Assets/images/icon-close.svg'
import { useOnClickOutside } from '@Hooks'
import './SliderMenu.css'

const SliderMenu = ({ children, isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [prevIsOpen, setPrevIsOpen] = useState(false)
  const closeButtonExtraStyles = ['slider-menu-close-button']

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setIsVisible(true)
    }
  }

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const sliderRef = useRef(null)
  useOnClickOutside(sliderRef, onClose)

  const portalTarget = document.getElementById('root') || document.body

  return ReactDOM.createPortal(
    isVisible && (
      <div
        className={'backdrop-slider-menu'}
        data-testid={'backdrop'}
      >
        <div
          ref={sliderRef}
          className={`slider-menu ${isOpen ? 'open' : 'close'}`}
          data-testid={'slider-menu'}
        >
          <Button
            extraStyleClasses={closeButtonExtraStyles}
            onClickHandle={onClose}
          >
            <IconClose />
          </Button>
          <div className="slider-menu-content">{children}</div>
        </div>
      </div>
    ),
    portalTarget,
  )
}

export default SliderMenu
