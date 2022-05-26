import Input from '../basic/input'
import './inputsListItem.css'

/* istanbul ignore next */
export const genNumberClasslist = (value, validity, restoreMode) => {
  if (value?.length > 0 && validity === 'valid' && restoreMode) {
    return 'number number-finished'
  } else if (validity === 'invalid' && value?.length > 0 && restoreMode) {
    return 'number number-invalid'
  } else {
    return 'number'
  }
}

const InputListItem = ({number, value, validity, onChangeHandle, restoreMode}) => {
  const inputExtraClasses = ['words-list-input']
  // const inputExtraClassesFinished = ['words-list-input', 'words-list-input-finished']

  restoreMode && inputExtraClasses.push('words-list-input-restore')

  return (
    <li className='list-item' data-testid="inputs-list-item">
      <Input validity={validity} value={value} onChangeHandle={onChangeHandle} extraStyleClasses={inputExtraClasses} placeholder={'Word'} />
      {restoreMode && number && <div className={genNumberClasslist(value, validity, restoreMode)}  data-testid="inputs-list-item-number">{number}
      </div>}
    </li>
  )
}

export default InputListItem
