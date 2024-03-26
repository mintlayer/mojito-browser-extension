describe('set Account page', () => {
  before(() => {
    cy.deleteDatabase()
    cy.wrap(Cypress.env('baseUrl')).as('baseUrl')

    cy.getAccess(Cypress.env('create')).then((access) => {
      return cy.wrap(access).as('access')
    })
  })

  beforeEach(function () {
    cy.visit(this.baseUrl)
    cy.contains('button', 'Create').click()
  })

  it('check and click on button Wallet Name', function () {
    cy.contains('li.step.active', 'Wallet Name').should('be.visible')
    cy.contains('Create a name for your wallet').should('be.visible')
    cy.contains('Mojito').should('be.visible')

    cy.setAccount(this.access.name)
    cy.contains('button', 'Continue').should('be.visible')

    cy.contains('li.step.false', 'Wallet Name').should('be.visible')
  })
})
