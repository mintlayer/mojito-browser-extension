describe('View balance page', () => {
  before(() => {
    cy.deleteDatabase()
    cy.clearLocalStorage()

    const baseUrl = Cypress.env('baseUrl')
    cy.wrap(baseUrl).as('baseUrl')

    cy.wrap(Cypress.env('newone')).as('newone')

    cy.visit(baseUrl)
    cy.restoreDb()
  })

  describe('Account NewOne view balance', () => {
    beforeEach(function () {
      cy.visit(this.baseUrl)
      cy.wait(1000)
      cy.loginWallet(this.newone)
      cy.getAccess(this.newone).then((access) => {
        return cy.wrap(access).as('access')
      })
    })

    it('checks Empty', function () {
      cy.contains(this.access.name).should('be.visible')
      cy.contains('Bitcoin (BTC)').should('be.visible')
      cy.contains('Mintlayer (ML)').should('be.visible')

      cy.contains('Bitcoin').should('be.visible')
      cy.contains('Mintlayer').should('be.visible')

      cy.get('button[class="btn logout alternate"]').should('be.visible')

      cy.contains('li', 'BTC').should('be.visible')
    })

    it('click in BTC detail', function () {
      cy.contains(this.access.name).should('be.visible')
      cy.contains('li', 'BTC')
        .click()
        .then(() => {
          cy.get(this.access.name).should('not.exist')
        })
    })
  })

  describe('Account Sender view balance', () => {
    beforeEach(function () {
      cy.visit(this.baseUrl)
      cy.loginWallet(Cypress.env('login'))
    })

    it('checks Sender balance', () => {
      cy.contains('Bitcoin (BTC)').should('be.visible')
      cy.contains('Mintlayer (ML)').should('be.visible')
    })
  })

  describe('Receiver account view balance', () => {
    beforeEach(function () {
      cy.visit(this.baseUrl)
      cy.loginWallet(Cypress.env('receiver'))
    })

    it('checks Receiver balance', () => {
      cy.contains('Bitcoin (BTC)').should('be.visible')
      cy.contains('Mintlayer (ML)').should('be.visible')
    })
  })
})
