// @ts-check
const { test, expect } = require('@playwright/test')
import { WALLET_NAME, WALLET_PASSWORD, MNEMONIC } from './data/crate-restore.js'

const restoreAccountTest = async ({ page }) => {
  test.setTimeout(190000)
  await page.goto('http://127.0.0.1:8000')

  await expect(page.locator('h1')).toHaveText('Mojito')
  await expect(page.locator('h2')).toHaveText(
    'A fresh way to hold Mintlayer assets',
  )

  await page.getByText('Import existing wallet').click()

  await page.getByText('Seed Phrase').click()

  await expect(page.locator('label')).toHaveText(
    'Create a name for your wallet',
  )
  await expect(page.locator('input')).toHaveAttribute(
    'placeholder',
    'Wallet Name',
  )
  await page.fill('input[placeholder="Wallet Name"]', WALLET_NAME)
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.locator('label')).toHaveText(
    'Create a password for your wallet',
  )
  await expect(page.locator('input')).toHaveAttribute('placeholder', 'Password')
  await page.fill('input[placeholder="Password"]', WALLET_PASSWORD)
  await page.getByRole('button', { name: 'Create' }).click()

  await expect(
    page.locator(
      ':text("In order to restore the wallet, please enter your 12 or 24 Seed Phrase.")',
    ),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Enter Seed Phrases' }).click()

  await page.waitForTimeout(1000)

  const textarea = await page.$$('textarea')
  expect(textarea.length).toBe(1)

  const mnemonicString = MNEMONIC.join(' ')
  await textarea[0].fill(mnemonicString)

  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByText(WALLET_NAME).first()).toBeVisible()

  await expect(page.getByText('Bitcoin (BTC)')).toBeVisible({ timeout: 30000 })
  await expect(page.getByText('Mintlayer (ML)')).toBeVisible()
}

test('Restore account', restoreAccountTest)

export const login = async (page) => {
  await restoreAccountTest({ page })
}
