/* eslint-disable no-undef */
import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Button } from '@BasicComponents'
import { ReactComponent as IconClose } from '@Assets/images/icon-close.svg'
import { useOnClickOutside } from '@Hooks'
import './SliderMenu.css'

const SliderMenu = ({ children, isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const closeButtonExtraStyles = ['slider-menu-close-button']

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300) // Match the duration of the CSS animation
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const sliderRef = useRef(null)
  useOnClickOutside(sliderRef, onClose)

  const mainElement = document.querySelector('main')
    ? document.querySelector('main')
    : document.body

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
            alternate
            extraStyleClasses={closeButtonExtraStyles}
            onClickHandle={onClose}
          >
            <IconClose />
          </Button>
          <div className="slider-menu-content">{children}</div>
        </div>
      </div>
    ),
    mainElement,
  )
}

export default SliderMenu
