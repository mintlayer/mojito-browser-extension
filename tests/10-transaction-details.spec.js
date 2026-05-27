import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(300000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test('Transaction details', async () => {
  await page.getByText('Mintlayer (Testnet)').click()

  await page.getByTestId('transaction').first().waitFor({ timeout: 60000 })
  await page.getByTestId('transaction').first().click()

  const popup = page.getByTestId('popup')
  await expect(popup.getByText('Date')).toBeVisible()
  await expect(popup.getByText('Confirmations')).toBeVisible()
  await expect(popup.getByText('Transaction hash')).toBeVisible()

  const detailValues = popup.getByTestId('transaction-details-item-content')
  const count = await detailValues.count()
  for (let i = 0; i < count; i++) {
    const text = await detailValues.nth(i).innerText()
    expect(text).not.toBe('')
  }

  await expect(popup.getByText('View on Mintlayer Explorer')).toBeVisible()
})
