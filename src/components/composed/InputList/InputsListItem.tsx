import { ChangeEvent } from 'react'

import { Input } from '@BasicComponents'

import styles from './InputsListItem.module.css'

const genNumberClasslist = (
  value: string,
  validity: string | null,
  restoreMode: boolean,
) => {
  if (value?.length > 0 && validity === 'valid' && restoreMode) {
    return `${styles.number} ${styles.numberFinished}`
  } else if (validity === 'invalid' && value?.length > 0 && restoreMode) {
    return `${styles.number} ${styles.numberInvalid}`
  } else {
    return styles.number
  }
}

interface InputListItemProps {
  number?: number
  value: string
  validity: string | null
  onChangeHandle: (e: ChangeEvent<HTMLInputElement>) => void
  restoreMode: boolean
}

const InputListItem = ({
  number,
  value,
  validity,
  onChangeHandle,
  restoreMode,
}: InputListItemProps) => {
  const inputExtraClasses = [styles.wordsListInput]

  restoreMode
    ? inputExtraClasses.push(styles.wordsListInputRestore)
    : inputExtraClasses.push(styles.readonly)

  if (validity === 'valid' && restoreMode) {
    inputExtraClasses.push(styles.inputRestoreFinished)
  }

  return (
    <li
      className={styles.listItem}
      data-testid="inputs-list-item"
    >
      <Input
        validity={validity}
        value={value}
        onChangeHandle={onChangeHandle}
        extraStyleClasses={inputExtraClasses}
        placeholder={'Word'}
        disabled={!restoreMode}
      />
      {number && (
        <div
          className={
            restoreMode
              ? genNumberClasslist(value, validity, restoreMode)
              : styles.number
          }
          data-testid="inputs-list-item-number"
        >
          {number}
        </div>
      )}
    </li>
  )
}

export { genNumberClasslist }
export default InputListItem
