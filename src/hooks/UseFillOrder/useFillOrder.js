import { useCallback, useContext } from 'react'

import { MintlayerContext } from '@Contexts'
import { Mintlayer } from '@APIs'

const useFillOrder = () => {
  const { client, utxos } = useContext(MintlayerContext)

  const fillOrder = useCallback(
    async ({ order_id, amount, destination }) => {
      const order_details = JSON.parse(await Mintlayer.getOrderById(order_id))

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
