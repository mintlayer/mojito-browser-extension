const { expect } = require('@playwright/test')
import { receiverData, senderData } from '../../data/index.js'

export const useRestoreWallet = async (page, walletType) => {
  const wallet = walletType === 'sender' ? senderData : receiverData
  const walletName = wallet.WALLET_NAME
  await page.goto('http://localhost:8000/')
  await page.getByRole('button', { name: 'Restore' }).click()
  await page.getByRole('button', { name: 'Seed Phrase' }).click()
  await page.fill('input[placeholder="Wallet Name"]', wallet.WALLET_NAME)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.fill('input[placeholder="Password"]', wallet.WALLET_PASSWORD)
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByRole('button', { name: 'Enter Seed Phrases' }).click()

  await page.waitForTimeout(1000)

  const textarea = await page.$$('textarea')
  const mnemonicString = wallet.MNEMONIC.join(' ')

  await textarea[0].fill(mnemonicString)
  await page.getByRole('button', { name: 'Continue' }).click()

  await page.getByRole('button', { name: 'Confirm' }).click()
  await page.getByRole('button', { name: 'Segwit' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()

  await page.waitForSelector(`:text("${walletName}")`)
  await expect(page.locator(`:text("${walletName}")`)).toBeVisible()
  await page.waitForSelector(':text("Mintlayer (ML)")')
  await page.waitForSelector(':text("Bitcoin (BTC)")')
  await expect(page.locator(':text("Bitcoin (BTC)")')).toBeVisible()
  await expect(page.locator(':text("Mintlayer (ML)")')).toBeVisible()
}
