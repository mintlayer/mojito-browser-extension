import React, { useState, useRef } from 'react'
import ReactDOM from 'react-dom'

import { Button } from '@BasicComponents'
import { useOnClickOutside } from '@Hooks'
import { ReactComponent as IconClose } from '@Assets/images/icon-close.svg'

import styles from './Popup.module.css'

const Popup = ({ children, setOpen, allowClosing = true }) => {
  const [popupClosing, setPopupClosing] = useState(false)

  const closeButtonClickHandler = () => {
    if (!allowClosing) return
    setPopupClosing(true)
    setTimeout(() => {
      setOpen(false)
    }, 300)
  }

  const popupRef = useRef(null)
  useOnClickOutside(popupRef, closeButtonClickHandler)

  const portalTarget = document.getElementById('root') || document.body

  return ReactDOM.createPortal(
    <div
      className={`${styles.backdrop} ${popupClosing ? styles.backdropClosing : ''}`}
      data-testid={'backdrop'}
    >
      <div
        className={`${styles.popup} ${popupClosing ? styles.popupClosing : ''}`}
        data-testid={'popup'}
        ref={popupRef}
      >
        {allowClosing && (
          <Button
            extraStyleClasses={[styles.popupCloseButton]}
            onClickHandle={closeButtonClickHandler}
          >
            <IconClose />
          </Button>
        )}
        {children}
      </div>
    </div>,
    portalTarget,
  )
}

export default Popup
