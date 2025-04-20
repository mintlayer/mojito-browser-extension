import React, { useState } from 'react'
import './style.css'

// SVG Icons for transaction types
const TransferIcon = () => (
  <svg
    className="tx-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M17 8l4 4m0 0l-4 4m4-4H3"
      strokeWidth="2"
    />
  </svg>
)

const TokenMintIcon = () => (
  <svg
    className="tx-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      strokeWidth="2"
    />
    <path
      d="M12 6v12M6 12h12"
      strokeWidth="2"
    />
  </svg>
)

const TokenIssueIcon = () => (
  <svg
    className="tx-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      strokeWidth="2"
    />
  </svg>
)

const OrderIcon = () => (
  <svg
    className="tx-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      d="M3 3h18v18H3z"
      strokeWidth="2"
    />
    <path
      d="M12 8v8M8 12h8"
      strokeWidth="2"
    />
  </svg>
)

const formatAmount = (amount) => {
  if (!amount) return 'N/A'
  return amount.decimal
    ? `${amount.decimal} (${amount.atoms || '0'} atoms)`
    : `${amount.atoms || '0'} atoms`
}

const calculateFee = (inputs, outputs) => {
  let totalInput = 0
  let totalOutput = 0

  inputs.forEach((input) => {
    const amount = input.utxo?.value?.amount || input.input?.amount
    if (amount?.atoms) totalInput += parseInt(amount.atoms, 10)
  })

  outputs.forEach((output) => {
    const amount =
      output.value?.amount || output.ask_balance || output.total_supply?.amount
    if (amount?.atoms) totalOutput += parseInt(amount.atoms, 10)
  })

  const feeAtoms = totalInput - totalOutput
  return feeAtoms > 0
    ? { atoms: feeAtoms.toString(), decimal: (feeAtoms / 1e8).toFixed(8) }
    : null
}

const SummaryView = ({ data }) => {
  const { inputs = [], outputs = [] } = data

  const getTransactionType = () => {
    if (outputs.some((out) => out.type === 'IssueFungibleToken'))
      return { name: 'Token Issuance', icon: <TokenIssueIcon /> }
    if (outputs.some((out) => out.type === 'CreateOrder'))
      return { name: 'Order Creation', icon: <OrderIcon /> }
    if (inputs.some((inp) => inp.input?.command === 'FillOrder'))
      return { name: 'Order Fill', icon: <OrderIcon /> }
    if (inputs.some((inp) => inp.input?.type === 'ConcludeOrder'))
      return { name: 'Order Conclusion', icon: <OrderIcon /> }
    if (inputs.some((inp) => inp.input?.command === 'MintTokens'))
      return { name: 'Token Mint', icon: <TokenMintIcon /> }
    return { name: 'Transfer', icon: <TransferIcon /> }
  }

  const fee = calculateFee(inputs, outputs)
  const txType = getTransactionType()

  return (
    <div className="preview-section summary">
      <h3>
        {txType.icon}
        {txType.name}
      </h3>
      <div className="summary-grid">
        <div>
          <strong>Total Input:</strong>{' '}
          {inputs.reduce(
            (sum, inp) =>
              sum +
              parseInt(
                inp.utxo?.value?.amount?.atoms || inp.input?.amount?.atoms || 0,
                10,
              ),
            0,
          )}{' '}
          atoms
        </div>
        <div>
          <strong>Total Output:</strong>{' '}
          {outputs.reduce(
            (sum, out) =>
              sum +
              parseInt(
                out.value?.amount?.atoms || out.ask_balance?.atoms || 0,
                10,
              ),
            0,
          )}{' '}
          atoms
        </div>
        <div>
          <strong>Fee:</strong> {fee ? formatAmount(fee) : 'N/A'}
        </div>
        <div>
          <strong>Destinations:</strong>{' '}
          {outputs
            .filter((out) => out.destination)
            .map((out) => out.destination)
            .join(', ') || 'N/A'}
        </div>
      </div>
      {txType.name === 'Token Issuance' && (
        <div className="extra-info">
          <p>
            <strong>Token Ticker:</strong>{' '}
            {
              outputs.find((out) => out.type === 'IssueFungibleToken')
                ?.token_ticker?.string
            }
          </p>
          <p>
            <strong>Supply:</strong>{' '}
            {
              outputs.find((out) => out.type === 'IssueFungibleToken')
                ?.total_supply?.type
            }
          </p>
        </div>
      )}
      {txType.name.includes('Order') && (
        <div className="extra-info">
          <p>
            <strong>Order ID:</strong>{' '}
            {inputs.find((inp) => inp.input?.order_id)?.input?.order_id ||
              outputs.find((out) => out.type === 'CreateOrder')?.order_id ||
              'N/A'}
          </p>
        </div>
      )}
    </div>
  )
}

const DetailedView = ({ data }) => {
  const { inputs = [], outputs = [] } = data

  return (
    <div className="preview-section">
      <h3>Detailed Transaction</h3>
      <div className="detail-grid">
        {inputs.map((input, index) => (
          <div
            key={index}
            className="detail-item"
          >
            <h4>Input {index + 1}</h4>
            {input.input?.input_type === 'UTXO' ? (
              <>
                <p>
                  <strong>Source ID:</strong> {input.input.source_id}
                </p>
                <p>
                  <strong>Destination:</strong>{' '}
                  {input.utxo?.destination || 'N/A'}
                </p>
                <p>
                  <strong>Amount:</strong>{' '}
                  {formatAmount(input.utxo?.value?.amount)}
                </p>
                <p>
                  <strong>Type:</strong> {input.utxo?.value?.type}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Command:</strong>{' '}
                  {input.input?.command || input.input?.type}
                </p>
                <p>
                  <strong>Authority:</strong> {input.input?.authority || 'N/A'}
                </p>
                <p>
                  <strong>Nonce:</strong> {input.input?.nonce || 'N/A'}
                </p>
                <p>
                  <strong>Amount:</strong> {formatAmount(input.input?.amount)}
                </p>
                <p>
                  <strong>Token ID:</strong> {input.input?.token_id || 'N/A'}
                </p>
              </>
            )}
          </div>
        ))}
        {outputs.map((output, index) => (
          <div
            key={index}
            className="detail-item"
          >
            <h4>Output {index + 1}</h4>
            {output.type === 'IssueFungibleToken' ? (
              <>
                <p>
                  <strong>Type:</strong> Token Issuance
                </p>
                <p>
                  <strong>Ticker:</strong> {output.token_ticker?.string}
                </p>
                <p>
                  <strong>Authority:</strong> {output.authority}
                </p>
                <p>
                  <strong>Decimals:</strong> {output.number_of_decimals}
                </p>
                <p>
                  <strong>Freezable:</strong>{' '}
                  {output.is_freezable ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Metadata:</strong> {output.metadata_uri?.string}
                </p>
              </>
            ) : output.type === 'CreateOrder' ? (
              <>
                <p>
                  <strong>Type:</strong> Order Creation
                </p>
                <p>
                  <strong>Ask:</strong> {formatAmount(output.ask_balance)} (
                  {output.ask_currency?.type})
                </p>
                <p>
                  <strong>Give:</strong> {formatAmount(output.give_balance)} (
                  {output.give_currency?.type})
                </p>
                <p>
                  <strong>Destination:</strong> {output.conclude_destination}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Type:</strong> {output.type}
                </p>
                <p>
                  <strong>Destination:</strong> {output.destination || 'N/A'}
                </p>
                <p>
                  <strong>Amount:</strong> {formatAmount(output.value?.amount)}
                </p>
                <p>
                  <strong>Value Type:</strong> {output.value?.type}
                </p>
                {output.lock && (
                  <p>
                    <strong>Lock:</strong> {output.lock.type} (
                    {output.lock.content} blocks)
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const TableView = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { inputs = [], outputs = [] } = data

  return (
    <div className="preview-section">
      <h3
        onClick={() => setIsOpen(!isOpen)}
        className="toggle-header"
      >
        {isOpen ? '▼' : '▶'} Inputs & Outputs Table
      </h3>
      {isOpen && (
        <>
          <h4>Inputs</h4>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Source/Details</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((input, index) => (
                <tr key={index}>
                  <td>{input.input?.input_type}</td>
                  <td>
                    {input.input?.input_type === 'UTXO' ? (
                      `Source: ${input.input.source_id.slice(0, 10)}...`
                    ) : (
                      <>
                        Cmd: {input.input?.command || input.input?.type}
                        <br />
                        Auth: {input.input?.authority?.slice(0, 10) ||
                          'N/A'}...
                      </>
                    )}
                  </td>
                  <td>
                    {formatAmount(
                      input.utxo?.value?.amount || input.input?.amount,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4>Outputs</h4>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Destination</th>
                <th>Amount</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {outputs.map((output, index) => (
                <tr key={index}>
                  <td>{output.type}</td>
                  <td>
                    {(output.destination || output.authority)?.slice(0, 10) ||
                      'N/A'}
                    ...
                  </td>
                  <td>
                    {formatAmount(output.value?.amount || output.ask_balance)}
                  </td>
                  <td>
                    {output.type === 'IssueFungibleToken'
                      ? `Ticker: ${output.token_ticker?.string}`
                      : output.type === 'CreateOrder'
                        ? `Ask: ${output.ask_currency?.type}`
                        : output.value?.type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

export const TransactionPreview = ({ data }) => {
  return (
    <div className="transactionPreview">
      <SummaryView data={data} />
      <DetailedView data={data} />
      <TableView data={data} />
    </div>
  )
}
