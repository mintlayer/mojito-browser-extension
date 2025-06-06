/* eslint-disable no-undef */
import { Client } from '@mintlayer/sdk'
import { useContext, useEffect, useState } from 'react'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

class InMemoryAccountProvider {
  constructor(addresses) {
    this.addresses = {
      testnet: {
        receiving: addresses.testnet.receiving || [],
        change: addresses.testnet.change || [],
      }
    }
  }

  async connect() {
    return this.addresses
  }

  async restore() {
    return this.addresses
  }

  async disconnect() {
    return
  }

  async request(params) {
    throw new Error('Signing not supported in InMemoryAccountProvider')
  }
}

export const SignTransactionPage = () => {
  const [ client, setClient ] = useState(null)
  const [ to, setTo ] = useState('')

  const { addresses } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses

  useEffect(() => {
    if(currentMlAddresses?.mlReceivingAddresses?.length > 0) {
      console.log('currentMlAddresses', currentMlAddresses)
      const initClient = async () => {
        const clientInstance = await Client.create({
          network: 'testnet',
          accountProvider: new InMemoryAccountProvider({
            testnet: {
              receiving: currentMlAddresses.mlReceivingAddresses || [],
              change: currentMlAddresses.mlChangeAddresses || [],
            }
          }),
        })
        await clientInstance.connect()
        setClient(clientInstance)
      }
      initClient().catch(error => {
        console.error('Failed to initialize Mintlayer Connect SDK:', error)
      })
    }
  }, [currentMlAddresses.mlReceivingAddresses])

  const handleSend = () => {
    console.log(client.getAddresses())
    client.transfer({
      to: to,
      amount: 500,
    })
  }

  return (
    <div>
      Test page for SDK component.
      <input type="text" onChange={(e) => setTo(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  )
}

export default SignTransactionPage
