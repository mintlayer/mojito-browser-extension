import { deleteDatabase } from './utils'

describe(
  'create account page ',
  {
    env: {
      creation: Cypress.env('creation') || 'NewOne',
    },
  },
  () => {
    before(function () {
      cy.setAccess(Cypress.env('creation'))
      deleteDatabase()
      cy.wrap(Cypress.env('baseUrl')).as('baseUrl')
      cy.wrap(Cypress.env('creation')).as('creation')
    })

    beforeEach(function () {
      cy.visit(this.baseUrl)
      cy.contains('button', 'Create').click()
      cy.getAccess(this.creation).then((access) => {
        const { name, password } = access
        cy.setAccountAndPassword(name, password)

        cy.interceptAll(name)
      })
    })

    it('displays attribute pages', function () {
      cy.contains('Mojito').should('be.visible')
      cy.contains('li.step.active', 'Restoring Information').should(
        'be.visible',
      )
      cy.contains(
        'Write down all of the next words. They will be asked to restores your wallet in the future.',
      ).should('be.visible')
      cy.contains(
        'Save they in a very safe place. It is only your backup',
      ).should('be.visible')
      cy.contains('button', 'I understand').should('be.visible')
    })

    it('click on continue', function () {
      cy.contains('button', 'I understand').click()
      cy.getWords('input.words-list-input.readonly').then((words) => {
        expect(words)
        cy.saveAccount(this.creation, { account: words })

        cy.contains('button', 'Backup done!').click()
        cy.writeWords('input.words-list-input', words)
        cy.contains('button', 'Create account').click()

        cy.contains('Just a sec, we are creating your account...').should(
          'be.visible',
        )

        cy.wait(2000)
      })
    })
  },
)
