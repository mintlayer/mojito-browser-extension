import { test, expect } from '@playwright/test'
import { useRestoreWallet } from './helpers/hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'

async function navigateToAddressPage(page, coinPattern) {
  await page.getByText(coinPattern).first().click()
  await page.getByText('Addr.').click()
  await expect(page.getByTestId('address-table')).toBeVisible({
    timeout: 60000,
  })
  await page.getByTestId('address-row-0').waitFor({ timeout: 60000 })
}

test.beforeEach(async ({ page }) => {
  test.setTimeout(300_000)
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test.describe('Addresses page', () => {
  test('BTC address interactions', async ({ page }) => {
    await navigateToAddressPage(page, /Bitcoin.*Testnet/i)

    const table = page.getByTestId('address-table')
    await expect(table.getByText('ADDRESS')).toBeVisible()
    await expect(table.getByText('STATUS')).toBeVisible()
    await expect(table.getByText('BALANCE')).toBeVisible()

    const firstRow = page.getByTestId('address-row-0')
    await expect(firstRow.getByText(/Used|Unused/)).toBeVisible()
    await expect(firstRow.getByText('BTC')).toBeVisible()

    const link = firstRow.locator('a').first()
    await expect(link).toHaveAttribute('target', '_blank')
    const href = await link.getAttribute('href')
    expect(href).toBeTruthy()

    const search = page.locator('#address-search-input')
    await search.fill('tb1')
    await expect(search).toHaveValue('tb1')
  })

  test('Mintlayer address + token expansion', async ({ page }) => {
    await navigateToAddressPage(page, /Mintlayer.*Testnet/i)

    const firstRow = page.getByTestId('address-row-0')
    await expect(firstRow.getByText(/Used|Unused/)).toBeVisible()
    await expect(firstRow.getByText('ML')).toBeVisible()

    const tokensButton = page.getByText(/\d+ tokens?/)
    if ((await tokensButton.count()) > 0) {
      await tokensButton.first().click()
      await tokensButton.first().click()
    }
  })

  test('QR code popup', async ({ page }) => {
    await navigateToAddressPage(page, /Bitcoin.*Testnet/i)

    const firstRow = page.getByTestId('address-row-0')
    await firstRow.locator('button').last().click()

    const popup = page.getByTestId('popup')
    await expect(popup.locator('.qrcode')).toBeVisible()
    await expect(popup.getByText('Address:')).toBeVisible()
    await expect(popup.getByText('Copy Address')).toBeVisible()
  })
})
