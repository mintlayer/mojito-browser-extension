import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
import { senderData } from './data/index.js'
import {formatAddress } from './helpers/helpers.js'

let page

beforeEach(async ({ page: newPage }) => {
  page = newPage
  await useRestoreWallet(page, 'sender')
})

test('Log in and Log out', async () => {
  await page.click('button.logout')
  await expect(page.locator(':text("Available Wallet(S)")')).toBeVisible()
  await page.getByRole('button', { name: 'SenderWallet' }).click()

  await expect(page.locator(`:text("Password for")`)).toBeVisible()
  await expect(page.locator(`:text("${senderData.WALLET_NAME}")`)).toBeVisible()

  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)
  await page.getByRole('button', { name: 'Log In' }).click()

  await page.waitForSelector(':text("Mintlayer (ML)")')
  await expect(page.locator(':text("Bitcoin (BTC)")')).toBeVisible()
  await expect(page.locator(':text("Mintlayer (ML)")')).toBeVisible()
})
