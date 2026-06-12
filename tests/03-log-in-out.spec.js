import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { senderData } from './data/index.js'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(190000)
  page = newPage
  await useRestoreWallet(page, 'sender')
})

test('Log in and Log out', async () => {
  test.setTimeout(190000)
  await page.getByTestId('navigation-logout').click()
  await expect(page.getByText('Choose an account')).toBeVisible()

  await page.getByText(senderData.WALLET_NAME).click()

  await expect(page.getByText('Welcome back')).toBeVisible()
  await expect(page.getByText(senderData.WALLET_NAME).first()).toBeVisible()

  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)
  await page.getByTestId('login-password-submit').click()

  await expect(page.getByText('Bitcoin (BTC)')).toBeVisible({ timeout: 30000 })
  await expect(page.getByText('Mintlayer (ML)')).toBeVisible()
})
