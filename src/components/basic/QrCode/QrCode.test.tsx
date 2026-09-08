import { render } from '@testing-library/react'
import QrCode from './QrCode'

test('renders a qr svg for the given value', () => {
  const { container, getByTestId } = render(
    <QrCode
      value="bc1qtest"
      size={100}
    />,
  )

  expect(getByTestId('qr-code')).toBeInTheDocument()
  expect(container.querySelector('svg')).toBeInTheDocument()
})
