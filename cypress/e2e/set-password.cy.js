describe('set password page', () => {
  before(() => {
    cy.deleteDatabase()
    cy.wrap(Cypress.env('baseUrl')).as('baseUrl')
    cy.wrap(Cypress.env('create')).as('create')
  })

  beforeEach(function () {
    cy.visit(this.baseUrl)
    cy.contains('button', 'Create').click()
    cy.getAccess(this.create).then((access) => {
      cy.setAccount(access.name)
      return cy.wrap(access).as('access')
    })
  })

  it('displays attribute pages', () => {
    cy.contains('li.step.active', 'Account Password').should('be.visible')
    cy.contains('Create a password for your account').should('be.visible')
    cy.contains('Mojito').should('be.visible')
    cy.contains('button', 'Continue').should('be.visible')
    cy.get('input[placeholder="Password"]').should('be.visible')
  })

  it('click on continue', function () {
    cy.setPassword(this.access.password)
    cy.contains('button', 'Continue').should('be.visible')

    cy.contains('li.step.false', 'Account Password').should('be.visible')
  })
})
