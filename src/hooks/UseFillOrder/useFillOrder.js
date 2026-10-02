import { useCallback, useContext } from 'react'

import { MintlayerContext } from '@Contexts'
import { Mintlayer } from '@APIs'

const useFillOrder = () => {
  const { client, utxos } = useContext(MintlayerContext)

  const fillOrder = useCallback(
    async ({ order_id, amount, destination }) => {
      let raw
      try {
        raw = await Mintlayer.getOrderById(order_id)
      } catch (e) {
        throw new Error(`Could not fetch order ${order_id}: ${e.message}`)
      }

      let order_details
      try {
        order_details = JSON.parse(raw)
      } catch {
        throw new Error(`Malformed order details received for ${order_id}`)
      }

      const [ask_token_details, give_token_details] = await Promise.all([
        order_details.ask_currency.type === 'Coin'
          ? null
          : Mintlayer.getTokenById(order_details.ask_currency.token_id),
        order_details.give_currency.type === 'Coin'
          ? null
          : Mintlayer.getTokenById(order_details.give_currency.token_id),
      ])

      const transaction = await client.buildTransaction({
        type: 'FillOrder',
        params: {
          order_id,
          amount,
          destination,
          order_details,
          ask_token_details,
          give_token_details,
        },
        ...(utxos.length ? { opts: { withUTXO: utxos } } : {}),
      })

      return client.signTransaction(transaction)
    },
    [client, utxos],
  )

  return fillOrder
}

export default useFillOrder
