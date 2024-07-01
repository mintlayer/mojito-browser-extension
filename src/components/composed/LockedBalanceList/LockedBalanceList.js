import React, { useContext } from 'react'
import { NetworkContext } from '@Contexts'

import { Loading } from '@ComposedComponents'
import LockedBalanceListItem from './LockedBalanceListItem'
import './LockedBalanceList.css'

const LockedBalanceList = () => {
  const { lockedUtxos, transactions, fetchingUtxos } =
    useContext(NetworkContext)
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
                <th
                  style={{ padding: '10px', textAlign: 'left' }}
                  className="locked-title"
                >
                  Date
                </th>
                <th
                  style={{ padding: '10px', textAlign: 'left' }}
                  className="locked-title"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {lockedUtxos &&
                lockedUtxos.map((utxo, index) => (
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
