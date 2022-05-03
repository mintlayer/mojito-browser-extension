import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import CreateRestore from './index'

test('Renders Create/Restore page', () => {
  render(<CreateRestore />, {wrapper: MemoryRouter})
  const createRestoreComponent = screen.getByTestId('create-restore')

  expect(createRestoreComponent).toBeInTheDocument()
})
