const { expect } = require('@playwright/test')

export const useSetTestnet = async (page) => {
  await page.click('button.settings')
  await page.click('strong:text("testnet switcher")')
  await page.click('button.backButton')

  await expect(page.locator(':text("Bitcoin (Test)")')).toBeVisible()
  await expect(page.locator(':text("Mintlayer (Test)")')).toBeVisible()
}
