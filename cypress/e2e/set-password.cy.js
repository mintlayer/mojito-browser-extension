/// <reference types="cypress" />

import { deleteDatabase } from './utils'
import { accounts } from '../fixtures/accounts.json'

describe('set password page', () => {
  before(() => {
    deleteDatabase()
  })

  beforeEach(() => {
    cy.visit(Cypress.env('baseUrl'))
    cy.contains('button', 'Create').click()
    cy.setAccount(accounts[0].name)
  })

  it('displays attribute pages', () => {
    cy.contains('li.step.active', 'Account Password').should('be.visible')
    cy.contains('Create a password to your account').should('be.visible')
    cy.contains('Mojito').should('be.visible')
    cy.contains('button', 'Continue').should('be.visible')
    cy.get('input[placeholder="Password"]').should('be.visible')
  })

  it('click on continue', () => {
    cy.setPassword(accounts[0].password)
    cy.contains('button', 'I understand').should('be.visible')

    cy.contains('li.step.false', 'Account Password').should('be.visible')
  })
})
