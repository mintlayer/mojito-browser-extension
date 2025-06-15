/* eslint-disable no-undef */
import { Client, Signer } from '@mintlayer/sdk'
import { useContext, useEffect, useState } from 'react'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

class InMemoryAccountProvider {
  addresses = {}

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

  async request(method, params) {
    console.log('params', params)
    const private_keys = this.private_keys || {}
    const signer = new Signer(private_keys) // TODO: insert private keys here
    if (method === 'signTransaction') {
      const { txData } = params
      if (!txData) {
        throw new Error('Transaction is required for signing')
      }
      const signedTransaction = await signer.sign(txData)
      console.log('signedTransaction', signedTransaction)
      return signedTransaction
    }

    throw new Error('Signing not supported in InMemoryAccountProvider')
  }
}

export const SignTransactionPage = () => {
  const [client, setClient] = useState(null)
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')

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
    const transaction_signed = await client.transfer({
      to: to,
      amount: amount,
    })
    console.log('transaction_signed', transaction_signed)
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
