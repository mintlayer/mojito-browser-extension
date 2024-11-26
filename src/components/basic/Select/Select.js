import React from 'react'
import styles from './Select.module.css'

const Select = ({ options, value, onChange, placeholder }) => (
  <div className={styles.selectContainer}>
    <select
      className={styles.select}
      value={value}
      onChange={onChange}
    >
      <option
        value=""
        disabled
      >
        {placeholder}
      </option>
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  </div>
)

export default Select
