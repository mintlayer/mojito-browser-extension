import { expect, test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(190000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test('Custom output page', async () => {
  test.setTimeout(190000)
  await page.click(
    'li.crypto-item[data-testid="crypto-item"] h5:text("Mintlayer (Testnet)")',
  )
  await page.waitForTimeout(19000)

  await page
    .locator('div')
    .filter({ hasText: /^Custom Transaction$/ })
    .getByTestId('button')
    .click()
  await expect(page.getByText('Balance:')).toBeVisible()
  await expect(page.getByText('Select template:')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible()
  await expect(page.getByRole('combobox')).toBeVisible()
  await expect(
    page.getByText('Please select a template to start'),
  ).toBeVisible()
  await expect(page.locator('textarea')).toBeVisible()
  await expect(
    page.getByRole('button', {
      name: 'Validate and augment with inputs/outputs',
    }),
  ).toBeVisible()
  await expect(page.getByText('Transaction preview switch to')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'switch to explorer view' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Inputs:' })).toBeVisible()
  await expect(page.getByText('Inputs:[]')).toBeVisible()
  await expect(page.getByText('Outputs:[]')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Outputs:' })).toBeVisible()
  await expect(page.getByText('Fee:')).toBeVisible()
  await expect(page.getByPlaceholder('Placeholder')).toBeVisible()
  await expect(page.getByText('TML', { exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('Password')).toBeVisible()
  await expect(page.getByText('Enter your password:')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Build transaction' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Broadcast transaction' }),
  ).toBeVisible()

  await expect(
    page.getByText('Please select a custom output template'),
  ).not.toBeVisible()
  await expect(page.getByText('Password must be set.')).not.toBeVisible()

  await page
    .getByRole('button', {
      name: 'Validate and augment with inputs/outputs',
    })
    .click()
  await expect(
    page.getByText('Please select a template to start'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Build transaction' }).click()
  await expect(page.getByText('Password must be set.')).toBeVisible()
})
