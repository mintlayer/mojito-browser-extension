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

  it('check and click on button Account Name', function () {
    cy.contains('li.step.active', 'Account Name').should('be.visible')
    cy.contains('Create a name to your account').should('be.visible')
    cy.contains('Mojito').should('be.visible')

    cy.setAccount(this.access.name)
    cy.contains('button', 'Continue').should('be.visible')

    cy.contains('li.step.false', 'Account Name').should('be.visible')
  })
})
