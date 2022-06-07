import { render, screen } from '@testing-library/react'
import SetAccountField from './seAccountField'

const TITLESAMPLE = 'title'
const VALUESAMPLE = 'VALUE'
const VALIDITYSAMPLE = 'valid'
const ONCHANGEHANDLESAMPLE = () => {}

test('Render set acount page field', () => {
  render(
    <SetAccountField
      validity={VALIDITYSAMPLE}
      value={VALUESAMPLE}
      onChangeHandle={ONCHANGEHANDLESAMPLE}
      title={TITLESAMPLE}
    />,
  )
  const serAccontField = screen.getByTestId('centered-layout-container')
  const title = screen.getByTestId('set-account-field-title')

  expect(serAccontField).toBeInTheDocument()
  expect(serAccontField).toContainElement(title)
  // expect(inputComponent).toHaveClass('list-item')
})
