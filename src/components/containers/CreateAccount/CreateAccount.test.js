import { useContext, useState } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

import SetAccount from './CreateAccount'
import { AccountProvider, SettingsProvider } from '@Contexts'
import { AccountContext } from '@Contexts'

const SETSTEPSAMPLE = jest.fn()
const GENERATEMNEMONIC = jest.fn()
const WORDSSAMPLE = ['car', 'house', 'cat']
const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

test('Renders set account page with step 1', async () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <MemoryRouter future={memoryRouterFeature}>
          <SetAccount
            step={1}
            setStep={SETSTEPSAMPLE}
          />
        </MemoryRouter>
      </SettingsProvider>
    </AccountProvider>,
  )
  const setAccountComponent = screen.getByTestId('set-account')
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(1)

  expect(setAccountComponent).toBeInTheDocument()
  expect(setAccountForm).toBeInTheDocument()
  expect(setAccountForm).toHaveAttribute('method', 'POST')
  expect(inputComponent).toHaveAttribute('type', 'text')
  expect(inputComponent).toHaveAttribute('placeholder', 'Wallet Name')
  fireEvent.change(inputComponent, { target: { value: '1' } })
  expect(inputComponent).not.toHaveClass('invalid')
  expect(inputComponent).not.toHaveClass('valid')

  act(() => {
    fireEvent.submit(setAccountForm)
  })

  fireEvent.change(inputComponent, { target: { value: 'more then 4' } })
  fireEvent.blur(inputComponent)
  await waitFor(() => {
    expect(inputComponent).toHaveClass('valid')
  })
})

test('Renders set account page with step 2', async () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <MemoryRouter future={memoryRouterFeature}>
          <SetAccount
            step={2}
            setStep={SETSTEPSAMPLE}
            onGenerateMnemonic={GENERATEMNEMONIC}
          />
        </MemoryRouter>
      </SettingsProvider>
    </AccountProvider>,
  )
  const setAccountComponent = screen.getByTestId('set-account')
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(1)

  expect(setAccountComponent).toBeInTheDocument()
  expect(setAccountForm).toBeInTheDocument()
  expect(setAccountForm).toHaveAttribute('method', 'POST')
  expect(inputComponent).toHaveAttribute('type', 'password')
  expect(inputComponent).toHaveAttribute('placeholder', 'Password')
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
    fireEvent.submit(setAccountForm)
  })
})

test('Renders set account page with step 3 (description)', () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <MemoryRouter future={memoryRouterFeature}>
          <SetAccount
            step={3}
            setStep={SETSTEPSAMPLE}
          />
        </MemoryRouter>
      </SettingsProvider>
    </AccountProvider>,
  )
  const descriptionParagraphs = screen.getAllByTestId('description-paragraph')
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')

  expect(buttons).toHaveLength(1)
  expect(descriptionParagraphs).toHaveLength(2)

  act(() => {
    fireEvent.submit(setAccountForm)
  })
})

test('Renders set account page with step 4 (show words)', () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <MemoryRouter future={memoryRouterFeature}>
          <SetAccount
            step={4}
            setStep={SETSTEPSAMPLE}
            words={WORDSSAMPLE}
          />
        </MemoryRouter>
      </SettingsProvider>
    </AccountProvider>,
  )

  const buttons = screen.getAllByTestId('button')
  const inputs = screen.getAllByTestId('input')

  expect(buttons).toHaveLength(1)
  expect(inputs).toHaveLength(WORDSSAMPLE.length)

  const input = inputs[0]

  expect(input).toHaveAttribute('type', 'text')
  expect(input).toBeDisabled()
})

test('Renders set account page with step 5 (verify words)', () => {
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
      <SettingsProvider>
        <MemoryRouter future={memoryRouterFeature}>
          <SetAccount
            step={5}
            setStep={SETSTEPSAMPLE}
            words={WORDSSAMPLE}
            onStepsFinished={onStepsFinishedFn}
            validateMnemonicFn={validateMnemonicMock}
          />
        </MemoryRouter>
      </SettingsProvider>
    </AccountProvider>,
  )
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputs = screen.getAllByTestId('input')

  expect(buttons).toHaveLength(1)
  expect(inputs).toHaveLength(WORDSSAMPLE.length)

  inputs.forEach((input, index) => {
    expect(input).toHaveAttribute('type', 'text')
    expect(input).not.toHaveClass('invalid')
    expect(input).not.toHaveClass('valid')
    fireEvent.change(input, { target: { value: WORDSSAMPLE[index] } })
    fireEvent.blur(input)
    expect(input).toHaveClass('valid')
  })

  act(() => {
    fireEvent.submit(setAccountForm)
  })

  act(() => {
    fireEvent.submit(setAccountForm)
  })
})

test('Checks back button behavior in a internal navigation component - first step', () => {
  let location

  const BackButton = () => {
    const { customBackAction } = useContext(AccountContext)
    return (
      <button
        data-testid="back-button"
        onClick={() => customBackAction && customBackAction()}
      />
    )
  }

  const SetAccountMock = () => {
    location = useLocation()
    const [step, setStep] = useState(2)

    return (
      <>
        <BackButton />
        <SetAccount
          step={step}
          setStep={setStep}
        />
      </>
    )
  }

  const PrevPageMock = () => {
    location = useLocation()
    return <></>
  }

  render(
    <AccountProvider>
      <SettingsProvider>
        <MemoryRouter
          initialEntries={['/', '/set-account']}
          future={memoryRouterFeature}
        >
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
      </SettingsProvider>
    </AccountProvider>,
  )

  const backButton = screen.getByTestId('back-button')
  let progressSteps = screen.getAllByTestId('progress-step')
  expect(progressSteps[1]).toHaveClass('active')
  expect(location.pathname).toBe('/set-account')

  act(() => {
    backButton.click()
  })

  expect(location.pathname).toBe('/set-account')
  progressSteps = screen.getAllByTestId('progress-step')
  expect(progressSteps[0]).toHaveClass('active')

  act(() => {
    backButton.click()
  })

  expect(location.pathname).toBe('/')
})
