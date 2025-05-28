const { expect } = require('@playwright/test')
import { useLogin } from './useLogin.js'

export const useSetTestnet = async (page) => {
  await page.click('button.header-menu-button')
  const settings = page.getByText('Settings', { selector: 'li' })
  await settings.click()

  await page.click('strong:text("testnet switcher")')
  // await page.click('button.backButton')

  // await expect(page.locator(':text("Bitcoin (Testnet)")')).toBeVisible()
  // await expect(page.locator(':text("Mintlayer (Testnet)")')).toBeVisible()

  await useLogin(page)

  await page.waitForSelector(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet")',
  )
  await page.waitForSelector(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Bitcoin (Testnet")',
  )
}
