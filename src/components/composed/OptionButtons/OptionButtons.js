import { useEffect, useState } from 'react'

import { Button } from '@BasicComponents'

import './OptionButtons.css'

const OptionButtons = ({
  onSelect,
  value: parentValue,
  options,
  column,
  buttonExtraStyles,
  multiple,
}) => {
  const [value, setValue] = useState(parentValue)

  const isAlternate = (option) => {
    if (multiple) {
      return value.includes(option.value)
    } else {
      return value === option.value
    }
  }

  const singleClick = (option) => {
    const newValue = value === option.value ? undefined : option.value
    setValue(newValue)
    onSelect && onSelect(newValue ? option : undefined)
  }

  const multipleClick = (option) => {
    if (value.includes(option.value)) {
      const newValue = value.filter((item) => item !== option.value)
      setValue(newValue)
      onSelect && onSelect(newValue ? newValue : undefined)
    } else {
      onSelect && onSelect([...value, option.value])
      setValue([...value, option.value])
    }
  }

  const onClick = (option) => {
    if (option.disabled) return
    multiple ? multipleClick(option) : singleClick(option)
  }

  useEffect(() => {
    setValue(parentValue)
  }, [parentValue])

  return (
    <div
      className={`option-buttons ${column && 'option-buttons-column'}`}
      data-testid="option-buttons"
    >
      {options.map((option) => (
        <Button
          key={option.value}
          alternate={isAlternate(option)}
          extraStyleClasses={['option-button', buttonExtraStyles]}
          onClickHandle={() => onClick(option)}
          disabled={option.disabled}
        >
          {option.name}
        </Button>
      ))}
    </div>
  )
}

export default OptionButtons
