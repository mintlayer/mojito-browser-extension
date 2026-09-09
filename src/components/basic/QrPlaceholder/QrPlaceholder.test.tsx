import { render, screen } from '@testing-library/react'
import QrPlaceholder from './QrPlaceholder'

test('QrPlaceholder renders its label at the requested size', () => {
  render(
    <QrPlaceholder
      size={172}
      label="QR · Bitcoin address"
    />,
  )
  const qr = screen.getByTestId('qr-placeholder')
  expect(qr).toHaveTextContent('QR · Bitcoin address')
  expect(qr).toHaveStyle({ width: '172px' })
})
