import React from 'react'
import styles from './Select.module.css'

const Select = ({ options, value, onChange, placeholder = 'Select' }) => (
  <select
    value={value}
    onChange={onChange}
    className={styles.select}
  >
    <option value="">{placeholder}</option>
    {options.map((option) => (
      <option
        key={option.value}
        value={option.value}
      >
        {option.label}
      </option>
    ))}
  </select>
)

export default Select
