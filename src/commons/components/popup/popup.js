import React from 'react'
import Button from '../basic/button'
import { ReactComponent as IconClose } from '../../assets/img/icon-close.svg'
import './popup.css'

const Popup = ({ children, setOpen }) => {
  const closeButtonExtraStyles = ['popupCloseButton']
  return (
    <div
      className="backdrop"
      data-testid={'backdrop'}
    >
      <div
        className="popup"
        data-testid={'popup'}
      >
        <Button
          alternate
          extraStyleClasses={closeButtonExtraStyles}
          onClickHandle={() => setOpen(false)}
        >
          <IconClose />
        </Button>
        {children}
      </div>
    </div>
  )
}

export default Popup
