/// <reference types="cypress" />

import { deleteDatabase } from './utils'
import { accounts } from '../fixtures/accounts.json'

describe('create account page', () => {
  before(() => {
    deleteDatabase()
  })

  beforeEach(() => {
    cy.visit(Cypress.env('baseUrl'))
    cy.contains('button', 'Create').click()
    cy.setAccountAndPassword(accounts[0].name, accounts[0].password)

    cy.intercept('**/address/**/utxo').as('utxo')
    cy.intercept('**/address/**/txs').as('txs')
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

    cy.get('input')
      .then(($els) => Array.from($els, (el) => el.value))
      .then((words) => {
        expect(words)
        cy.contains('button', 'Backup done!').click()

        cy.get('input').each((x, i, a) => {
          cy.wrap(x).type(words[i])
        })

        cy.contains('button', 'Create account').click()

        cy.contains('Just a sec, we are creating your account...').should(
          'be.visible',
        )

        cy.wait('@utxo')
        cy.wait('@txs')
      })
  })
})
