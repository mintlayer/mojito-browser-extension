import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import ShowAddress from './ShowAddress'

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: () => {},
  },
})

const _data = {
  address: '2MyEpfT2SxQjVRipzTEzxSRPyerpoENmAom',
  onCopy: jest.fn(),
  linearQr: '10',
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

  expect(qrcode.childElementCount).toBe(2)

  const { children } = qrcode

  const linearQr = [...children]
    .reduce((acc, item) => {
      acc.push(item.getAttribute('fill') === '#000000' ? 0 : 1)
      return acc
    }, [])
    .join('')

  expect(linearQr).toEqual(_data.linearQr)
})

test('Renders ShowAddress page and click on copy address', async () => {
  const { copy } = setup()

  fireEvent.click(copy)
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(_data.address)
  expect(_data.onCopy).toHaveBeenCalled()
})
