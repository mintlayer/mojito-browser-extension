/// <reference types="cypress" />

// context('Actions', () => {

describe('restore information', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/')
    // cy.visit('http://localhost:3000/')
    cy.contains('button', 'Create').click()
    cy.get('input[placeholder="Account Name"]').type('hola')
    cy.contains('button', 'Continue').click()
    cy.get('input[placeholder="Password"]').type('Mintlayer,1')
    cy.contains('button', 'Continue').click()
  })
  it('displays attribute pages', () => {
    // cy.contains('img') // , '[alt="Mojito logo"]'
    cy.contains('Mojito')
    cy.contains(
      'Write down all of the next words. They will be asked to restores your wallet in the future.',
    )
    cy.contains('Save they in a very safe place. It is only your backup')
    cy.contains('button', 'I understand')
  })

  it('click on ... ', () => {})

  it('click on continue', () => {
    cy.contains('button', 'I understand').click()

    cy.wait(1000)
    // cy.get('//*[@id="root"]/main/div/form/div/ul/li[1]/input')
    cy.get('input').each((element) => {
      console.log(element.text())
      // console.log(cy.wrap(element).find('input').text())
      // cy.get('input').type('hola')
    })

    cy.get('input')
      .then(($els) => {
        const texts = Array.from($els, (el) => el.value)
        console.log(texts) //Your array
        return texts
      })
      .then((texts) => {
        console.log(texts)
        cy.contains('button', 'Backup done!').click()

        // fill 12 input
        cy.get('input').each((x, i, a) => {
          cy.wrap(x).type(texts[i])
        })

        cy.contains('button', 'Create account').click()
      })
  })
})
