describe('View transactions page', () => {
  before(() => {
    cy.deleteDatabase()
    cy.clearLocalStorage()

    const baseUrl = Cypress.env('baseUrl')
    cy.wrap(baseUrl).as('baseUrl')

    cy.wrap(Cypress.env('newone')).as('newone')
    cy.wrap(Cypress.env('login')).as('login')
    cy.wrap(Cypress.env('receiver')).as('receiver')

    cy.visit(baseUrl)
    cy.restoreDb()
  })

  describe('Account NewOne with no transactions', () => {
    beforeEach(function () {
      cy.visit(this.baseUrl)
      cy.loginWallet(this.newone)
      cy.contains('li', 'BTC').click()
      cy.wait(2000)
    })

    it('No transaction in this wallet', () => {
      cy.contains('No transactions in this wallet').should('be.visible')
    })

    afterEach(() => {
      cy.get('button[class="btn logout alternate"]').click()
      cy.wait(2000)
    })
  })

  describe('Account Sender with send transactions', () => {
    beforeEach(function () {
      cy.visit(this.baseUrl)
      cy.loginWallet(this.login)
      cy.contains('li', 'BTC').click()
      cy.wait(2000)
    })

    it('checks Send transactions', () => {
      cy.get('button[class="btn logout alternate"]').should('be.visible')
      cy.get('button[class="btn backButton alternate"]').should('be.visible')

      cy.contains('BTC').should('be.visible')
      cy.contains('USD').should('be.visible')
      cy.contains('Send').should('be.visible')
      cy.contains('Receive').should('be.visible')

      cy.get('div.transaction-logo-type.transaction-logo-out')
        .first()
        .should('be.visible')
      cy.contains('li', 'Amount').should('be.visible')
    })

    it('check link transaction detail', () => {
      cy.get('div.transaction-logo-type.transaction-logo-out')
        .first()
        .click()
        .then(() => {
          cy.wait(1000)
          cy.contains('button', 'Open In Blockchain').should('be.visible')
          cy.get('button.btn.popupCloseButton.alternate').click()
        })
    })

    afterEach(() => {
      cy.get('button[class="btn logout alternate"]').click()
      cy.wait(2000)
    })
  })

  describe('Account Receiver with received transactions', () => {
    beforeEach(function () {
      cy.visit(this.baseUrl)
      cy.loginWallet(this.receiver)
      cy.contains('li', 'BTC').click()
      cy.wait(2000)
    })

    it('checks received transactions', () => {
      cy.get('div.transaction-logo-type.false').first().should('be.visible')
      cy.contains('li', 'Amount').should('be.visible')
    })

    afterEach(() => {
      cy.get('button[class="btn logout alternate"]').click()
      cy.wait(2000)
    })
  })
})
