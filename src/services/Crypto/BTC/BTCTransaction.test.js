//

// TODO: Investigate why @bitcoinerlab/secp256k1 and ECPairFactory are not widely used in the Jest environment, and find a solution to make the tests work.
test.skip('Address Generation - know data', () => {
  const address = 'dsadadasdad'
  expect(address).toBe('dsadadasdad')
})
