import { ReactNode, useId, useEffect, useState, ChangeEvent } from 'react'

import { Input, Error } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'

import styles from './TextField.module.css'

interface TextFieldProps {
  label?: ReactNode
  labelPosition?: 'center' | 'left' | 'right'
  placeHolder?: string
  alternate?: boolean
  password?: boolean
  value?: string
  onChangeHandle?: (value: string) => void
  validity?: boolean | null
  pattern?: string
  extraStyleClasses?: string[]
  errorMessages?: string | null
  pristinity?: boolean
  focus?: boolean
  bigGap?: boolean
}

const TextField = ({
  label,
  labelPosition = 'center',
  placeHolder = 'Placeholder',
  alternate = false,
  password = false,
  value,
  onChangeHandle,
  validity,
  pattern,
  extraStyleClasses,
  errorMessages,
  pristinity = true,
  focus = true,
  bigGap = false,
}: TextFieldProps) => {
  const inputId = useId()
  const [isPristine, setIsPristine] = useState(true)
  const [fieldValidity, setFieldValidity] = useState<string | null>(null)

  useEffect(() => {
    if (isPristine || validity === null || validity === undefined) return
    validity ? setFieldValidity('valid') : setFieldValidity('invalid')
  }, [validity, isPristine])

  useEffect(() => {
    setIsPristine(pristinity)
  }, [pristinity])

  const setPristineState = () => setIsPristine(false)

  const labelClasses = [
    styles.inputLabel,
    alternate && styles.alternate,
    labelPosition === 'left' && styles.inputLabelLeft,
    labelPosition === 'right' && styles.inputLabelRight,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <VerticalGroup bigGap={bigGap}>
      {label && (
        <label
          htmlFor={inputId}
          className={labelClasses}
          data-testid="label"
        >
          {label}
        </label>
      )}
      <Input
        id={inputId}
        placeholder={placeHolder}
        password={password}
        value={value}
        onChangeHandle={(e: ChangeEvent<HTMLInputElement>) =>
          onChangeHandle && onChangeHandle(e.target.value)
        }
        validity={fieldValidity}
        pattern={pattern}
        extraStyleClasses={extraStyleClasses}
        onBlurHandle={setPristineState}
        focus={focus}
      />
      {errorMessages && !isPristine && <Error error={errorMessages} />}
    </VerticalGroup>
  )
}

export default TextField
