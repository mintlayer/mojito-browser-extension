import { expect, test } from '@playwright/test'
import { senderData } from '../../data/index.js'

export const useLogin = async (page) => {
  test.setTimeout(190000)
  await expect(page.locator(':text("Available wallet")')).toBeVisible()

  const account = page.getByText('SenderWallet', { selector: 'div' })
  await account.click()

  await expect(page.locator(`:text("Password for")`)).toBeVisible()
  await expect(page.locator(`:text("${senderData.WALLET_NAME}")`)).toBeVisible()

  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)
  await page.getByRole('button', { name: 'Log In' }).click()

  await page.waitForSelector(':text("Mintlayer")')
}
