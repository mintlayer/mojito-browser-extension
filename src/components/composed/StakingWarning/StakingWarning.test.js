import React from 'react'
import { render } from '@testing-library/react'

const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

jest.mock('@Hooks', () => ({
  __esModule: true,
  useMlWalletInfo: jest.fn(),
}))

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const { useMlWalletInfo } = require('@Hooks')
const StakingWarning = require('./StakingWarning').default

const makeDelegation = (overrides = {}) => ({
  delegation_id: 'mdelg1234567890123456789012345',
  pool_id: 'mpool1234567890123456789012345',
  balance: { atoms: '100000000', decimal: '1' },
  decommissioned: true,
  ...overrides,
})

const renderWarning = (mlDelegationList) => {
  useMlWalletInfo.mockReturnValue({ mlDelegationList })
  return render(<StakingWarning />)
}

describe('StakingWarning', () => {
  afterAll(() => {
    errorSpy.mockRestore()
  })

  it('renders the warning for a decommissioned delegation with at least 1 ML', () => {
    const { container } = renderWarning([makeDelegation()])

    expect(container.querySelector('.staking-warning')).toBeInTheDocument()
  })

  it('renders nothing when the decommissioned balance is below 1 ML', () => {
    const { container } = renderWarning([
      makeDelegation({ balance: { atoms: '50000000', decimal: '0.5' } }),
    ])

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the delegation has no balance', () => {
    const { container } = renderWarning([
      makeDelegation({ balance: undefined }),
    ])

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when no delegation is decommissioned', () => {
    const { container } = renderWarning([
      makeDelegation({ decommissioned: false }),
    ])

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing without a delegation list', () => {
    const { container } = renderWarning(undefined)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for an empty delegation list', () => {
    const { container } = renderWarning([])

    expect(container).toBeEmptyDOMElement()
  })
})
