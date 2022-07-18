import { Button, Input } from '@BasicComponents'
import './createTransactionField.css'
import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow.svg'

const CreateTransactionFiled = ({
  label,
  buttonTitle,
  placeholder,
  buttonClickHandler,
  withIcon,
  bottomText,
  value,
  onChengeHandle,
}) => {
  const buttonExtraClasses = ['create-trasaction-button']
  const inputExtraClasses = ['create-trasaction-input']
  return (
    <div
      className={`create-tr-field ${bottomText && 'create-tr-field-bottom'}`}
      data-testid="create-transaction-field"
    >
      <label
        className="create-tr-filed-label"
        htmlFor="transactionInput"
        data-testid="create-transaction-label"
      >
        {label}
      </label>
      <div className="create-input-wrapper">
        <Input
          id="transactionInput"
          extraStyleClasses={inputExtraClasses}
          placeholder={placeholder}
          value={value}
          onChange={onChengeHandle}
        />
        {withIcon && (
          <div
            className="create-tr-icons-wrapper"
            data-testid="create-tr-icons-wrapper"
          >
            <ArrowIcon
              className="create-tr-icon-arrow-reverse"
              data-testid="arrow-icon"
            />
            <ArrowIcon
              className="create-tr-icon-arrow"
              data-testid="arrow-icon"
            />
          </div>
        )}
      </div>
      {buttonTitle && (
        <Button
          extraStyleClasses={buttonExtraClasses}
          onClickHandle={buttonClickHandler}
        >
          {buttonTitle}
        </Button>
      )}
      {bottomText && (
        <p
          className="create-tr-note"
          data-testid="create-tr-bottom-note"
        >
          {bottomText}
        </p>
      )}
    </div>
  )
}

export default CreateTransactionFiled
