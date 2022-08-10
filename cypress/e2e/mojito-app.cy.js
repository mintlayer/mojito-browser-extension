/// <reference types="cypress" />

describe('mojito wallet app', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/')
  })

  it('displays attribute page', () => {
    // static
    // cy.contains('img') // , '[alt="Mojito logo"]'
    cy.contains('Mojito')
    cy.contains('Your Bitcoin wallet right in your browser')
    cy.contains('©Mojito Wallet, 2022')
    cy.contains('mojito-wallet.com')
    // navigation
    cy.contains('button', 'Create')
    cy.contains('button', 'Restore')
  })

  it.only('click on Create and navigate', () => {
    cy.contains('button', 'Create').click()
  })
})
