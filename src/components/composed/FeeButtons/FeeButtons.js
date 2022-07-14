import { useEffect, useState } from 'react'

import { Button } from '@BasicComponents'

import './FeeButtons.css'

const FeeButtons = ({ onSelect, clear }) => {
  const types = [
    { name: 'Low', value: 'low' },
    { name: 'Norm', value: 'norm' },
    { name: 'High', value: 'high' },
  ]

  const [fee, setFee] = useState(undefined)

  const onClick = (newFee) => {
    setFee(fee === newFee ? undefined : newFee)
    onSelect && onSelect(newFee)
  }

  useEffect(() => {
    if (clear) {
      fee && setFee(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clear])

  return (
    <div>
      <div className="fee-buttons">
        {types.map((type) => (
          <Button
            key={type.value}
            alternate={fee === type.value}
            extraStyleClasses={['fee-button']}
            onClickHandle={() => onClick(type.value)}
          >
            {type.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default FeeButtons
