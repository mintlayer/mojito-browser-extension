import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { senderData } from './data/index.js'
import { formatAddress } from './helpers/helpers.js'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(190000)
  page = newPage
  await useRestoreWallet(page, 'sender')
})

test('Log in and Log out', async () => {
  test.setTimeout(190000)
  await page.click('button.header-menu-button')
  const logoutElement = page.getByText('Logout', { selector: 'li' })
  await logoutElement.click()
  await expect(page.locator(':text("Available wallet")')).toBeVisible()

  const account = page.getByText('SenderWallet', { selector: 'div' })
  await account.click()

  await expect(page.locator(`:text("Password for")`)).toBeVisible()
  await expect(page.locator(`:text("${senderData.WALLET_NAME}")`)).toBeVisible()

  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)
  await page.getByRole('button', { name: 'Log In' }).click()

  await page.waitForSelector(':text("Mintlayer (ML)")')
  await expect(page.locator(':text("Bitcoin (BTC)")')).toBeVisible()
  await expect(page.locator(':text("Mintlayer (ML)")')).toBeVisible()
})
