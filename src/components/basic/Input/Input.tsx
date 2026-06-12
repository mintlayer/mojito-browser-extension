import { ChangeEvent, useEffect, useState, useMemo, useRef } from 'react'

import { ReactComponent as IconLock } from '@Assets/images/icon-lock.svg'
import { ReactComponent as IconEye } from '@Assets/images/icon-eye.svg'
import { ReactComponent as IconEyeSlash } from '@Assets/images/icon-eye-slash.svg'

import styles from './Input.module.css'

interface InputProps {
  placeholder?: string
  value?: string
  extraStyleClasses?: string[]
  onBlurHandle?: () => void
  onFocusHandle?: () => void
  onChangeHandle?: (e: ChangeEvent<HTMLInputElement>) => void
  validity?: string | null
  id?: string
  password?: boolean
  pattern?: string
  disabled?: boolean
  mask?: string | RegExp
  getMaskedValue?: (e: ChangeEvent<HTMLInputElement>) => string
  justNumbers?: boolean
  focus?: boolean
}

const Input = ({
  placeholder = 'Placeholder',
  value = '',
  extraStyleClasses = [],
  onBlurHandle = () => {},
  onFocusHandle = () => {},
  onChangeHandle = () => {},
  validity = '',
  id = '',
  password = false,
  pattern,
  disabled = false,
  mask = '',
  getMaskedValue,
  justNumbers = false,
  focus,
}: InputProps) => {
  const [val, setVal] = useState(value)
  const [type, setType] = useState(password ? 'password' : 'text')
  const [showPassword, setShowPassword] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focus && ref.current) ref.current.focus()
  }, [focus])

  useEffect(() => {
    setVal(value)
  }, [value])

  useEffect(() => {
    if (password) {
      setType(showPassword ? 'text' : 'password')
    } else {
      setType('text')
    }
  }, [password, showPassword])

  const className = useMemo(() => {
    const classes = [
      styles.input,
      ...extraStyleClasses,
      validity === 'valid' && styles.valid,
      validity === 'invalid' && styles.invalid,
    ]
      .filter(Boolean)
      .join(' ')
    return classes
  }, [extraStyleClasses, validity])

  const onChangeDefaultHandler = (ev: ChangeEvent<HTMLInputElement>) => {
    const {
      target: { value },
    } = ev

    if (justNumbers && value.match(/[^0-9,.]/)) return false

    let newValue = password ? value : value.toString().trim()
    if (mask && getMaskedValue) {
      const matchedValue = value.match(mask)
      ;(ev.target as any).matchedValue = matchedValue
      newValue = matchedValue ? getMaskedValue(ev) : ''
    }

    ev.target.value = newValue
    setVal(newValue)
    onChangeHandle(ev)
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const inputElement = (
    <input
      type={type}
      id={id}
      placeholder={placeholder}
      value={val}
      className={className}
      onBlur={onBlurHandle}
      onFocus={onFocusHandle}
      onChange={onChangeDefaultHandler}
      data-testid="input"
      pattern={pattern}
      disabled={disabled}
      ref={ref}
      autoComplete="off"
    />
  )

  if (password) {
    return (
      <div className={styles.passwordWrapper}>
        <IconLock className={styles.lockIcon} />
        {inputElement}
        <button
          type="button"
          className={styles.eyeButton}
          onClick={togglePasswordVisibility}
          data-testid="toggle-password"
        >
          {showPassword ? (
            <IconEye className={styles.eyeIcon} />
          ) : (
            <IconEyeSlash className={styles.eyeIcon} />
          )}
        </button>
      </div>
    )
  }

  return inputElement
}

export default Input
