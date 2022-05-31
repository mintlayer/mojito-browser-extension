import { render, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import Header from './header'

test('Header component, renders a page before, navigate to Header and go back', async () => {
  let location

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

  render(
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
    </MemoryRouter>,
  )

  const nextPageLinkComponent = screen.getByTestId('next-page-link')

  expect(location.pathname).toBe('/')

  act(() => {
    nextPageLinkComponent.click()
  })

  const nextPageComponent = screen.getByTestId('next-page')
  const backButton = screen.getByTestId('button')

  expect(location.pathname).toBe('/next-page')
  expect(nextPageComponent).toBeInTheDocument()

  act(() => {
    backButton.click()
  })

  const prevPageComponent = screen.getByTestId('prev-page')
  expect(prevPageComponent).toBeInTheDocument()
})
