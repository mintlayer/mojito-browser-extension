import { useEffect, useState } from 'react'

import { Button } from '@BasicComponents'

import './RadioButtons.css'

const RadioButtons = ({ onSelect, value: parentValue, options, column }) => {
  const [value, setValue] = useState(parentValue)

  const onClick = (option) => {
    const newValue = value === option.name ? undefined : option.name
    setValue(newValue)
    onSelect && onSelect(newValue ? option : undefined)
  }

  useEffect(() => {
    setValue(parentValue)
  }, [parentValue])

  return (
    <div
      className={`radio-buttons ${column && 'radio-buttons-column'}`}
      data-testid="radio-buttons"
    >
      {options.map((option) => (
        <Button
          key={option.name}
          alternate={value === option.name}
          extraStyleClasses={['radio-button']}
          onClickHandle={() => onClick(option)}
        >
          {option.name}
        </Button>
      ))}
    </div>
  )
}

export default RadioButtons
