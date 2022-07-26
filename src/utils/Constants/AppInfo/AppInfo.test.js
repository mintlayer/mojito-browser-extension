import { appAccounts } from './AppInfo.js'

test('Check if app has any accounts set up', async () => {
  const accounts = await appAccounts()
  expect(accounts.length).toBe(0)
})
