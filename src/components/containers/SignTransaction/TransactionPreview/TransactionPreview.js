import React, { useContext } from 'react'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import './TransactionPreview.css'

import { AccountContext, SettingsContext } from '@Contexts'

const findRelevantOutput = (inputs, outputs, requiredAddresses) => {
  const inputWithToken = inputs.find(
    (input) => input.utxo?.value?.type === 'TokenV1',
  )
  if (inputWithToken) {
    const tokenId = inputWithToken.utxo.value.token_id
    return outputs.find(
      (output) =>
        output.value.token_id === tokenId &&
        !requiredAddresses.includes(output.destination),
    )
  }
  return outputs.find(
    (output) => !requiredAddresses.includes(output.destination),
  )
}

const calculateFee = (inputs, outputs, addresses) => {
  const totalAmountCoins = inputs.reduce((acc, input) => {
    if (
      input.utxo &&
      input.utxo.type === 'Transfer' &&
      !input?.utxo?.value?.token_id
    ) {
      return acc + Number(input.utxo.value.amount.decimal)
    }
    return acc
  }, 0)

  const change = outputs.find((output) =>
    addresses.includes(output.destination),
  )?.value.amount.decimal

  return Number(totalAmountCoins) - Number(change)
}

const EstimatedChanges = ({ action }) => {
  return (
    <div className="signTxSection">
      <h4>Estimated changes:</h4>
      <p>
        You’re approving a one-time request to{' '}
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
      <p>{fee}</p>
    </div>
  )
}

const TransferDetails = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.utxo.value.type === 'TokenV1',
  )
  const tokenId = inputWithToken ? inputWithToken?.utxo.value.token_id : null
  const title = inputWithToken ? 'Transfer token' : 'Transfer coins'

  const relevantOutput = findRelevantOutput(
    JSONRepresentation.inputs,
    JSONRepresentation.outputs,
    requiredAddresses,
  )

  return (
    <div className="transactionDetails">
      <EstimatedChanges action={title} />
      <div className="signTxSection">
        <h4>Destination:</h4>
        <p>{relevantOutput.destination}</p>
        {inputWithToken && (
          <>
            <h4>Token id:</h4>
            <p>{tokenId}</p>
          </>
        )}
        <h4>Amount:</h4>
        <p>{relevantOutput.value.amount.decimal}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const FreezeTokenDetails = ({
  transactionData,
  requiredAddresses,
  unfreeze,
}) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.input.token_id,
  )
  return (
    <div className="transactionDetails">
      <div className="signTxSection">
        <h4>Estimated changes:</h4>
        <p>
          You’re approving a one-time request to{' '}
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

const ChangeTokenMetadata = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

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

const ChangeTokenAuthority = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

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

const LockTokenSupply = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

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

const BurnToken = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

  const burnOutput = JSONRepresentation.outputs.find(
    (output) => output.type === 'BurnToken',
  )
  const tokenId =
    burnOutput?.value?.type === 'TokenV1' ? burnOutput.value.token_id : null

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Burn token" />
      {tokenId ? (
        <div className="signTxSection">
          <h4>Token id:</h4>
          <p>{tokenId}</p>
        </div>
      ) : (
        <div className="signTxSection">
          <h4>Mintlayer Coin</h4>
        </div>
      )}
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const ConcludeOrder = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)
  const inputWithOrderID = JSONRepresentation.inputs.find(
    (input) => input.input.order_id,
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Conclude order" />
      <div className="signTxSection">
        <h4>Order ID:</h4>
        <p>{inputWithOrderID.input.order_id}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const FillOrder = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)
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

const CreateOrder = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

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

const IssueToken = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)
  console.log('fee', fee)

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

const IssueNft = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

  const outputWithIssueNft = JSONRepresentation.outputs.find(
    (output) => output.type === 'IssueNft',
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Issue NFT" />
      <div className="signTxSection">
        <h4>Destination:</h4>
        <p>{outputWithIssueNft.destination}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const DataDeposit = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

  const outputWithDataDeposit = JSONRepresentation.outputs.find(
    (output) => output.type === 'DataDeposit',
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Data Deposit" />
      <div className="signTxSection">
        <h4>Data:</h4>
        <p>{outputWithDataDeposit.data}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const CreateDelegationId = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

  const outputWithDataDeposit = JSONRepresentation.outputs.find(
    (output) => output.type === 'CreateDelegationId',
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Create Delegation" />
      <div className="signTxSection">
        <h4>Pool Id:</h4>
        <p>{outputWithDataDeposit.pool_id}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const DelegateStaking = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

  const outputWithDataDeposit = JSONRepresentation.outputs.find(
    (output) => output.type === 'DelegateStaking',
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Stake to delegation" />
      <div className="signTxSection">
        <h4>Delegation Id:</h4>
        <p>{outputWithDataDeposit.delegation_id}</p>
        <h4>Amount:</h4>
        <p>{outputWithDataDeposit.amount.decimal}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const BridgeRequest = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const { inputs, outputs } = JSONRepresentation
  const fee = calculateFee(inputs, outputs, requiredAddresses)

  const inputsWithTokens = JSONRepresentation.inputs.filter(
    (input) => input.utxo.value.token_id,
  )
  const outputsWithTokens = JSONRepresentation.outputs.filter(
    (output) => output.value.token_id,
  )

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="make a Bridge request" />
      <div className="signTxSection">
        <h4>Token id:</h4>
        <p>{inputsWithTokens[0].utxo.value.token_id}</p>
        <h4>Amount:</h4>
        <p>{outputsWithTokens[0].value.amount.decimal}</p>
      </div>
      <RequestDetails transactionData={transactionData} />
      <NetworkFee fee={fee} />
    </div>
  )
}

const SummaryView = ({ data }) => {
  const { flags, transactionData } = SignTxHelpers.getTransactionDetails(data)
  const { addresses } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const requiredAddresses =
    networkType === 'mainnet'
      ? addresses.mlMainnetAddresses.mlChangeAddresses
      : addresses.mlTestnetAddresses.mlChangeAddresses

  return (
    <div className="preview-section summary">
      <div className="preview-section-header">
        <h3>Transaction Preview</h3>
      </div>
      <div>
        {flags.isTransfer && (
          <TransferDetails
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isUnfreezeToken && (
          <FreezeTokenDetails
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
            unfreeze
          />
        )}
        {flags.isFreezeToken && (
          <FreezeTokenDetails
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isChangeTokenMetadata && (
          <ChangeTokenMetadata
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isChangeTokenAuthority && (
          <ChangeTokenAuthority
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isLockTokenSupply && (
          <LockTokenSupply
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isBurnToken && (
          <BurnToken
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {/* TODO: BURN COIN */}
        {flags.isConcludeOrder && (
          <ConcludeOrder
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isFillOrder && (
          <FillOrder
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isCreateOrder && (
          <CreateOrder
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isIssueToken && (
          <IssueToken
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isIssueNft && (
          <IssueNft
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isBridgeRequest && (
          <BridgeRequest
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isDataDeposit && (
          <DataDeposit
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isCreateDelegationId && (
          <CreateDelegationId
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isDelegateStaking && (
          <DelegateStaking
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
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
