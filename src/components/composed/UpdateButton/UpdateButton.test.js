import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import UpdateButton from './UpdateButton'
import { NetworkContext } from '@Contexts'

describe('UpdateButton', () => {
  const mockFetchAllData = jest.fn()
  const mockFetchDelegations = jest.fn()

  beforeEach(() => {
    mockFetchAllData.mockClear()
    mockFetchDelegations.mockClear()
  })

  it('should display the default loading icon initially', () => {
    render(
      <NetworkContext.Provider value={{ fetchAllData: mockFetchAllData, fetchDelegations: mockFetchDelegations }}>
        <UpdateButton />
      </NetworkContext.Provider>
    )

    expect(screen.getByTestId('icon-loading-default')).toBeInTheDocument()
  })

  it('should display the animated loading icon while fetching data', async () => {
    mockFetchAllData.mockResolvedValueOnce()
    mockFetchDelegations.mockResolvedValueOnce()

    render(
      <NetworkContext.Provider value={{ fetchAllData: mockFetchAllData, fetchDelegations: mockFetchDelegations }}>
        <UpdateButton />
      </NetworkContext.Provider>
    )

    fireEvent.click(screen.getByTestId('icon-loading-default'))
    expect(screen.getByTestId('icon-loading-animated')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByTestId('icon-loading-animated')).not.toBeInTheDocument())
  })

  it('should display the success icon after successful data fetch', async () => {
    mockFetchAllData.mockResolvedValueOnce()
    mockFetchDelegations.mockResolvedValueOnce()

    render(
      <NetworkContext.Provider value={{ fetchAllData: mockFetchAllData, fetchDelegations: mockFetchDelegations }}>
        <UpdateButton />
      </NetworkContext.Provider>
    )

    fireEvent.click(screen.getByTestId('icon-loading-default'))
    await screen.findByTestId('icon-success')
    expect(screen.queryByTestId('icon-loading-animated')).not.toBeInTheDocument()
  })

  it('should hide the success icon after 3 seconds', async () => {
    jest.useFakeTimers()
    mockFetchAllData.mockResolvedValueOnce()
    mockFetchDelegations.mockResolvedValueOnce()

    render(
      <NetworkContext.Provider value={{ fetchAllData: mockFetchAllData, fetchDelegations: mockFetchDelegations }}>
        <UpdateButton />
      </NetworkContext.Provider>
    )

    fireEvent.click(screen.getByTestId('icon-loading-default'))
    await screen.findByTestId('icon-success')

    await waitFor(() => new Promise(resolve => setTimeout(resolve, 5000)), { timeout: 5100 })
    expect(screen.queryByTestId('icon-success')).not.toBeInTheDocument()
    jest.useRealTimers()
  })
})
