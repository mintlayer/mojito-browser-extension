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

test('Delegation details', async () => {
  await page.getByText('Mintlayer (Testnet)').click()
  await page.click('button.button-transaction-staking')

  await page.getByTestId('delegation').first().waitFor({ timeout: 60000 })
  await page.getByTestId('delegation').first().click()

  const popup = page.getByTestId('popup')
  await expect(popup.getByText('Date')).toBeVisible()
  await expect(popup.getByText('Pool id')).toBeVisible()
  await expect(popup.getByText('Amount')).toBeVisible()
  await expect(popup.getByText('Spend address')).toBeVisible()

  const detailValues = popup.getByTestId('delegation-details-item-content')
  const count = await detailValues.count()
  for (let i = 0; i < count; i++) {
    const text = await detailValues.nth(i).innerText()
    expect(text).not.toBe('')
  }

  await expect(popup.getByText('Add funds')).toBeVisible()
  await expect(popup.getByText('Withdraw')).toBeVisible()
  await expect(popup.getByText('Open in Block Explorer')).toBeVisible()
})
