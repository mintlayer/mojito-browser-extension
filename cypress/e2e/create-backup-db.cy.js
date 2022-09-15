let nativeIdDb

describe('stuff IndexedDB', () => {
  before(function () {
    cy.deleteDatabase()
    cy.clearLocalStorage()

    cy.wrap(Cypress.env('DB')).as('db')
    const baseUrl = Cypress.env('baseUrl')
    cy.wrap(baseUrl).as('baseUrl')

    let wallets = Cypress.env('wallets').split(',')
    cy.wrap(wallets).as('wallets')

    cy.visit(baseUrl)
    wallets.reduce((a, x, i) => {
      return a.then(() =>
        cy.wrap(null).then(() => {
          cy.restoreWallet(x)
          cy.contains('button', 'Create Wallet').click()
        }),
      )
    }, cy.wrap(null))

    cy.wrap(null).then(() => {
      return cy.getNaviteIdDb().then((r) => (nativeIdDb = r.result))
    })
  })

  it('restore wallets and backup indexeddb in DB path', function () {
    cy.wrap(nativeIdDb).should('be.not.null')
    cy.wrap(null).then(() => {
      return cy.exportDb(nativeIdDb).then((jsonString) => {
        expect(jsonString).to.not.eq(undefined)

        cy.wrap(jsonString).should('not.be.empty')
        const dbPath = this.db ? `cypress/fixtures/${this.db}` : undefined
        cy.setDb(jsonString, dbPath)

        cy.getDb(this.db ? this.db : undefined).then((d) => {
          cy.wrap(d).should('not.be.empty')
        })

        cy.wrap(null).then(() => {
          return cy.clearDb(nativeIdDb)
        })
        cy.wrap(null).then(() => {
          return cy.restoreDbFromJson(nativeIdDb, jsonString)
        })
      })
    })
    cy.visit(this.baseUrl)

    this.wallets.reduce((a, x, i) => {
      return a.then(() =>
        cy.wait(1000).then(() => {
          cy.contains(x).should('be.visible')
        }),
      )
    }, cy.wrap(null))
  })
})
