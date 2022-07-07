import { render, screen, waitFor } from '@testing-library/react'
import { ContextProvider } from '../../../ContextProvider'
import { act } from 'react-dom/test-utils'
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import Header from './header'

const setup = async (location) => {
  const value = { isAccountUnlocked: () => true, logout: jest.fn() }

  const PreviousPage = () => {
    location = useLocation()
    return (
      <div data-testid="prev-page">
        <Link
          to="/next-page"
          data-testid="next-page-link"
        ></Link>
      </div>
    )
  }

  const NextPage = () => {
    location = useLocation()

    return (
      <div data-testid="next-page">
        <Header />
      </div>
    )
  }

  await render(
    <ContextProvider value={value}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/next-page"
            element={<NextPage />}
          />
          <Route
            exact
            path="/"
            element={<PreviousPage />}
          />
        </Routes>
      </MemoryRouter>
    </ContextProvider>,
  )

  return { value }
}

test('Header component, renders a page before, navigate to Header and go back', async () => {
  await setup()

  const nextPageLinkComponent = screen.getByTestId('next-page-link')

  await waitFor(async () => {
    expect(nextPageLinkComponent).toBeInTheDocument()
  })

  act(() => {
    nextPageLinkComponent.click()
  })

  const nextPageComponent = screen.getByTestId('next-page')
  const buttons = screen.getAllByTestId('button')

  expect(nextPageComponent).toBeInTheDocument()

  act(() => {
    buttons[0].click()
  })

  const prevPageComponent = screen.getByTestId('prev-page')
  expect(prevPageComponent).toBeInTheDocument()
})

test('Header component, renders a page before, navigate to Header and logout', async () => {
  const { value } = await setup()

  const nextPageLinkComponent = screen.getByTestId('next-page-link')

  await waitFor(async () => {
    expect(nextPageLinkComponent).toBeInTheDocument()
  })

  act(() => {
    nextPageLinkComponent.click()
  })

  const nextPageComponent = screen.getByTestId('next-page')
  const buttons = screen.getAllByTestId('button')
  expect(nextPageComponent).toBeInTheDocument()

  act(() => {
    buttons[1].click()
  })

  await waitFor(async () => {
    expect(value.logout).toBeCalled()
  })

  const prevPageComponent = screen.getByTestId('prev-page')
  expect(prevPageComponent).toBeInTheDocument()
})
