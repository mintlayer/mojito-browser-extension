import React, { useContext } from 'react'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import './ExternalTransactionPreview.css'

import { AccountContext, SettingsContext } from '@Contexts'

// Error Boundary Component for TransactionPreview
class TransactionPreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('TransactionPreview error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="transactionPreview">
          <div className="preview-section summary">
            <div className="preview-section-header">
              <h3>Transaction Preview</h3>
            </div>
            <div className="transactionDetails">
              <div className="signTxSection">
                <h4>Unable to display transaction details</h4>
                <p>
                  An error occurred while parsing the transaction data. Please
                  try again or contact support.
                </p>
              </div>
              {this.props.basicInfo && (
                <>
                  <div className="signTxSection">
                    <h4>Request from:</h4>
                    <p>{this.props.basicInfo.origin || 'Unknown'}</p>
                  </div>
                  <div className="signTxSection">
                    <h4>Request id:</h4>
                    <p>{this.props.basicInfo.requestId || 'Unknown'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const findRelevantOutput = (inputs, outputs, requiredAddresses) => {
  const inputWithToken = inputs.find(
    (input) => input.utxo?.value?.type === 'TokenV1',
  )
  if (inputWithToken) {
    const tokenId = inputWithToken.utxo.value.token_id
    return outputs.find(
      (output) =>
        output.value?.token_id === tokenId &&
        output.destination &&
        !requiredAddresses.includes(output.destination),
    )
  }
  return outputs.find(
    (output) =>
      output.destination && !requiredAddresses.includes(output.destination),
  )
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

const RequestDetails = ({
  transactionData,
  className = '',
  showId = true,
  oneLine = false,
}) => {
  return (
    <div className={`signTxSection ${className}`}>
      {oneLine ? (
        <>
          <div className="inline-row">
            <h4>Request from:</h4>
            <p className="inline-value">{transactionData.origin}</p>
          </div>
          {showId && (
            <div className="inline-row">
              <h4>Request id:</h4>
              <p className="inline-value">{transactionData.requestId}</p>
            </div>
          )}
        </>
      ) : (
        <>
      <h4>Request from:</h4>
      <p>{transactionData.origin}</p>
          {showId && (
            <>
      <h4>Request id:</h4>
      <p>{transactionData.requestId}</p>
            </>
          )}
        </>
      )}
    </div>
  )
}

const NetworkFee = ({ transactionData }) => {
  let fee
  if (transactionData.data.txData.JSONRepresentation.fee) {
    fee = transactionData.data.txData.JSONRepresentation.fee.decimal
  } else {
    fee = 1
  }
  return (
    <div className="signTxSection">
      <h4>Network fee:</h4>
      <p>{fee}</p>
    </div>
  )
}

const TransferDetails = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.utxo?.value?.type === 'TokenV1',
  )
  const tokenId = inputWithToken ? inputWithToken?.utxo.value.token_id : null

  // Check if this is an NFT transfer by looking at the input type
  const isNftTransfer =
    inputWithToken && inputWithToken.utxo?.type === 'IssueNft'
  const title = isNftTransfer
    ? 'Transfer NFT'
    : inputWithToken
      ? 'Transfer token'
      : 'Transfer coins'

  const relevantOutput = findRelevantOutput(
    JSONRepresentation.inputs,
    JSONRepresentation.outputs,
    requiredAddresses,
  )

  // If no relevant output found, try to find any output with the token ID
  const fallbackOutput =
    !relevantOutput && inputWithToken
      ? JSONRepresentation.outputs.find(
          (output) => output.value?.token_id === tokenId,
        )
      : null

  const outputToUse = relevantOutput || fallbackOutput

  if (!outputToUse) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action={title} />
        <div className="signTxSection">
          <p>Unable to determine transfer details</p>
          {inputWithToken && (
            <>
              <h4>Token id:</h4>
              <p>{tokenId}</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action={title} />
      <div className="signTxSection">
        <h4>Destination:</h4>
        <p>{outputToUse.destination || 'Unknown'}</p>
        {inputWithToken && (
          <>
            <h4>Token id:</h4>
            <p>{tokenId}</p>
          </>
        )}
        <h4>Amount:</h4>
        <p>{outputToUse.value?.amount?.decimal || 'Unknown'}</p>
      </div>
    </div>
  )
}

const FreezeTokenDetails = ({ transactionData, unfreeze }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

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
    </div>
  )
}

const ChangeTokenMetadata = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

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
    </div>
  )
}

const ChangeTokenAuthority = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

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
    </div>
  )
}

const LockTokenSupply = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

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
    </div>
  )
}

const BurnToken = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

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
    </div>
  )
}

const ConcludeOrder = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const inputWithOrderID = JSONRepresentation.inputs.find(
    (input) => input.input?.order_id,
  )

  if (!inputWithOrderID) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Conclude order" />
        <div className="signTxSection">
          <p>Unable to determine order details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Conclude order" />
      <div className="signTxSection">
        <h4>Order ID:</h4>
        <p>{inputWithOrderID.input.order_id}</p>
      </div>
    </div>
  )
}

const FillOrder = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const inputWithOrderID = JSONRepresentation.inputs.find(
    (input) => input.input?.order_id,
  )

  if (!inputWithOrderID) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Fill order" />
        <div className="signTxSection">
          <p>Unable to determine order details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Fill order" />
      <div className="signTxSection">
        <h4>Order id:</h4>
        <p>{inputWithOrderID.input.order_id}</p>
      </div>
    </div>
  )
}

const CreateOrder = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const outputWithCreateOrder = JSONRepresentation.outputs.find(
    (output) => output.type === 'CreateOrder',
  )
  const fee = JSONRepresentation.fee?.decimal

  const askCurrency = outputWithCreateOrder?.ask_currency?.type
  const giveBalance = outputWithCreateOrder?.give_balance?.decimal
  const giveCurrencyType = outputWithCreateOrder?.give_currency?.type
  const giveTokenId = outputWithCreateOrder?.give_currency?.token_id
  const initiallyAsked = outputWithCreateOrder?.initially_asked?.decimal
  const initiallyGiven = outputWithCreateOrder?.initially_given?.decimal
  const destination = outputWithCreateOrder?.conclude_destination

  const giveCurrencyLabel =
    giveCurrencyType === 'TokenV1'
      ? `Token (${giveTokenId})`
      : giveCurrencyType === 'Coin'
        ? 'ML'
        : giveCurrencyType || 'Unknown'

  return (
    <div className="transactionDetails">
      <div className="signTxSection issuetoken-assets">
        <h4>Asset changes:</h4>
        {fee !== undefined && (
          <div className="issuetoken-asset-row">
            <span className="issuetoken-asset-name">ML</span>
            <span className="issuetoken-asset-delta negative">-{fee}</span>
          </div>
        )}
        <div className="issuetoken-asset-row">
          <span className="issuetoken-asset-name">Locked in order</span>
          <span className="issuetoken-asset-delta neutral">{giveBalance} {giveCurrencyLabel}</span>
        </div>
        <p className="order-hint">These tokens will be temporarily locked until the order is executed or canceled.</p>
        <div className="order-subrows">
          <div className="network-row"><h4>Ask currency:</h4><span className="network-value">{askCurrency === 'Coin' ? 'ML' : askCurrency}</span></div>
          <div className="network-row"><h4>Give currency:</h4><span className="network-value">{giveCurrencyLabel}</span></div>
          <div className="network-row"><h4>Destination:</h4><span className="network-value" style={{ wordBreak: 'break-all' }}>{destination}</span></div>
          <div className="network-row"><h4>Initially asked:</h4><span className="network-value">{initiallyAsked}</span></div>
          <div className="network-row"><h4>Initially given:</h4><span className="network-value">{initiallyGiven}</span></div>
        </div>
      </div>
      <div className="signTxSection issuetoken-network">
        <div className="network-row"><h4>Network:</h4><span className="network-value"><img src="/logo32.png" alt="" className="ml-logo-img" /> Mintlayer</span></div>
        {fee !== undefined && (
          <div className="network-row"><h4>Network fee:</h4><span className="network-value">{fee} ML</span></div>
        )}
      </div>
    </div>
  )
}

const IssueToken = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const outputWithCreateOrder = JSONRepresentation.outputs.find(
    (output) => output.type === 'IssueFungibleToken',
  )
  const fee = JSONRepresentation.fee ? JSONRepresentation.fee.decimal : 1
  const tickerString = outputWithCreateOrder?.token_ticker?.string
  const supplyType = outputWithCreateOrder?.total_supply?.type
  const fixedSupplyAmount = outputWithCreateOrder?.total_supply?.amount?.decimal
  return (
    <div className="transactionDetails">
      <div className="signTxSection issuetoken-assets">
        <h4>Asset changes:</h4>
        <div className="issuetoken-asset-row">
          <span className="issuetoken-asset-name">ML</span>
          <span className="issuetoken-asset-delta negative">-{fee}</span>
        </div>
        <div className="issuetoken-asset-row">
          <span className="issuetoken-asset-name">
            {tickerString || 'Token'}
          </span>
          <span className="issuetoken-asset-delta positive">Created</span>
        </div>
        {supplyType === 'Fixed' && fixedSupplyAmount && (
          <div className="issuetoken-asset-row">
            <span className="issuetoken-asset-name">Fixed supply</span>
            <span className="issuetoken-asset-delta neutral">
              {fixedSupplyAmount}
            </span>
          </div>
        )}
      </div>
      <div className="signTxSection issuetoken-network">
        <div className="network-row">
          <h4>Network:</h4>
          <span className="network-value"><img src="/logo32.png" alt="" className="ml-logo-img" /> Mintlayer</span>
        </div>
        <div className="network-row">
          <h4>Network fee:</h4>
          <span className="network-value">{fee} ML</span>
        </div>
      </div>
    </div>
  )
}

const IssueTokenAdvancedDetails = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const outputWithCreateOrder = JSONRepresentation.outputs.find(
    (output) => output.type === 'IssueFungibleToken',
  )
  return (
    <div className="issuetoken-advanced-grid">
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
  )
}

const IssueNft = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

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
    </div>
  )
}

const DataDeposit = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

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
    </div>
  )
}

const CreateDelegationId = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

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
    </div>
  )
}

const DelegateStaking = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

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
    </div>
  )
}

const DelegateWithdraw = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const inputWithWithdraw = JSONRepresentation.inputs.find(
    (input) => input.input.account_type === 'DelegationBalance',
  ).input
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Withdraw from delegation" />
      <div className="signTxSection">
        <h4>Delegation Id:</h4>
        <p>{inputWithWithdraw.delegation_id}</p>
        <h4>Amount:</h4>
        <p>{inputWithWithdraw.amount.decimal}</p>
      </div>
    </div>
  )
}

const CreateHtlc = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const outputWithHtlc = JSONRepresentation.outputs.find(
    (output) => output.type === 'Htlc',
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Create HTLC" />
      <div className="signTxSection">
        <h4>Amount:</h4>
        <p>{outputWithHtlc.value.amount.decimal}</p>
        <h4>Secret Hash:</h4>
        <p>{outputWithHtlc.htlc.secret_hash.hex}</p>
        <h4>Spend Key:</h4>
        <p>{outputWithHtlc.htlc.spend_key}</p>
        <h4>Refund Key:</h4>
        <p>{outputWithHtlc.htlc.refund_key}</p>
        <h4>Refund Timelock:</h4>
        <p>
          {outputWithHtlc.htlc.refund_timelock.type}:{' '}
          {outputWithHtlc.htlc.refund_timelock.content}
        </p>
      </div>
    </div>
  )
}

const SpendHtlc = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const inputWithHtlc = JSONRepresentation.inputs.find(
    (input) => input.utxo?.type === 'Htlc',
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Spend HTLC" />
      <div className="signTxSection">
        <h4>Amount:</h4>
        <p>{inputWithHtlc.utxo.value.amount.decimal}</p>
        <h4>Secret Hash:</h4>
        <p>{inputWithHtlc.utxo.htlc.secret_hash.hex}</p>
        <h4>Spend Key:</h4>
        <p>{inputWithHtlc.utxo.htlc.spend_key}</p>
        <h4>Refund Key:</h4>
        <p>{inputWithHtlc.utxo.htlc.refund_key}</p>
        <h4>Refund Timelock:</h4>
        <p>
          {inputWithHtlc.utxo.htlc.refund_timelock.type}:{' '}
          {inputWithHtlc.utxo.htlc.refund_timelock.content}
        </p>
      </div>
    </div>
  )
}

const BridgeRequest = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const inputsWithTokens = JSONRepresentation.inputs.filter(
    (input) => input.utxo?.value?.token_id,
  )
  const outputsWithTokens = JSONRepresentation.outputs.filter(
    (output) => output.value?.token_id,
  )

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="make a Bridge request" />
      <div className="signTxSection">
        <h4>Token id:</h4>
        <p>{inputsWithTokens[0]?.utxo?.value?.token_id || 'Unknown'}</p>
        <h4>Amount:</h4>
        <p>{outputsWithTokens[0]?.value?.amount?.decimal || 'Unknown'}</p>
      </div>
    </div>
  )
}

const BurnCoin = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const outputWithBurnCoin = JSONRepresentation.outputs.find(
    (output) => output.type === 'BurnCoin',
  )
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Burn coin" />
      <div className="signTxSection">
        <h4>Amount:</h4>
        <p>{outputWithBurnCoin.value.amount.decimal}</p>
      </div>
    </div>
  )
}

const TokenMint = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const inputWithMint = JSONRepresentation.inputs.find(
    (input) => input.input.command === 'MintTokens',
  )
  const fee = JSONRepresentation.fee ? JSONRepresentation.fee.decimal : 1
  return (
    <div className="transactionDetails">
      <div className="signTxSection issuetoken-assets">
        <h4>Asset changes:</h4>
        <div className="issuetoken-asset-row">
          <span className="issuetoken-asset-name">ML</span>
          <span className="issuetoken-asset-delta negative">-{fee}</span>
        </div>
        <div className="issuetoken-asset-row">
          <span className="issuetoken-asset-name">
            {inputWithMint.input.token_id}
          </span>
          <span className="issuetoken-asset-delta positive">
            +{inputWithMint.input.amount.decimal}
          </span>
        </div>
      </div>
      <div className="signTxSection issuetoken-network">
        <div className="network-row">
          <h4>Network:</h4>
          <span className="network-value">
            <img
              src="/logo32.png"
              alt=""
              className="ml-logo-img"
            />{' '}
            Mintlayer
          </span>
        </div>
        <div className="network-row">
          <h4>Network fee:</h4>
          <span className="network-value">{fee} ML</span>
        </div>
      </div>
    </div>
  )
}

const TokenMintAdvancedDetails = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const inputWithMint = JSONRepresentation.inputs.find(
    (input) => input.input.command === 'MintTokens',
  )
  return (
    <>
        <h4>Token id:</h4>
        <p>{inputWithMint.input.token_id}</p>
        <h4>Amount:</h4>
        <p>{inputWithMint.input.amount.decimal}</p>
    </>
  )
}

const TokenUnmint = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const inputWithUnmint = JSONRepresentation.inputs.find(
    (input) => input.input.command === 'UnmintTokens',
  )
  const fee = JSONRepresentation.fee ? JSONRepresentation.fee.decimal : 1
  return (
    <div className="transactionDetails">
      <div className="signTxSection issuetoken-assets">
        <h4>Asset changes:</h4>
        <div className="issuetoken-asset-row">
          <span className="issuetoken-asset-name">ML</span>
          <span className="issuetoken-asset-delta negative">-{fee}</span>
        </div>
        <div className="issuetoken-asset-row">
          <span className="issuetoken-asset-name">{inputWithUnmint.input.token_id}</span>
          <span className="issuetoken-asset-delta negative">-{inputWithUnmint.input.amount.decimal}</span>
        </div>
      </div>
      <div className="signTxSection issuetoken-network">
        <div className="network-row">
          <h4>Network:</h4>
          <span className="network-value"><img src="/logo32.png" alt="" className="ml-logo-img" /> Mintlayer</span>
        </div>
        <div className="network-row">
          <h4>Network fee:</h4>
          <span className="network-value">{fee} ML</span>
        </div>
      </div>
    </div>
  )
}

const TokenUnmintAdvancedDetails = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const inputWithUnmint = JSONRepresentation.inputs.find(
    (input) => input.input.command === 'UnmintTokens',
  )
  return (
    <>
        <h4>Token id:</h4>
        <p>{inputWithUnmint.input.token_id}</p>
        <h4>Amount:</h4>
        <p>{inputWithUnmint.input.amount.decimal}</p>
    </>
  )
}

const TokenMintWithLock = ({ transactionData, requiredAddresses }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation

  const outputWithLock = JSONRepresentation.outputs.find(
    (output) => output.type === 'LockThenTransfer',
  )
  const fee = JSONRepresentation.fee?.decimal
  const tokenId = outputWithLock?.value?.token_id || 'Token'
  const lockOutputs = JSONRepresentation.outputs.filter(
    (o) => o.type === 'LockThenTransfer',
  )
  const totalLocked = lockOutputs.reduce((acc, o) => {
    const v = Number(o?.value?.amount?.decimal || 0)
    return acc + (isNaN(v) ? 0 : v)
  }, 0)
  return (
    <div className="transactionDetails">
      <div className="signTxSection issuetoken-assets">
        <h4>Asset changes:</h4>
        {fee !== undefined && (
          <div className="issuetoken-asset-row">
            <span className="issuetoken-asset-name">ML</span>
            <span className="issuetoken-asset-delta negative">-{fee}</span>
          </div>
        )}
        <div className="issuetoken-asset-row">
          <span className="issuetoken-asset-name">{tokenId}</span>
          <span className="issuetoken-asset-delta neutral">Issued (locked): {totalLocked}</span>
        </div>
      </div>
      {/* Network section intentionally omitted here to avoid duplication; already shown above for mint-with-lock flows */}
      <div className="signTxSection issuetoken-impact">
        <h4>Your balance impact now:</h4>
        <p>No immediate change (tokens locked)</p>
      </div>
      <div className="signTxSection locked-list">
        <h4>Recipients (locked):</h4>
        {lockOutputs.map((o, idx) => {
          const isMine = Array.isArray(requiredAddresses)
            ? requiredAddresses.includes(o.destination)
            : false
          return (
            <div className="locked-item" key={`locked-${idx}`}>
              <div className="inline-row"><h4>Destination:</h4><p className="inline-value">{o.destination}{isMine ? ' (your address, locked)' : ''}</p></div>
              <div className="inline-row"><h4>Amount:</h4><p className="inline-value">{o.value?.amount?.decimal}</p></div>
              <div className="inline-row"><h4>Lock:</h4><p className="inline-value">{o.lock?.type} {o.lock?.content !== undefined ? o.lock.content : ''}</p></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const TokenMintWithLockAdvancedDetails = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const outputWithLock = JSONRepresentation.outputs.find(
    (output) => output.type === 'LockThenTransfer',
  )
  return (
    <>
        <h4>Destination:</h4>
        <p>{outputWithLock.destination}</p>
        <h4>Amount:</h4>
        <p>{outputWithLock.value.amount.decimal}</p>
        {outputWithLock.value.token_id && (
          <>
            <h4>Token id:</h4>
            <p>{outputWithLock.value.token_id}</p>
          </>
        )}
        <h4>Lock type:</h4>
        <p>{outputWithLock.lock.type}</p>
        {outputWithLock.lock.content && (
          <>
            <h4>Lock details:</h4>
            <p>{JSON.stringify(outputWithLock.lock.content)}</p>
          </>
        )}
    </>
  )
}

const SummaryView = ({ data }) => {
  const { flags, transactionData } = SignTxHelpers.getTransactionDetails(data)
  const { addresses } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)

  const requiredAddresses =
    networkType === 'mainnet'
      ? addresses.mlMainnetAddresses.mlChangeAddresses
      : addresses.mlTestnetAddresses.mlChangeAddresses

  return (
    <div
      className={`preview-section summary ${
        flags.isIssueToken || flags.isTokenMint || flags.isTokenUnmint || flags.isTokenMintWithLock || flags.isCreateOrder ? 'issuetoken' : ''
      }`}
    >
      <div className="preview-section-header">
        {flags.isIssueToken || flags.isTokenMint || flags.isTokenUnmint || flags.isTokenMintWithLock || flags.isCreateOrder ? (
          <p className="preview-hint">
            Balance changes are estimates. Amounts and affected assets are not
            guaranteed.
          </p>
        ) : (
        <h3>Transaction Preview</h3>
        )}
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
        {flags.isBurnCoin && (
          <BurnCoin
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isTokenMint && (
          <TokenMint
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isTokenUnmint && (
          <TokenUnmint
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isTokenMintWithLock && (
          <TokenMintWithLock
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
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
        {flags.isDelegateWithdraw && (
          <DelegateWithdraw
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isCreateHtlc && (
          <CreateHtlc
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isSpendHtlc && (
          <SpendHtlc
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}
        {flags.isIssueToken || flags.isTokenMint || flags.isTokenUnmint || flags.isTokenMintWithLock || flags.isCreateOrder ? (
          <>
            <RequestDetails
              transactionData={transactionData}
              className="request-details"
              showId={false}
              oneLine
            />
            <div className="signTxSection issuetoken-advanced-cta">
              <p className="issuetoken-trust">
                Confirm only if you trust this site.
              </p>
              <button
                type="button"
                className="issuetoken-adv-toggle"
                onClick={() => setIsAdvancedOpen((o) => !o)}
              >
                {isAdvancedOpen ? 'Hide details' : 'Additional details'}
              </button>
            </div>
            <div
              className="signTxSection issuetoken-advanced"
              style={{ display: isAdvancedOpen ? 'flex' : 'none' }}
            >
              {flags.isIssueToken && (
                <IssueTokenAdvancedDetails transactionData={transactionData} />
              )}
              {flags.isTokenMint && (
                <TokenMintAdvancedDetails transactionData={transactionData} />
              )}
              {flags.isTokenUnmint && (
                <TokenUnmintAdvancedDetails transactionData={transactionData} />
              )}
              {flags.isTokenMintWithLock && (
                <TokenMintWithLockAdvancedDetails transactionData={transactionData} />
              )}
              {flags.isCreateOrder && (
                <>
                  <h4>Request id:</h4>
                  <p>{transactionData.requestId}</p>
                </>
              )}
              {!flags.isCreateOrder && (
                <>
                  <h4>Request id:</h4>
                  <p>{transactionData.requestId}</p>
                </>
              )}
            </div>
          </>
        ) : (
          <>
        <NetworkFee transactionData={transactionData} />
        <RequestDetails transactionData={transactionData} />
          </>
        )}
      </div>
    </div>
  )
}

const ExternalTransactionPreview = ({ data }) => {
  const basicInfo = {
    origin: data?.request?.origin,
    requestId: data?.request?.requestId,
  }

  return (
    <TransactionPreviewErrorBoundary basicInfo={basicInfo}>
      <div className="transactionPreview">
        <SummaryView data={data} />
      </div>
    </TransactionPreviewErrorBoundary>
  )
}

export default ExternalTransactionPreview
