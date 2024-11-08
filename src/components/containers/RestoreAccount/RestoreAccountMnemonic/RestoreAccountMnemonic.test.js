import * as React from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen, fireEvent, act } from '@testing-library/react'

import RestoreAccountMnemonic from './RestoreAccountMnemonic'
import { Expressions } from '@Constants'
import { AccountProvider, SettingsProvider } from '@Contexts'
import { BTC } from '@Cryptos'

const SETSTEPSAMPLE = jest.fn()
const ONSTEPSFINISHEDSAMPLE = jest.fn()
const WORDSSAMPLE = ['car', 'house', 'cat']
const SAMPLE_MNEMONIC =
  'pave defy issue grant pear balance mad scatter summer weasel spend metal'

test('Renders restore account page with step 1', () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <RestoreAccountMnemonic
          step={1}
          setStep={SETSTEPSAMPLE}
        />
      </SettingsProvider>
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const RestoreAccountComponent = screen.getByTestId('restore-account')
  const restoreAccountForm = screen.getByTestId('restore-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(3)

  expect(RestoreAccountComponent).toBeInTheDocument()
  expect(restoreAccountForm).toBeInTheDocument()
  expect(restoreAccountForm).toHaveAttribute('method', 'POST')
  expect(inputComponent).toHaveAttribute('type', 'text')
  expect(inputComponent).toHaveAttribute('placeholder', 'Wallet Name')
  fireEvent.change(inputComponent, { target: { value: '1' } })
  expect(inputComponent).not.toHaveClass('invalid')
  expect(inputComponent).not.toHaveClass('valid')

  act(() => {
    restoreAccountForm.submit()
  })

  fireEvent.change(inputComponent, { target: { value: 'more then 4' } })
  expect(inputComponent).toHaveClass('valid')

  act(() => {
    restoreAccountForm.submit()
  })
})

test('Renders restore account page with step 2', () => {
  const passwordPattern = Expressions.PASSWORD
  render(
    <AccountProvider>
      <SettingsProvider>
        <RestoreAccountMnemonic
          step={2}
          setStep={SETSTEPSAMPLE}
        />
      </SettingsProvider>
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const RestoreAccountComponent = screen.getByTestId('restore-account')
  const restoreAccountForm = screen.getByTestId('restore-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(3)

  expect(RestoreAccountComponent).toBeInTheDocument()
  expect(restoreAccountForm).toBeInTheDocument()
  expect(restoreAccountForm).toHaveAttribute('method', 'POST')
  expect(inputComponent).toHaveAttribute('type', 'password')
  expect(inputComponent).toHaveAttribute('placeholder', 'Password')
  expect(inputComponent).toHaveAttribute('pattern', passwordPattern.toString())
  fireEvent.change(inputComponent, { target: { value: '1' } })
  fireEvent.blur(inputComponent)
  expect(inputComponent).toHaveClass('invalid')

  fireEvent.change(inputComponent, { target: { value: 'qwertyuio!5678' } })
  expect(inputComponent).toHaveClass('invalid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5678' } })
  expect(inputComponent).toHaveClass('invalid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5@' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5#' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5$' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5%' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5ˆ' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5&' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5*' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5_' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5+' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5=' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5|' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5"' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5?' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio!5678' } })
  expect(inputComponent).toHaveClass('valid')

  act(() => {
    restoreAccountForm.submit()
  })
})

test('Renders set account page with step 3', () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <RestoreAccountMnemonic
          step={3}
          setStep={SETSTEPSAMPLE}
        />
      </SettingsProvider>
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const descriptionParagraph = screen.getAllByTestId('description-paragraph')
  const restoreAccountForm = screen.getByTestId('restore-account-form')
  const buttons = screen.getAllByTestId('button')

  expect(buttons).toHaveLength(3)
  expect(descriptionParagraph).toHaveLength(1)

  act(() => {
    restoreAccountForm.submit()
  })
})

test('Renders restore account page with step 4', () => {
  jest.spyOn(window, 'alert').mockImplementation((message) => {
    expect(typeof message).toBe('string')
    window.alert.mockRestore()
  })

  const onStepsFinishedFn = jest.fn()
  const validateMnemonicMock = jest
    .fn()
    .mockReturnValueOnce(false)
    .mockReturnValue(true)

  render(
    <AccountProvider>
      <SettingsProvider>
        <RestoreAccountMnemonic
          step={4}
          setStep={SETSTEPSAMPLE}
          words={WORDSSAMPLE}
          onStepsFinished={onStepsFinishedFn}
          validateMnemonicFn={validateMnemonicMock}
          defaultBTCWordList={BTC.getWordList()}
        />
      </SettingsProvider>
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const restoreAccountForm = screen.getByTestId('restore-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputs = screen.getAllByTestId('restore-seed-textarea')

  expect(buttons).toHaveLength(3)
  expect(inputs).toHaveLength(1)
  inputs.forEach((input) =>
    expect(input).not.toHaveClass('textarea textarea-invalid'),
  )
  inputs.forEach((input) =>
    expect(input).not.toHaveClass('textarea textarea-valid'),
  )

  inputs.forEach((input) =>
    fireEvent.change(input, { target: { value: WORDSSAMPLE[0] } }),
  )

  inputs.forEach((input) =>
    expect(input).toHaveClass('textarea textarea-invalid'),
  )

  inputs.forEach((input) =>
    fireEvent.change(input, { target: { value: SAMPLE_MNEMONIC } }),
  )
  inputs.forEach((input) =>
    expect(input).toHaveClass('textarea textarea-valid'),
  )

  act(() => {
    restoreAccountForm.submit()
  })

  act(() => {
    restoreAccountForm.submit()
  })
})

test('Renders set account page with step 5', () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <RestoreAccountMnemonic
          step={5}
          setStep={SETSTEPSAMPLE}
        />
      </SettingsProvider>
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const description = screen.getByTestId('wallet-list-description')

  expect(description).toBeInTheDocument()
})

test('Renders set account page with step 6', () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <RestoreAccountMnemonic
          step={6}
          setStep={SETSTEPSAMPLE}
          onStepsFinished={ONSTEPSFINISHEDSAMPLE}
        />
      </SettingsProvider>
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const descriptionParagraph = screen.getAllByTestId('description-paragraph')
  const restoreAccountForm = screen.getByTestId('restore-account-form')
  const buttons = screen.getAllByTestId('button')
  const legacyRadioButton = screen.getByRole('button', { name: /Legacy/i })

  expect(buttons).toHaveLength(6)
  expect(descriptionParagraph).toHaveLength(1)

  expect(legacyRadioButton).toBeInTheDocument()
  act(() => {
    legacyRadioButton.click()
  })

  act(() => {
    restoreAccountForm.submit()
  })
})

test('Checks back button behavior in a internal navigation component - first step', () => {
  let location

  const RestoreAccountMock = () => {
    location = useLocation()
    const [step, setStep] = React.useState(2)

    return (
      <RestoreAccountMnemonic
        step={step}
        setStep={setStep}
      />
    )
  }

  const PrevPageMock = () => {
    location = useLocation()
    return <></>
  }

  render(
    <AccountProvider>
      <SettingsProvider>
        <MemoryRouter initialEntries={['/', '/set-account']}>
          <Routes>
            <Route
              path="/set-account"
              element={<RestoreAccountMock />}
            />
            <Route
              exact
              path="/"
              element={<PrevPageMock />}
            />
          </Routes>
        </MemoryRouter>
      </SettingsProvider>
    </AccountProvider>,
  )

  const buttons = screen.getAllByTestId('button')
  let progressSteps = screen.getAllByTestId('progress-step')
  expect(progressSteps[1]).toHaveClass('active')
  expect(location.pathname).toBe('/set-account')

  act(() => {
    buttons[0].click()
  })

  expect(location.pathname).toBe('/set-account')
  progressSteps = screen.getAllByTestId('progress-step')
  expect(progressSteps[0]).toHaveClass('active')

  act(() => {
    buttons[0].click()
  })

  expect(location.pathname).toBe('/')
})
