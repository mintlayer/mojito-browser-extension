import React, { useState, useRef } from 'react'
import Button from '../basic/button'
import { ReactComponent as IconClose } from '../../assets/img/icon-close.svg'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import './popup.css'

const Popup = ({ children, setOpen }) => {
  const closeButtonExtraStyles = ['popupCloseButton']
  const [popupClosing, setPopupClosing] = useState(false)

  const closeButtonClickHandler = () => {
    setPopupClosing(true)
    setTimeout(() => {
      setOpen(false)
    }, 700)
  }

  const popupRef = useRef(null)
  useOnClickOutside(popupRef, closeButtonClickHandler)
  return (
    <div
      // className="backdrop"
      className={`backdrop ${popupClosing && 'backdropClosing'}`}
      data-testid={'backdrop'}
    >
      <div
        className={`popup ${popupClosing && 'popupClosing'}`}
        data-testid={'popup'}
        ref={popupRef}
      >
        <Button
          alternate
          extraStyleClasses={closeButtonExtraStyles}
          onClickHandle={closeButtonClickHandler}
        >
          <IconClose />
        </Button>
        {children}
      </div>
    </div>
  )
}

export default Popup
