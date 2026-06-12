const { expect } = require('@playwright/test')
import { useLogin } from './useLogin.js'

export const useSetTestnet = async (page) => {
  await page.getByText('Settings').click()

  await page.getByRole('button', { name: 'Testnet' }).click()
  await useLogin(page)

  await expect(page.getByText('Mintlayer (Testnet)')).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByText('Bitcoin (Testnet)')).toBeVisible({
    timeout: 30000,
  })
}
