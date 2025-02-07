import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsApiItem from './SettingsAPIItem'

describe('SettingsApiItem', () => {
  const mockOnSubmitClick = jest.fn()
  const mockOnResetClick = jest.fn()
  const mockSetInputValue = jest.fn()

  const walletData = {
    wallet: 'mintlayer',
    networkType: 'mainnet',
    cuurrentServer: 'https://example.com',
  }

  const renderComponent = (inputValue = '', fieldValidity) => {
    render(
      <SettingsApiItem
        inputValue={inputValue}
        setInputValue={mockSetInputValue}
        walletData={walletData}
        onSubmitClick={mockOnSubmitClick}
        onResetClick={mockOnResetClick}
        externalFieldValidity={fieldValidity}
      />,
    )
  }

  test('renders the component with initial state', () => {
    renderComponent()
    expect(
      screen.getByLabelText(/Mintlayer mainnet server/i),
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/https:\/\/example.com/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Submit/i)).toBeInTheDocument()
    expect(screen.getByText(/Reset/i)).toBeInTheDocument()
  })

  test('handles input change and validation', () => {
    renderComponent()
    const input = screen.getByLabelText(/Mintlayer mainnet server/i)
    fireEvent.change(input, { target: { value: 'https://validserver.com' } })
    expect(mockSetInputValue).toHaveBeenCalledWith('https://validserver.com')
  })

  test('handles submit invalid', async () => {
    mockOnSubmitClick.mockResolvedValueOnce(false)
    renderComponent('value')
    const submitButton = screen.getByText(/Submit/i)
    expect(submitButton).toBeDisabled()
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.queryByTestId('unsuccess-api-feedback'),
      ).not.toBeInTheDocument()
    })

    expect(submitButton).toBeDisabled()
  })

  test('handles reset', () => {
    renderComponent('https://validserver.com')
    const resetButton = screen.getByText(/Reset/i)
    expect(resetButton).not.toBeDisabled()
    fireEvent.click(resetButton)
    expect(mockOnResetClick).toHaveBeenCalled()
  })
})
