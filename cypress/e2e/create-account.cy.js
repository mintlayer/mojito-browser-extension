import { deleteDatabase } from './utils'
import { user } from '../fixtures/accounts.json'

describe('create account page', () => {
  before(() => {
    deleteDatabase()
  })

  beforeEach(() => {
    cy.visit(Cypress.env('baseUrl'))
    cy.contains('button', 'Create').click()
    const { name, password } = user.access
    cy.setAccountAndPassword(name, password)

    cy.intercept('**/address/**/utxo').as('utxo')
    cy.intercept('**/address/**/txs').as('txs')
    cy.intercept('**/getCurrentRate/**').as('rate')
  })

  it('displays attribute pages', () => {
    cy.contains('Mojito').should('be.visible')
    cy.contains('li.step.active', 'Restoring Information').should('be.visible')
    cy.contains(
      'Write down all of the next words. They will be asked to restores your wallet in the future.',
    ).should('be.visible')
    cy.contains(
      'Save they in a very safe place. It is only your backup',
    ).should('be.visible')
    cy.contains('button', 'I understand').should('be.visible')
  })

  it('click on continue', () => {
    cy.contains('button', 'I understand').click()
    cy.getWords('input.words-list-input.readonly').then((words) => {
      expect(words)

      cy.contains('button', 'Backup done!').click()
      cy.writeWords('input.words-list-input', words)
      cy.contains('button', 'Create account').click()

      cy.contains('Just a sec, we are creating your account...').should(
        'be.visible',
      )

      cy.wait('@utxo')
      cy.wait('@txs')
      cy.wait('@rate')
    })
  })
})
