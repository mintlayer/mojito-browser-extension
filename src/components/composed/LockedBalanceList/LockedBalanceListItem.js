import { format } from 'date-fns'

import './LockedBalanceListItem.css'

const LockedBalanceListItem = ({ index, utxo }) => {
  return (
    <tr
      key={index}
      style={{
        backgroundColor: index % 2 === 0 ? 'white' : 'rgb(247, 250, 250)',
      }}
    >
      <td style={{ padding: '10px' }}>
        {format(
          new Date(utxo.utxo.lock.content.timestamp * 1000),
          'dd/MM/yyyy HH:mm',
        )}
      </td>
      <td style={{ padding: '10px' }}>{utxo.utxo.value.amount.decimal}</td>
    </tr>
  )
}

export default LockedBalanceListItem
