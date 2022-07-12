import { useState } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen, fireEvent, act } from '@testing-library/react'

import SetAccount from './CreateAccount'
import Expressions from '../../../utils/Constants/Expressions'
import { AccountProvider } from '../../../contexts/AccountProvider/AccountProvider'

const SETSTEPSAMPLE = jest.fn()
const WORDSSAMPLE = ['car', 'house', 'cat']

test('Renders set account page with step 1', () => {
  render(
    <AccountProvider>
      <SetAccount
        step={1}
        setStep={SETSTEPSAMPLE}
      />
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const setAccountComponent = screen.getByTestId('set-account')
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(3)

  expect(setAccountComponent).toBeInTheDocument()
  expect(setAccountForm).toBeInTheDocument()
  expect(setAccountForm).toHaveAttribute('method', 'POST')
  expect(inputComponent).toHaveAttribute('type', 'text')
  expect(inputComponent).toHaveAttribute('placeholder', 'Account Name')
  fireEvent.change(inputComponent, { target: { value: '1' } })
  expect(inputComponent).not.toHaveClass('invalid')
  expect(inputComponent).not.toHaveClass('valid')

  act(() => {
    setAccountForm.submit()
  })

  fireEvent.change(inputComponent, { target: { value: 'more then 4' } })
  expect(inputComponent).toHaveClass('valid')
})

test('Renders set account page with step 2', async () => {
  const passwordPattern = Expressions.PASSWORD
  render(
    <AccountProvider>
      <SetAccount
        step={2}
        setStep={SETSTEPSAMPLE}
      />
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const setAccountComponent = screen.getByTestId('set-account')
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(3)

  expect(setAccountComponent).toBeInTheDocument()
  expect(setAccountForm).toBeInTheDocument()
  expect(setAccountForm).toHaveAttribute('method', 'POST')
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
    setAccountForm.submit()
  })
})

test('Renders set account page with step 3', () => {
  render(
    <AccountProvider>
      <SetAccount
        step={3}
        setStep={SETSTEPSAMPLE}
      />
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const descriptionParagraphs = screen.getAllByTestId('description-paragraph')
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')

  expect(buttons).toHaveLength(3)
  expect(descriptionParagraphs).toHaveLength(2)

  act(() => {
    setAccountForm.submit()
  })
})

test('Renders set account page with step 4', () => {
  render(
    <AccountProvider>
      <SetAccount
        step={4}
        setStep={SETSTEPSAMPLE}
        words={WORDSSAMPLE}
      />
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )

  const buttons = screen.getAllByTestId('button')
  const inputs = screen.getAllByTestId('input')

  expect(buttons).toHaveLength(3)
  expect(inputs).toHaveLength(WORDSSAMPLE.length)

  const input = inputs[0]

  expect(input).toHaveAttribute('type', 'text')
  expect(input).toBeDisabled()
})

test('Renders set account page with step 5', () => {
  jest.spyOn(window, 'alert').mockImplementation((message) => {
    window.alert.mockRestore()
  })

  const onStepsFinishedFn = jest.fn()
  const validateMnemonicMock = jest
    .fn()
    .mockReturnValueOnce(false)
    .mockReturnValue(true)

  render(
    <AccountProvider>
      <SetAccount
        step={5}
        setStep={SETSTEPSAMPLE}
        words={WORDSSAMPLE}
        onStepsFinished={onStepsFinishedFn}
        validateMnemonicFn={validateMnemonicMock}
      />
    </AccountProvider>,
    { wrapper: MemoryRouter },
  )
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputs = screen.getAllByTestId('input')

  expect(buttons).toHaveLength(3)
  expect(inputs).toHaveLength(WORDSSAMPLE.length)

  inputs.forEach((input, index) => {
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveClass('invalid')
    fireEvent.change(input, { target: { value: WORDSSAMPLE[index] } })
    fireEvent.blur(input)
    expect(input).toHaveClass('valid')
  })

  act(() => {
    setAccountForm.submit()
  })

  act(() => {
    setAccountForm.submit()
  })
})

test('Checks back button behavior in a internal navigation component - first step', () => {
  let location

  const SetAccountMock = () => {
    location = useLocation()
    const [step, setStep] = useState(2)

    return (
      <SetAccount
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
      <MemoryRouter initialEntries={['/', '/set-account']}>
        <Routes>
          <Route
            path="/set-account"
            element={<SetAccountMock />}
          />
          <Route
            exact
            path="/"
            element={<PrevPageMock />}
          />
        </Routes>
      </MemoryRouter>
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
