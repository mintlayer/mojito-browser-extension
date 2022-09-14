import { deleteDatabase } from './utils'
import { DATABASENAME } from '/src/services/Database/IndexedDB/IndexedDB.js'

describe(
  'login Account wallet',
  {
    env: {
      login: Cypress.env('login') || 'NewOne',
    },
  },
  () => {
    before(() => {
      deleteDatabase()
      cy.clearLocalStorage()

      cy.visit(Cypress.env('baseUrl'))
      cy.restoreDb(DATABASENAME)
    })

    beforeEach(() => {
      cy.visit(Cypress.env('baseUrl'))
      cy.wait(1000)
      cy.getAccess(Cypress.env('login')).as('access')
      cy.getAddress(Cypress.env('login')).as('login')
    })

    it('login Account and logout Account', function () {
      cy.contains(this.access.name).should('be.visible')
      cy.contains(this.access.name).click()
      cy.interceptAll(this.access.name)

      cy.get('input[placeholder="Password"]').type(this.access.password)
      cy.contains('button', 'Log In').click()

      cy.get('button[class="btn logout alternate"]')
        .should('be.visible')
        .then(() => {
          const savedAccount = JSON.parse(
            localStorage.getItem('unlockedAccount'),
          )
          expect(savedAccount.name).be.eq(this.access.name)
          expect(savedAccount.address).be.not.eq(undefined)
        })

      cy.get('button[class="btn logout alternate"]').click()
      cy.contains(this.access.name)
        .should('be.visible')
        .then(() => {
          expect(localStorage.getItem('unlockedAccount')).be.eq(null)
        })
    })
  },
)
