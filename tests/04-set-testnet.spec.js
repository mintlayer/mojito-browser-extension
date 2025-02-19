import { test, beforeEach } from '@playwright/test'
import { useRestoreWallet } from './helpers//hooks/useRestore'
import { useSetTestnet } from './helpers/hooks/useSetTestnet'
let page

beforeEach(async ({ page: newPage }) => {
  page = newPage
  await useRestoreWallet(page, 'sender')
})

test('Set Testnet', async () => {
  test.setTimeout(190000)
  await useSetTestnet(page)
})
