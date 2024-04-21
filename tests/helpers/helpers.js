const formatAddress = (address) => {
  if (!address) {
    return 'Wrong address'
  }
  const limitSize = 24
  const halfLimit = limitSize / 2
  const firstPart = address.slice(0, halfLimit)
  const lastPart = address.slice(address.length - halfLimit, address.length)
  return `${firstPart}...${lastPart}`
}

export { formatAddress }
