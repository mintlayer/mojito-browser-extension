// @ts-nocheck
/**
 * NFT + staking UI presence without funds:
 *   - the Dashboard NFTs tab renders the honest empty state (or tiles when
 *     the wallet holds NFTs)
 *   - the Stake screen renders the delegations section with its actions
 * No transactions are performed — this pins the management UI that was
 * lost in the redesign and re-added.
 */
const { expect, test, beforeEach } = require('@playwright/test')
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'

let page

beforeEach(async ({ page: newPage }) => {
  test.setTimeout(190000)
  page = newPage
  await useRestoreWallet(page, 'sender')
  await useSetTestnet(page)
})

test('NFTs tab renders the collection area', async () => {
  await page.getByRole('button', { name: 'NFTs' }).click()

  // honest empty state once the NFT fetch settles; tiles when it holds NFTs
  await page
    .getByText('No NFTs in this wallet')
    .waitFor({ timeout: 30000 })
    .catch(() => {})
  const hasEmpty = await page
    .getByText('No NFTs in this wallet')
    .isVisible()
    .catch(() => false)
  const tileCount = await page.getByTestId('nft-tile').count()
  expect(hasEmpty || tileCount > 0).toBe(true)

  // the full NFT management page is reachable ("See all")
  await page.getByTestId('nft-see-all').click()
  await expect(page.getByText('NFTs', { exact: true }).first()).toBeVisible()
})

test('Stake screen exposes delegation management', async () => {
  await page.getByRole('button', { name: 'Stake' }).click()

  await expect(page.getByText('Staking', { exact: true })).toBeVisible()
  await expect(page.getByText('Delegations', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Create new delegation' }),
  ).toBeVisible()
  await expect(page.getByText('Pool list')).toBeVisible()
})
