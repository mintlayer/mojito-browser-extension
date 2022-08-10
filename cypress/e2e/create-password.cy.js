/// <reference types="cypress" />

// context('Actions', () => {

describe('example to-do app', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/')
    cy.contains('button', 'Create').click()
    cy.get('input[placeholder="Account Name"]').type('hola')
    cy.contains('button', 'Continue').click()
  })
  it('displays attribute pages', () => {
    // cy.contains('img') // , '[alt="Mojito logo"]'
    cy.contains('Create a password to your account')
    cy.contains('Mojito')
    cy.contains('button', 'Continue')
    cy.get('input[placeholder="Password"]')
  })

  //  it('click on ... ', () => {
  //  })

  it('click on continue', () => {
    cy.get('input[placeholder="Password"]').type('Mintlayer,1')
    cy.contains('button', 'Continue').click()
  })
})
