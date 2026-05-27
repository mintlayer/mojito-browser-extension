import { expect } from '@playwright/test'
import { senderData } from '../../data/index.js'

export const useLogin = async (page) => {
  await expect(page.getByText('Choose an account')).toBeVisible()

  await page.getByText(senderData.WALLET_NAME).click()

  await expect(page.getByText('Welcome back')).toBeVisible()

  await page.fill('input[placeholder="Password"]', senderData.WALLET_PASSWORD)
  await page.getByTestId('login-password-submit').click()

  await expect(page.getByText(/Mintlayer/).first()).toBeVisible({
    timeout: 30000,
  })
}
