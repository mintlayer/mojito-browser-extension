import TextField from '../basic/textField'
import CenteredLayout from '../group/centeredLayout'

const SetAccountField = ({
  title,
  password,
  value,
  onChangeHandle,
  validity,
  pattern,
  placeHolder,
}) => {
  const fieldValid = validity ? 'valid' : 'invalid'
  return (
    <CenteredLayout>
      <h1
        className="center-text set-account-title"
        data-testid="set-account-field-title"
      >
        {title}
      </h1>
      <TextField
        {...{ password, value, onChangeHandle, pattern, placeHolder }}
        validity={fieldValid}
      />
    </CenteredLayout>
  )
}

export default SetAccountField
