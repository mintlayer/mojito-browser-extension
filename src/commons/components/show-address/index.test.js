import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import ShowAddress from './index'

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: () => {},
  },
})

const _data = {
  address: '2MyEpfT2SxQjVRipzTEzxSRPyerpoENmAom',
  onCopy: jest.fn(),
  linearQr:
    '0000000101111001011011000000001111101011000001000110111110010001010011010110101101000100100010100010111000101010001001000101100101111110110100010011111010001111101000101111100000000101010101010101000000011111111110010101011111111111001100011101001010111110100001011011001111000001110100101100100001100111101011110000110010111111011010110001010001101100100011101000101110111111000011110100101100101101000000011010000110000010010001111100000011010101010000100101011001100100110100111010001000100010101100111100101101100010111111010001111110111110101101011110111100101001011010000101000111001000100010100000010111111111100010110011101110100000000001111000000011010101100011111010000101110100111011110100010101010010101000000111101000101100110010000101010010010001011011111011010111110000111110100010100100000010010000000001000010011111011101001',
}

const setup = ({ data = _data } = {}) => {
  jest.spyOn(navigator.clipboard, 'writeText')

  const utils = render(<ShowAddress {...data} />)
  const qrcode = screen.getByTestId('svg-testid')
  const account = screen.getByText(data.address)
  const copy = screen.getByRole('button', { name: 'Copy Address' })
  return {
    qrcode,
    account,
    copy,
    utils,
  }
}

test('Renders ShowAddress page', () => {
  const { qrcode, account, copy } = setup()

  expect(qrcode).toBeInTheDocument()
  expect(account).toBeInTheDocument()
  expect(copy).toBeInTheDocument()
})

test('Renders ShowAddress qrcode in svg', async () => {
  const { qrcode } = setup()

  expect(qrcode.childElementCount).toBe(841)

  const { children } = qrcode
  const linearQr = [].reduce
    .call(
      children,
      function (acc, cur) {
        acc.push(cur.getAttribute('fill') === '#000000' ? 0 : 1)
        return acc
      },
      [],
    )
    .join('')

  expect(linearQr).toEqual(_data.linearQr)
})

test('Renders ShowAddress page and click on copy address', async () => {
  const { copy } = setup()

  fireEvent.click(copy)
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(_data.address)
  expect(_data.onCopy).toHaveBeenCalled()
})
