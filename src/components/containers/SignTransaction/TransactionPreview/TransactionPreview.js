import React from 'react'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import './TransactionPreview.css'

// TODO: fix the fee calculation
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

const EstimatedChanges = ({ action }) => {
  return (
    <div className="signTxSection">
      <h4>Estimated changes:</h4>
      <p>
        You're giving someone else permission to{' '}
        <span className="signTxAction">{action}</span>
      </p>
    </div>
  )
}

const RequestDetails = ({ transactionData }) => {
  return (
    <div className="signTxSection">
      <h4>Request from:</h4>
      <p>{transactionData.origin}</p>
      <h4>Request id:</h4>
      <p>{transactionData.requestId}</p>
    </div>
  )
}

const NetworkFee = ({ fee }) => {
  if (!fee) return ''
  return (
    <div className="signTxSection">
      <h4>Network fee:</h4>
      <p>{fee.decimal}</p>
    </div>
  )
}

const TransferDetails = ({ transactionData, isToken }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Transfer your coins" />
      <div className="signTxSection">
        <h4>Destination:</h4>
        <p>{JSONRepresentation.outputs[0].destination}</p>
        <h4>Amount:</h4>
        <p>{JSONRepresentation.outputs[0].value.amount.decimal}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const FreezeTokenDetails = ({ transactionData, unfreeze }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.input.token_id,
  )
  return (
    <div className="transactionDetails">
      <div className="signTxSection">
        <h4>Estimated changes:</h4>
        <p>
          You're giving someone else permission to{' '}
          {unfreeze ? 'unfreeze' : 'freeze'} token
        </p>
      </div>
      <div className="signTxSection">
        <h4>Token id:</h4>
        <p>{inputWithToken.input.token_id}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const ChangeTokenMetadata = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.input.token_id,
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Change token metadata" />
      <div className="signTxSection">
        <h4>Token id:</h4>
        <p>{inputWithToken.input.token_id}</p>
      </div>
      <div className="signTxSection">
        <h4>New metadata:</h4>
        <p>{inputWithToken.input.new_metadata_uri}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const ChangeTokenAuthority = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.input.token_id,
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Change token authority" />
      <div className="signTxSection">
        <h4>Token id:</h4>
        <p>{inputWithToken.input.token_id}</p>
      </div>
      <div className="signTxSection">
        <h4>New authority:</h4>
        <p>{inputWithToken.input.new_authority}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const LockTokenSupply = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.input.token_id,
  )

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Lock token supply" />
      <div className="signTxSection">
        <h4>Token id:</h4>
        <p>{inputWithToken.input.token_id}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const BurnToken = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.utxo.value.token_id,
  )

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Burn token" />
      <div className="signTxSection">
        <h4>Token id:</h4>
        <p>{inputWithToken.utxo.value.token_id}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const ConcludeOrder = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)
  const inputWithOrderID = JSONRepresentation.inputs.find(
    (input) => input.input.order_id,
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Conclude order" />
      <div className="signTxSection">
        <h4>Token id:</h4>
        <p>{inputWithOrderID.input.order_id}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const FillOrder = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)
  const inputWithOrderID = JSONRepresentation.inputs.find(
    (input) => input.input.order_id,
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Fill order" />
      <div className="signTxSection">
        <h4>Order id:</h4>
        <p>{inputWithOrderID.input.order_id}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const CreateOrder = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)

  const outputWithCreateOrder = JSONRepresentation.outputs.find(
    (output) => output.type === 'CreateOrder',
  )
  // TODO: double check the data structure with final transaction
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Create order" />
      <div className="signTxSection">
        <h4>Ask balance:</h4>
        <p>{outputWithCreateOrder.ask_balance.decimal}</p>
        <h4>Ask currency:</h4>
        <p>{outputWithCreateOrder.ask_currency.type}</p>
        <h4>Destination:</h4>
        <p>{outputWithCreateOrder.conclude_destination}</p>
        <h4>Give balance:</h4>
        <p>{outputWithCreateOrder.give_balance.decimal}</p>
        <h4>Give currency:</h4>
        <p>Token id: {outputWithCreateOrder.give_currency.token_id}</p>
        <p>type: {outputWithCreateOrder.give_currency.type}</p>
        <h4>Initially asked:</h4>
        <p>{outputWithCreateOrder.initially_asked.decimal}</p>
        <h4>Initially given:</h4>
        <p>{outputWithCreateOrder.initially_given.decimal}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const IssueToken = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs)

  const outputWithCreateOrder = JSONRepresentation.outputs.find(
    (output) => output.type === 'IssueFungibleToken',
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Issue token" />
      <div className="signTxSection">
        <h4>Authority:</h4>
        <p>{outputWithCreateOrder.authority}</p>
        <h4>Freezable:</h4>
        <p>{outputWithCreateOrder.is_freezable ? 'True' : 'False'}</p>
        <h4>Metadata:</h4>
        <p>Hex: {outputWithCreateOrder.metadata_uri.hex}</p>
        <p>String: {outputWithCreateOrder.metadata_uri.string}</p>
        <h4>Number of decimals:</h4>
        <p>{outputWithCreateOrder.number_of_decimals}</p>
        <h4>Token ticker:</h4>
        <p>Hex: {outputWithCreateOrder.token_ticker.hex}</p>
        <p>String: {outputWithCreateOrder.token_ticker.string}</p>
        <h4>Supply type:</h4>
        <p>{outputWithCreateOrder.total_supply.type}</p>
        {outputWithCreateOrder.total_supply?.amount?.decimal && (
          <>
            <h4>Total supply:</h4>
            <p>{outputWithCreateOrder.total_supply.amount.decimal}</p>
          </>
        )}
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const SummaryView = ({ data }) => {
  const { flags, transactionData } = SignTxHelpers.getTransactionDetails(data)
  console.log('flags', flags)
  console.log('transactionData', transactionData)

  return (
    <div className="preview-section summary">
      <div className="preview-section-header">
        <h3>Transaction Preview</h3>
      </div>
      <div>
        {flags.isTransfer && (
          <TransferDetails transactionData={transactionData} />
        )}
        {flags.isUnfreezeToken && (
          <FreezeTokenDetails
            transactionData={transactionData}
            unfreeze
          />
        )}
        {flags.isFreezeToken && (
          <FreezeTokenDetails transactionData={transactionData} />
        )}
        {flags.isChangeTokenMetadata && (
          <ChangeTokenMetadata transactionData={transactionData} />
        )}
        {flags.isChangeTokenAuthority && (
          <ChangeTokenAuthority transactionData={transactionData} />
        )}
        {flags.isLockTokenSupply && (
          <LockTokenSupply transactionData={transactionData} />
        )}
        {flags.isBurnToken && <BurnToken transactionData={transactionData} />}
        {/* TODO: BURN COIN */}
        {flags.isConcludeOrder && (
          <ConcludeOrder transactionData={transactionData} />
        )}
        {flags.isFillOrder && <FillOrder transactionData={transactionData} />}
        {flags.isCreateOrder && (
          <CreateOrder transactionData={transactionData} />
        )}
        {flags.isIssueToken && <IssueToken transactionData={transactionData} />}
      </div>
    </div>
  )
}

const TransactionPreview = ({ data }) => {
  return (
    <div className="transactionPreview">
      <SummaryView data={data} />
    </div>
  )
}

export default TransactionPreview
