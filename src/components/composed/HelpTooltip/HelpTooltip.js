import React, { useState } from 'react'
import { Tooltip } from '@BasicComponents'

import './HelpTooltip.css'

const HelpTooltip = ({ message, link }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false)

  const toggleTooltip = () => {
    setTooltipVisible(!tooltipVisible)
  }

  return (
    <div className="link-wrapper">
      {link ? (
        <a
          href={link ? link : ''}
          target="_blank"
          className="help-link"
          onMouseEnter={toggleTooltip}
          onMouseLeave={toggleTooltip}
          data-testid="help-tooltip-link"
        >
          ?
        </a>
      ) : (
        <div
          className="help-link no-link"
          onMouseEnter={toggleTooltip}
          onMouseLeave={toggleTooltip}
          data-testid="help-tooltip"
        >
          ?
        </div>
      )}
      <Tooltip
        message={message}
        visible={tooltipVisible}
        position="right"
      />
    </div>
  )
}

export default HelpTooltip
