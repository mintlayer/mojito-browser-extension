// import { useMemo } from 'react'
import { format } from 'date-fns'

import './LockedBalanceListItem.css'

const displayDate = (utxo) => {
  if (utxo.utxo.lock.type === 'ForBlockCount') {
      return `~ ${format(
        new Date(utxo.utxo.lock.content.timestamp / 1000),
        'dd/MM/yyyy HH:mm',
      )} (Block height: ${utxo.utxo.lock.content.unlockHeight})`
    } else if (utxo.utxo.lock.type === 'UntilTime') {
      return format(
        new Date(utxo.utxo.lock.content.timestamp * 1000),
        'dd/MM/yyyy HH:mm',
      )
    }
  }

const LockedBalanceListItem = ({ index, utxo }) => {
  return (
    <tr
      className="locked-balance-list-item"
    >
      <td
        className="locked-balance-cell"
      >
        {displayDate(utxo)}
      </td>
      <td
        className="locked-balance-cell"
      >
        {utxo.utxo.value.amount.decimal} ML
      </td>
    </tr>
  )
}

export default LockedBalanceListItem
