import { useEffect, useState } from 'react'

import { Button } from '@BasicComponents'

import './RadioButtons.css'

const RadioButtons = ({ onSelect, value: parentValue, options }) => {
  const [value, setValue] = useState(parentValue)

  const onClick = (newValue) => {
    setValue(value === newValue ? undefined : newValue)
    onSelect && onSelect(newValue)
  }

  useEffect(() => {
    setValue(parentValue)
  }, [parentValue])

  return (
    <div className="radio-buttons">
      {options.map((type) => (
        <Button
          key={type.value}
          alternate={value === type.value}
          extraStyleClasses={['radio-button']}
          onClickHandle={() => onClick(type.value)}
        >
          {type.name}
        </Button>
      ))}
    </div>
  )
}

export default RadioButtons
