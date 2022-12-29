import { useEffect, useState } from 'react'

import { Button } from '@BasicComponents'

import './RadioButtons.css'

const RadioButtons = ({
  onSelect,
  value: parentValue,
  options,
  column,
  buttonExtraStyles,
}) => {
  const [value, setValue] = useState(parentValue)

  const onClick = (option) => {
    const newValue = value === option.value ? undefined : option.value
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
          key={option.value}
          alternate={value === option.value}
          extraStyleClasses={['radio-button', buttonExtraStyles]}
          onClickHandle={() => onClick(option)}
        >
          {option.name}
        </Button>
      ))}
    </div>
  )
}

export default RadioButtons
