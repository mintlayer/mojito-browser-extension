import React, { useEffect, useContext } from 'react'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import './InternalTransactionPreview.css'

import { AccountContext, MintlayerContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import TransactionBreakdown from '../TransactionBreakdown/TransactionBreakdown'
import TransactionPreviewErrorBoundary from '../TransactionPreviewErrorBoundary/TransactionPreviewErrorBoundary'
import UnrecognizedOperation from '../UnrecognizedOperation/UnrecognizedOperation'

// Prefer an output paid to an address outside this wallet. When every
// output lands on the wallet (a self-transfer), fall back to an output
// addressed to one of its receiving addresses — change-address outputs
// are only the unspent remainder coming back.
const findRelevantOutput = (inputs, outputs, ownAddresses) => {
  const receiving = ownAddresses?.receiving || []
  const ownList = [...receiving, ...(ownAddresses?.change || [])]

  const inputWithToken = inputs.find(
    (input) => input.utxo?.value?.type === 'TokenV1',
  )
  const tokenId = inputWithToken?.utxo?.value?.token_id
  const matchesAsset = (output) =>
    !tokenId || output.value?.token_id === tokenId

  return (
    outputs.find(
      (output) =>
        output.destination &&
        matchesAsset(output) &&
        !ownList.includes(output.destination),
    ) ||
    outputs.find(
      (output) =>
        output.destination &&
        matchesAsset(output) &&
        receiving.includes(output.destination),
    )
  )
}

const isOwnReceiving = (address, ownAddresses) =>
  Boolean(address) && (ownAddresses?.receiving || []).includes(address)

const EstimatedChanges = ({ action }) => {
  return (
    <div className="signTxSection">
      <h4>Estimated changes</h4>
      <p>
        <span className="signTxAction">{action}</span>
      </p>
    </div>
  )
}

const NetworkFee = ({ fee }) => {
  return (
    <div className="signTxSection">
      <h4>Network fee</h4>
      <p>{fee || 'Unknown'}</p>
    </div>
  )
}

const TransferDetails = ({ transactionData, ownAddresses }) => {
  const { setTxPreviewInfo } = useContext(MintlayerContext)
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.utxo?.value?.type === 'TokenV1',
  )
  const tokenId = inputWithToken ? inputWithToken?.utxo.value.token_id : null
  const title = inputWithToken ? 'Transfer token' : 'Transfer coins'

  const relevantOutput = findRelevantOutput(
    JSONRepresentation.inputs,
    JSONRepresentation.outputs,
    ownAddresses,
  )

  // If no relevant output found, try to find any output with the token ID
  const fallbackOutput =
    !relevantOutput && inputWithToken
      ? JSONRepresentation.outputs.find(
          (output) => output.value?.token_id === tokenId,
        )
      : null

  const outputToUse = relevantOutput || fallbackOutput

  useEffect(() => {
    if (outputToUse) {
      setTxPreviewInfo({
        action: title,
        destination: outputToUse.destination,
        tokenId: tokenId,
        amount: outputToUse.value?.amount?.decimal,
        fee: fee,
      })
    }
  }, [outputToUse, setTxPreviewInfo, title, tokenId, fee])

  if (!outputToUse) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action={title} />
        <div className="signTxSection">
          <p>Unable to determine transfer details</p>
          {inputWithToken && (
            <>
              <h4>Token id</h4>
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
        <h4>Destination</h4>
        <p>
          {outputToUse.destination || 'Unknown'}
          {isOwnReceiving(outputToUse.destination, ownAddresses) &&
            ' (your address)'}
        </p>
        {inputWithToken && (
          <>
            <h4>Token id</h4>
            <p>{tokenId}</p>
          </>
        )}
        <h4>Amount</h4>
        <p>{outputToUse.value?.amount?.decimal || 'Unknown'}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const FreezeTokenDetails = ({ transactionData, unfreeze }) => {
  const { setTxPreviewInfo } = useContext(MintlayerContext)
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.input?.token_id,
  )
  const tokenId = inputWithToken?.input?.token_id

  useEffect(() => {
    if (!tokenId) return
    setTxPreviewInfo({
      action: unfreeze ? 'Unfreeze token' : 'Freeze token',
      destination: '',
      tokenId: tokenId,
      amount: '',
      fee: fee,
    })
  }, [tokenId, unfreeze, fee, setTxPreviewInfo])

  if (!inputWithToken) {
    return (
      <div className="transactionDetails">
        <div className="signTxSection">
          <h4>Estimated changes</h4>
          <p>
            You’re approving a one-time request to{' '}
            {unfreeze ? 'unfreeze' : 'freeze'} token
          </p>
        </div>
        <div className="signTxSection">
          <p>Unable to determine token details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <div className="signTxSection">
        <h4>Estimated changes</h4>
        <p>
          You’re approving a one-time request to{' '}
          {unfreeze ? 'unfreeze' : 'freeze'} token
        </p>
      </div>
      <div className="signTxSection">
        <h4>Token id</h4>
        <p>{inputWithToken.input.token_id}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const ChangeTokenMetadata = ({ transactionData }) => {
  const { setTxPreviewInfo } = useContext(MintlayerContext)
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.input?.token_id,
  )
  const tokenId = inputWithToken?.input?.token_id

  useEffect(() => {
    if (!tokenId) return
    setTxPreviewInfo({
      action: 'Change token metadata',
      destination: '',
      tokenId: tokenId,
      amount: '',
      fee: fee,
    })
  }, [tokenId, fee, setTxPreviewInfo])

  if (!inputWithToken) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Change token metadata" />
        <div className="signTxSection">
          <p>Unable to determine token details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Change token metadata" />
      <div className="signTxSection">
        <h4>Token id</h4>
        <p>{inputWithToken.input.token_id}</p>
      </div>
      <div className="signTxSection">
        <h4>New metadata</h4>
        <p>{inputWithToken.input.new_metadata_uri}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const ChangeTokenAuthority = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.input?.token_id,
  )

  if (!inputWithToken) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Change token authority" />
        <div className="signTxSection">
          <p>Unable to determine token details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Change token authority" />
      <div className="signTxSection">
        <h4>Token id</h4>
        <p>{inputWithToken.input.token_id}</p>
      </div>
      <div className="signTxSection">
        <h4>New authority</h4>
        <p>{inputWithToken.input.new_authority}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const LockTokenSupply = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => input.input?.token_id,
  )

  if (!inputWithToken) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Lock token supply" />
        <div className="signTxSection">
          <p>Unable to determine token details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Lock token supply" />
      <div className="signTxSection">
        <h4>Token id</h4>
        <p>{inputWithToken.input.token_id}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const BurnToken = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

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
          <h4>Token id</h4>
          <p>{tokenId}</p>
        </div>
      ) : (
        <div className="signTxSection">
          <h4>Mintlayer Coin</h4>
        </div>
      )}
      <NetworkFee fee={fee} />
    </div>
  )
}

const ConcludeOrder = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal
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
        <h4>Order ID</h4>
        <p>{inputWithOrderID.input.order_id}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const FillOrder = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal
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
        <h4>Order id</h4>
        <p>{inputWithOrderID.input.order_id}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const CreateOrder = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const outputWithCreateOrder = JSONRepresentation.outputs.find(
    (output) => output.type === 'CreateOrder',
  )

  if (!outputWithCreateOrder) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Create order" />
        <div className="signTxSection">
          <p>Unable to determine order details</p>
        </div>
      </div>
    )
  }

  // TODO: double check the data structure with final transaction
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Create order" />
      <div className="signTxSection">
        <h4>Ask balance</h4>
        <p>{outputWithCreateOrder.ask_balance?.decimal}</p>
        <h4>Ask currency</h4>
        <p>{outputWithCreateOrder.ask_currency?.type}</p>
        <h4>Destination</h4>
        <p>{outputWithCreateOrder.conclude_destination}</p>
        <h4>Give balance</h4>
        <p>{outputWithCreateOrder.give_balance?.decimal}</p>
        <h4>Give currency</h4>
        <p>Token id: {outputWithCreateOrder.give_currency?.token_id}</p>
        <p>type: {outputWithCreateOrder.give_currency?.type}</p>
        <h4>Initially asked</h4>
        <p>{outputWithCreateOrder.initially_asked?.decimal}</p>
        <h4>Initially given</h4>
        <p>{outputWithCreateOrder.initially_given?.decimal}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const IssueToken = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const outputWithCreateOrder = JSONRepresentation.outputs.find(
    (output) => output.type === 'IssueFungibleToken',
  )

  if (!outputWithCreateOrder) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Issue token" />
        <div className="signTxSection">
          <p>Unable to determine token details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Issue token" />
      <div className="signTxSection">
        <h4>Authority</h4>
        <p>{outputWithCreateOrder.authority}</p>
        <h4>Freezable</h4>
        <p>{outputWithCreateOrder.is_freezable ? 'True' : 'False'}</p>
        <h4>Metadata</h4>
        <p>Hex: {outputWithCreateOrder.metadata_uri?.hex}</p>
        <p>String: {outputWithCreateOrder.metadata_uri?.string}</p>
        <h4>Number of decimals</h4>
        <p>{outputWithCreateOrder.number_of_decimals}</p>
        <h4>Token ticker</h4>
        <p>Hex: {outputWithCreateOrder.token_ticker?.hex}</p>
        <p>String: {outputWithCreateOrder.token_ticker?.string}</p>
        <h4>Supply type</h4>
        <p>{outputWithCreateOrder.total_supply?.type}</p>
        {outputWithCreateOrder.total_supply?.amount?.decimal && (
          <>
            <h4>Total supply</h4>
            <p>{outputWithCreateOrder.total_supply.amount.decimal}</p>
          </>
        )}
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const IssueNft = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const outputWithIssueNft = JSONRepresentation.outputs.find(
    (output) => output.type === 'IssueNft',
  )

  if (!outputWithIssueNft) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Issue NFT" />
        <div className="signTxSection">
          <p>Unable to determine NFT details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Issue NFT" />
      <div className="signTxSection">
        <h4>Destination</h4>
        <p>{outputWithIssueNft.destination}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const DataDeposit = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const outputWithDataDeposit = JSONRepresentation.outputs.find(
    (output) => output.type === 'DataDeposit',
  )

  if (!outputWithDataDeposit) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Data Deposit" />
        <div className="signTxSection">
          <p>Unable to determine deposit details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Data Deposit" />
      <div className="signTxSection">
        <h4>Data</h4>
        <p>{outputWithDataDeposit.data}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const CreateDelegationId = ({ transactionData }) => {
  const { setTxPreviewInfo } = useContext(MintlayerContext)
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const outputWithCreateDelegation = JSONRepresentation.outputs.find(
    (output) => output.type === 'CreateDelegationId',
  )

  useEffect(() => {
    if (!outputWithCreateDelegation) return
    setTxPreviewInfo({
      action: 'Create Delegation',
      destination: outputWithCreateDelegation.pool_id,
      fee: fee,
    })
  }, [outputWithCreateDelegation, setTxPreviewInfo, fee])

  if (!outputWithCreateDelegation) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Create Delegation" />
        <div className="signTxSection">
          <p>Unable to determine delegation details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Create Delegation" />
      <div className="signTxSection">
        <h4>Pool Id</h4>
        <p>{outputWithCreateDelegation.pool_id}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const DelegateStaking = ({ transactionData }) => {
  const { setTxPreviewInfo } = useContext(MintlayerContext)
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const outputWithStaking = JSONRepresentation.outputs.find(
    (output) => output.type === 'DelegateStaking',
  )

  useEffect(() => {
    if (!outputWithStaking) return
    setTxPreviewInfo({
      action: 'Delegate Staking',
      destination: outputWithStaking.delegation_id,
      amount: outputWithStaking.amount?.decimal,
      fee: fee,
    })
  }, [outputWithStaking, setTxPreviewInfo, fee])

  if (!outputWithStaking) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Stake to delegation" />
        <div className="signTxSection">
          <p>Unable to determine delegation details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Stake to delegation" />
      <div className="signTxSection">
        <h4>Delegation Id</h4>
        <p>{outputWithStaking.delegation_id}</p>
        <h4>Amount</h4>
        <p>{outputWithStaking.amount?.decimal}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const DelegateWithdraw = ({ transactionData }) => {
  const { setTxPreviewInfo } = useContext(MintlayerContext)
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

  const inputWithWithdraw = JSONRepresentation.inputs.find(
    (input) => input.input?.account_type === 'DelegationBalance',
  )?.input

  useEffect(() => {
    if (!inputWithWithdraw) return
    setTxPreviewInfo({
      action: 'Withdraw from delegation',
      destination: inputWithWithdraw.delegation_id,
      amount: inputWithWithdraw.amount?.decimal,
      fee: fee,
    })
  }, [inputWithWithdraw, setTxPreviewInfo, fee])

  if (!inputWithWithdraw) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Withdraw from delegation" />
        <div className="signTxSection">
          <p>Unable to determine delegation details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Withdraw from delegation" />
      <div className="signTxSection">
        <h4>Delegation Id</h4>
        <p>{inputWithWithdraw.delegation_id}</p>
        <h4>Amount</h4>
        <p>{inputWithWithdraw.amount?.decimal}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const BridgeRequest = ({ transactionData }) => {
  const JSONRepresentation = transactionData.data.txData.JSONRepresentation
  const fee = JSONRepresentation.fee?.decimal

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
        <h4>Token id</h4>
        <p>{inputsWithTokens[0]?.utxo?.value?.token_id || 'Unknown'}</p>
        <h4>Amount</h4>
        <p>{outputsWithTokens[0]?.value?.amount?.decimal || 'Unknown'}</p>
      </div>
      <NetworkFee fee={fee} />
    </div>
  )
}

const SummaryView = ({ data }) => {
  const { flags, transactionData } = SignTxHelpers.getTransactionDetails(data)
  const { addresses } = useContext(AccountContext)
  const { tokenMap } = useContext(MintlayerContext)
  const { networkType } = useContext(SettingsContext)

  const requiredAddresses = [
    ...addresses.mlAddresses.mlReceivingAddresses,
    ...addresses.mlAddresses.mlChangeAddresses,
  ]
  const ownAddresses = {
    receiving: addresses.mlAddresses.mlReceivingAddresses,
    change: addresses.mlAddresses.mlChangeAddresses,
  }
  const coinTicker =
    networkType === AppInfo.NETWORK_TYPES.TESTNET ? 'TML' : 'ML'

  return (
    <div className="preview-section summary">
      <div className="preview-section-header">
        <h3>Transaction Preview</h3>
      </div>
      <div>
        {flags.isTransfer && (
          <TransferDetails
            transactionData={transactionData}
            ownAddresses={ownAddresses}
          />
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
        {flags.isIssueNft && <IssueNft transactionData={transactionData} />}
        {flags.isBridgeRequest && (
          <BridgeRequest transactionData={transactionData} />
        )}
        {flags.isDataDeposit && (
          <DataDeposit transactionData={transactionData} />
        )}
        {flags.isCreateDelegationId && (
          <CreateDelegationId transactionData={transactionData} />
        )}
        {flags.isDelegateStaking && (
          <DelegateStaking transactionData={transactionData} />
        )}
        {flags.isDelegateWithdraw && (
          <DelegateWithdraw
            transactionData={transactionData}
            requiredAddresses={requiredAddresses}
          />
        )}

        {flags.isUnknown && <UnrecognizedOperation />}

        <TransactionBreakdown
          JSONRepresentation={transactionData?.data?.txData?.JSONRepresentation}
          ownAddresses={ownAddresses}
          tokenMap={tokenMap}
          coinTicker={coinTicker}
        />
      </div>
    </div>
  )
}

const InternalTransactionPreview = ({ data }) => {
  return (
    <TransactionPreviewErrorBoundary>
      <div className="transactionPreview">
        <SummaryView data={data} />
      </div>
    </TransactionPreviewErrorBoundary>
  )
}

export default InternalTransactionPreview
