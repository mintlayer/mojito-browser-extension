import { deleteDatabase } from './utils'

let nativeIdDb

describe(
  'stuff IndexedDB',
  {
    env: {
      newone: Cypress.env('login') || 'NewOne',
      sender: Cypress.env('sender') || 'Sender',
      receiver: Cypress.env('receiver') || 'Receiver',
    },
  },
  () => {
    before(function () {
      deleteDatabase()
      cy.clearLocalStorage()

      cy.visit(Cypress.env('baseUrl'))
      cy.restoreWallet(Cypress.env('newone'))
      cy.contains('button', 'Create Wallet').click()
      cy.restoreWallet(Cypress.env('sender'))
      cy.contains('button', 'Create Wallet').click()
      cy.restoreWallet(Cypress.env('receiver'))
      cy.wrap(null).then(() => {
        return cy.getNaviteIdDb().then((r) => (nativeIdDb = r.result))
      })
    })

    it('do something', function () {
      cy.wrap(nativeIdDb).should('be.not.null')
      cy.wrap(null).then(() => {
        return cy.exportDb(nativeIdDb).then((jsonString) => {
          expect(jsonString).to.not.eq(undefined)

          cy.wrap(jsonString).should('not.be.empty')
          const db = Cypress.env('DB')
            ? `cypress/fixtures/${Cypress.env('DB')}`
            : undefined

          cy.setDb(jsonString, db)

          cy.getDb(Cypress.env('DB') ? Cypress.env('DB') : undefined).then(
            (d) => {
              cy.wrap(d).should('not.be.empty')
            },
          )

          cy.wrap(null).then(() => {
            return cy.clearDb(nativeIdDb)
          })
          cy.wrap(null).then(() => {
            return cy.restoreDbFromJson(nativeIdDb, jsonString)
          })
        })
      })
      cy.visit(Cypress.env('baseUrl'))
      cy.contains(Cypress.env('newone')).should('be.visible')
      cy.contains(Cypress.env('sender')).should('be.visible')
      cy.contains(Cypress.env('receiver')).should('be.visible')
    })
  },
)
