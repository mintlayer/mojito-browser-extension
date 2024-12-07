const { expect } = require('@playwright/test')

export const useSetTestnet = async (page) => {
  await page.click('button.header-menu-button')
  const settings = page.getByText('Settings', { selector: 'li' })
  await settings.click()

  await page.click('strong:text("testnet switcher")')
  await page.click('button.backButton')

  await page.waitForTimeout(10000)

  await expect(page.locator(':text("Bitcoin (Testnet)")')).toBeVisible()
  await expect(page.locator(':text("Mintlayer (Testnet)")')).toBeVisible()
}
