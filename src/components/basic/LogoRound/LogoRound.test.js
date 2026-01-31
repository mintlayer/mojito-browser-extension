import React from 'react'
import { render, screen } from '@testing-library/react'
import LogoRound from './LogoRound'

test('renders the component with the logo image', function () {
  render(React.createElement(LogoRound))
  const logoImage = screen.getByAltText('Logo')
  expect(logoImage).toBeInTheDocument()
})

test('renders the component with the correct logo image source', function () {
  render(React.createElement(LogoRound))
  const logoImage = screen.getByAltText('Logo')
  expect(logoImage.getAttribute('src')).toBeDefined()
})

test('renders the component with the "logo-round" class', function () {
  render(React.createElement(LogoRound))
  const logoRoundDiv = screen.getByTestId('logo-round')
  expect(logoRoundDiv.classList.contains('logo-round')).toBe(true)
})
