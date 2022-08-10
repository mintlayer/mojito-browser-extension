/// <reference types="cypress" />

// context('Actions', () => {

describe('example to-do app', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/')
    cy.contains('button', 'Create').click()
  })

  it('displays attribute page', () => {
    // cy.contains('img') // , '[alt="Mojito logo"]'
    cy.contains('Create a name to your account')
    cy.contains('Mojito')
    cy.contains('button', 'Continue')
    cy.get('input[placeholder="Account Name"]')
  })

  //  it('click on ... ', () => {
  //  })

  it('click on continue', () => {
    cy.get('input[placeholder="Account Name"]').type('hola')
    cy.contains('button', 'Continue').click()
    // click()
  })
})
