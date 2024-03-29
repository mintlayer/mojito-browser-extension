import React, { useState, useRef } from 'react'
import ReactDOM from 'react-dom'

import { Button } from '@BasicComponents'
import { useOnClickOutside } from '@Hooks'
import { ReactComponent as IconClose } from '@Assets/images/icon-close.svg'

import './Popup.css'

const Popup = ({ children, setOpen, allowClosing = true }) => {
  const closeButtonExtraStyles = ['popupCloseButton']
  const [popupClosing, setPopupClosing] = useState(false)

  const closeButtonClickHandler = () => {
    if (!allowClosing) return
    setPopupClosing(true)
    setTimeout(() => {
      setOpen(false)
    }, 700)
  }

  const popupRef = useRef(null)
  useOnClickOutside(popupRef, closeButtonClickHandler)
  return ReactDOM.createPortal(
    <div
      className={`backdrop ${popupClosing && 'backdropClosing'}`}
      data-testid={'backdrop'}
    >
      <div
        className={`popup ${popupClosing && 'popupClosing'}`}
        data-testid={'popup'}
        ref={popupRef}
      >
        {allowClosing && (
          <Button
            alternate
            extraStyleClasses={closeButtonExtraStyles}
            onClickHandle={closeButtonClickHandler}
          >
            <IconClose />
          </Button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Popup
