import { test, expect, Page } from '@playwright/test'
import { useRestoreWallet } from './helpers/hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'

/* Helpers */

async function openAndWaitPopup(page, linkLocator) {
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    linkLocator.click(),
  ])
  return popup
}

async function openAddressesSection(page) {
  await page
    .locator('div', { hasText: /^Addresses$/ })
    .getByTestId('button')
    .click()
  await expect(page.getByTestId('address-table')).toBeVisible()
  await assertAddressTableHeaders(page)
}

async function assertAddressTableHeaders(page) {
  await expect(page.getByTestId('address-table')).toBeVisible()
  const table = page.getByTestId('address-table')
  await expect(table.locator('th.address-title')).toHaveCount(3, {
    timeout: 5000,
  })
  await expect(
    table.locator('th.address-title').filter({ hasText: /^Address$/i }),
  ).toBeVisible()
  await expect(
    table.locator('th.address-title').filter({ hasText: /^Status$/i }),
  ).toBeVisible()
  await expect(
    table.locator('th.address-title').filter({ hasText: /^Balances$/i }),
  ).toBeVisible()
}

async function assertAddressRow(page, index, statusPattern, symbol) {
  const row = page.getByTestId(`address-row-${index}`)
  await expect(row).toBeVisible()
  await expect(row.getByText(statusPattern)).toBeVisible()
  await expect(row.getByText(symbol)).toBeVisible()
}

async function toggleTokens(page) {
  const btn = page.getByRole('button', { name: /tokens/i })
  await btn.click()
}

test.beforeEach(async ({ page }) => {
  test.setTimeout(300_000)
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test.describe('Addresses page', () => {
  test('BTC address interactions', async ({ page }) => {
    await page
      .getByText(/Bitcoin.*Testnet/i)
      .first()
      .click()
    await openAddressesSection(page)

    await assertAddressRow(page, 0, /Used|Unused/i, 'BTC')
    const search = page.getByRole('textbox', { name: /Search by address/i })
    await search.fill('tmlt')
    await expect(search).toHaveValue(/tmlt/i)

    await page.locator('.btn.qr-button-receive').click()
    expect(page.locator('.qrcode')).toBeVisible()
    expect(page.locator('text=Address:')).toBeVisible()
    expect(page.locator('strong').filter({ hasText: /^tb1q/i })).toBeVisible()
  })

  test('Mintlayer address + token expansion', async ({ page }) => {
    await page
      .getByText(/Mintlayer.*Testnet/i)
      .first()
      .click()
    await openAddressesSection(page)
    await assertAddressRow(page, 0, /Used|Unused/i, 'ML')

    await toggleTokens(page)
    await toggleTokens(page)
    await toggleTokens(page)
    const tokenRows = page.locator('.token-item')
    await expect(tokenRows.first()).toBeVisible()
  })

  test('Multiple BTC address popups (sample)', async ({ page }) => {
    await page
      .getByText(/Bitcoin.*Testnet/i)
      .first()
      .click()
    await openAddressesSection(page)

    const targetPatterns = [/tb1qqjwg6/i, /tb1qyxzlg/i]

    for (const pattern of targetPatterns) {
      const popup = await openAndWaitPopup(
        page,
        page.getByRole('link').filter({ hasText: pattern }).first(),
      )
      expect(popup).toBeDefined()
    }
  })
})
