import React, { useContext } from 'react'
import { MintlayerContext } from '@Contexts'

import { Loading } from '@ComposedComponents'
import LockedBalanceListItem from './LockedBalanceListItem'
import './LockedBalanceList.css'

const LockedBalanceList = () => {
  const { lockedUtxos, transactions, fetchingUtxos, currentHeight } =
    useContext(MintlayerContext)
  // const [updatedUtxosList, setUpdatedUtxosList] = useState([])

  // const getUpdatedUtxosWithDate = useCallback(
  //   async (utxos) => {
  //     setLoading(true)
  //     const updatedUtxos = await Promise.all(
  //       utxos.map(async (utxo) => {
  //         if (utxo.utxo.lock.type === 'ForBlockCount') {
  //           const initialTransaction = transactions.find(
  //             (tx) => tx.txid === utxo.outpoint.source_id,
  //           )
  //
  //           const blocksToUnlock = utxo.utxo.lock.content - initialTransaction.confirmations
  //
  //           console.log('blocksToUnlock', blocksToUnlock)
  //
  //           console.log('initialTransaction', initialTransaction)
  //           if (initialTransaction && !utxo.utxo.lock.content.unlockBlock) {
  //             // Calculating the unlock date
  //             // const calculatedUnlockTimestamp =
  //             //   addDays(
  //             //     new Date(initialTransaction.date * 1000),
  //             //     10,
  //             //   ).getTime() / 1000
  //
  //             const calculatedUnlockTimestamp = 1
  //
  //             console.log('initialTransaction', initialTransaction)
  //             const blockData = 1
  //
  //             utxo.utxo.lock.content = {
  //               lockedFor: utxo.utxo.lock.content,
  //               timestamp: calculatedUnlockTimestamp,
  //               unlockBlock: blockData + utxo.utxo.lock.content,
  //             }
  //           }
  //         }
  //         return utxo
  //       }),
  //     )
  //     setLoading(false)
  //     return updatedUtxos
  //   },
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [lockedUtxos, transactions],
  // )
  //
  // useEffect(() => {
  //   const fetchUpdatedUtxos = async () => {
  //     const updatedUtxos = await getUpdatedUtxosWithDate(lockedUtxos)
  //     const sortedUtxos = updatedUtxos.sort(
  //       (a, b) => a.utxo.lock.content.timestamp - b.utxo.lock.content.timestamp,
  //     )
  //     setUpdatedUtxosList(sortedUtxos)
  //   }
  //
  //   fetchUpdatedUtxos()
  // }, [lockedUtxos, transactions, getUpdatedUtxosWithDate])

  const updatedUtxosList = lockedUtxos.map((utxo) => {
    if (utxo.utxo.lock.type === 'ForBlockCount') {
      const initialTransaction = transactions.find(
        (tx) => tx.txid === utxo.outpoint.source_id,
      )

      const blocksToUnlock = utxo.utxo.lock.content - initialTransaction.confirmations

      if(blocksToUnlock < 0) {
        return null
      }

      return {
        ...utxo,
        utxo: {
          ...utxo.utxo,
          lock: {
            ...utxo.utxo.lock,
            content: {
              ...utxo.utxo.lock.content,
              blocksToUnlock,
              unlockHeight: currentHeight - initialTransaction.confirmations + utxo.utxo.lock.content,
              timestamp: initialTransaction.date + utxo.utxo.lock.content * 120, // Assuming 10 minutes per block
            },
          },
        },
      }
    }

    return {
      ...utxo,
    }
  }).reduce(
    (acc, utxo) => (utxo ? [...acc, utxo] : acc), []
  )

  return (
    <>
      <div className="locked-table-wrapper">
        {fetchingUtxos ? (
          <div className="locked-loading-wrapper">
            <Loading />
          </div>
        ) : (
          <table
            className="locked-table"
            data-testid="locked-table"
          >
            <thead>
              <tr>
                <th className="locked-title">Date</th>
                <th className="locked-title">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lockedUtxos &&
                updatedUtxosList.map((utxo, index) => (
                  <LockedBalanceListItem
                    key={index}
                    index={index}
                    utxo={utxo}
                    transactions={transactions}
                  />
                ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default LockedBalanceList
