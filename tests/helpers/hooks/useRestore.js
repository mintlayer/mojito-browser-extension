const { expect } = require('@playwright/test')
import { receiverData, senderData } from '../../data/index.js'

export const useRestoreWallet = async (page, walletType) => {
  const wallet = walletType === 'sender' ? senderData : receiverData
  const walletName = wallet.WALLET_NAME
  await page.goto('http://127.0.0.1:8000')
  await page.getByText('Import existing wallet').click()
  await page.getByText('Seed Phrase').click()
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

  await expect(page.getByText(walletName).first()).toBeVisible()
  await expect(page.getByText('Bitcoin (BTC)')).toBeVisible({ timeout: 30000 })
  await expect(page.getByText('Mintlayer (ML)')).toBeVisible()
}
