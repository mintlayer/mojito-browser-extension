// PwField — password input with reveal toggle. Composes: Field, Input, Icon.
const { useState } = React

function PwField({
  label,
  value,
  onChange,
  placeholder = 'Password',
  autoFocus,
  bad,
  onEnter,
}) {
  const [show, setShow] = useState(false)
  return (
    <Field label={label}>
      <Input
        icon="lock"
        bad={bad}
      >
        <input
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter && onEnter()}
        />
        <span
          onClick={() => setShow((s) => !s)}
          style={{ cursor: 'pointer', display: 'flex' }}
        >
          <Icon
            name={show ? 'eye_off' : 'eye'}
            size={15}
            color="var(--text-2)"
          />
        </span>
      </Input>
    </Field>
  )
}

Object.assign(window, { PwField })
