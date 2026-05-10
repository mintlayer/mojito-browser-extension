import { useEffect, useRef, ChangeEvent } from 'react'

import InputListItem from './InputsListItem'

import styles from './InputsList.module.css'

interface InputField {
  order: number
  validity: boolean | null
  value: string
}

const isInputValid = (
  input: { value: string; order: number },
  words: string[],
  DefaultWordList: string[] = [],
) => {
  const value = input.value
  return words?.length > 0
    ? words[input.order] === value
    : DefaultWordList.includes(input.value)
}

interface InputsListProps {
  fields: InputField[]
  setFields: (fields: InputField[]) => void
  restoreMode: boolean
  wordsList?: string[]
  BIP39DefaultWordList?: string[]
  amountOfWords?: number
}

const InputsList = ({
  fields,
  setFields,
  restoreMode,
  wordsList = [],
  BIP39DefaultWordList,
  amountOfWords = 12,
}: InputsListProps) => {
  const effectCalled = useRef(false)

  useEffect(() => {
    if (effectCalled.current) return
    if (!wordsList.length && !restoreMode) return
    if (!restoreMode && wordsList.filter((x) => !!x).length === 0) return
    effectCalled.current = true

    let newFields
    if (wordsList.length) {
      newFields = wordsList.map((word, index) => ({
        order: index,
        validity: null,
        value: restoreMode ? '' : word,
      }))
    } else {
      newFields = [...new Array(amountOfWords)].map((_, index) => ({
        order: index,
        validity: null,
        value: '',
      }))
    }

    setFields(newFields)
  }, [wordsList, setFields, restoreMode, amountOfWords])

  const getFieldByIndex = (index: number) => fields[index]

  const setFieldValidity = (field: InputField, validity: boolean) => ({
    ...field,
    validity,
  })

  const onChangeHandler = (
    { target }: ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const originalField = getFieldByIndex(index)
    originalField.value = target.value

    const validatedField = setFieldValidity(
      originalField,
      isInputValid(originalField, wordsList, BIP39DefaultWordList),
    )
    const newFields = [...fields]
    newFields[index] = validatedField

    setFields(newFields)
  }

  return (
    <ul
      className={styles.inputsList}
      data-testid="inputs-list"
    >
      {fields &&
        fields.map((field) => (
          <InputListItem
            key={`word-${field.order}`}
            number={field.order + 1}
            validity={
              field.validity === null
                ? null
                : field.validity
                  ? 'valid'
                  : 'invalid'
            }
            value={field.value}
            onChangeHandle={(e: ChangeEvent<HTMLInputElement>) =>
              onChangeHandler(e, field.order)
            }
            restoreMode={restoreMode}
          />
        ))}
    </ul>
  )
}

export { isInputValid }
export type { InputField }
export default InputsList
