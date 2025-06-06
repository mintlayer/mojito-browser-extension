/* eslint-disable no-undef */
import { Client } from '@mintlayer/sdk'
import { useContext, useEffect, useState } from 'react'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { useNavigate } from 'react-router-dom'

class InMemoryAccountProvider {
  constructor(addresses) {
    this.addresses = {
      testnet: {
        receiving: addresses.testnet.receiving || [],
        change: addresses.testnet.change || [],
      },
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
  const [client, setClient] = useState(null)
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')

  const navigate = useNavigate()
  const { addresses } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses

  useEffect(() => {
    if (currentMlAddresses?.mlReceivingAddresses?.length > 0) {
      console.log('currentMlAddresses', currentMlAddresses)
      const initClient = async () => {
        const clientInstance = await Client.create({
          network: 'testnet',
          accountProvider: new InMemoryAccountProvider({
            testnet: {
              receiving: currentMlAddresses.mlReceivingAddresses || [],
              change: currentMlAddresses.mlChangeAddresses || [],
            },
          }),
        })
        await clientInstance.connect()
        setClient(clientInstance)
      }
      initClient().catch((error) => {
        console.error('Failed to initialize Mintlayer Connect SDK:', error)
      })
    }
  }, [currentMlAddresses.mlReceivingAddresses])

  const handleSend = async () => {
    console.log(client.getAddresses())
    const transaction = await client.buildTransaction({
      type: 'Transfer',
      params: {
        to: to,
        amount: amount, // Example amount in satoshis
      },
    })
    console.log('transaction', transaction)
    navigate('/wallet/Mintlayer/sign-transaction', {
      state: {
        action: 'signTransaction',
        request: { action: 'signTransaction', data: { txData: transaction } },
      },
    })
  }

  return (
    <div>
      Test page for SDK component.
      <div>
        To:
        <input
          type="text"
          onChange={(e) => setTo(e.target.value)}
        />
      </div>
      <div>
        amount:
        <input
          type="text"
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <button onClick={handleSend}>Send</button>
    </div>
  )
}

export default SignTransactionPage
