import { deleteDatabase } from './utils'
import { wallets } from '../fixtures/accounts.json'

describe('set Account page', () => {
  before(() => {
    deleteDatabase()
  })

  beforeEach(() => {
    cy.visit(Cypress.env('baseUrl'))
    cy.contains('button', 'Create').click()
  })

  it('displays attribute page', () => {
    cy.contains('li.step.active', 'Account Name').should('be.visible')
    cy.contains('Create a name to your account').should('be.visible')
    cy.contains('Mojito').should('be.visible')
  })

  it('click on button Account Name', () => {
    cy.setAccount(wallets[0].access.name)
    cy.contains('button', 'Continue').should('be.visible')

    cy.contains('li.step.false', 'Account Name').should('be.visible')
  })
})
