import { appHasAccounts } from './appInfo.js'

test('Check if app has any accounts set up', () => {
  expect(appHasAccounts()).toBeFalsy()
})
