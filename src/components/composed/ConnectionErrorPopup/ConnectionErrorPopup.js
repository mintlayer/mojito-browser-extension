import React from 'react'

import { PopUp } from '@ComposedComponents'
import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'

import './ConnectionErrorPopup.css'

const ConnectionErrorPopup = ({ onClickHandle }) => {
  return (
    <PopUp setOpen={onClickHandle}>
      <CenteredLayout>
        <VerticalGroup bigGap>
          <p
            className="connection-error-message"
            data-testid="connection-error-message"
          >
            Connection with server is lost. Please, check your internet
            connection or try again later.
          </p>
          <CenteredLayout>
            <Button onClickHandle={onClickHandle}>Close</Button>
          </CenteredLayout>
        </VerticalGroup>
      </CenteredLayout>
    </PopUp>
  )
}
export default ConnectionErrorPopup
