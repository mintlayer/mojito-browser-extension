import React, { useContext } from 'react'
import { SignTransaction as SignTxHelpers, TransactionAmounts } from '@Helpers'
import './ExternalTransactionPreview.css'

import { AccountContext, MintlayerContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import TransactionBreakdown from '../TransactionBreakdown/TransactionBreakdown'
import TransactionPreviewErrorBoundary from '../TransactionPreviewErrorBoundary/TransactionPreviewErrorBoundary'
import UnrecognizedOperation from '../UnrecognizedOperation/UnrecognizedOperation'

const {
  COIN_DECIMALS,
  buildTokenDecimalsIndex,
  deriveApprovalFee,
  describeOutputLock,
  findRelevantOutputs,
  isAccountCommandShape,
  isDelegationWithdrawInput,
  resolveAssetDecimals,
  resolveCurrencyDecimals,
  signerAmountContainer,
  signerOutputDestination,
  verifyAmountPair,
} = TransactionAmounts

// Chain token metadata → Map token_id → decimals, for scaling signed token
// atoms into displayable amounts.
const useTokenDecimalsIndex = () => {
  const { allNetworkTokensData } = useContext(MintlayerContext)
  return buildTokenDecimalsIndex(allNetworkTokensData)
}

// Renders the atoms-derived amount, or — fail closed — the verification
// error in place of any number that could not be reconciled with the signed
// `.atoms` values.
// Fail closed on malformed payloads: legs may be truthy non-arrays (the
// background forwards dApp params unvalidated) — normalize once so every
// sub-component's .find/.filter/.some reads can never crash. The payload
// itself is blocked by reconcileApprovalAmounts.
const normalizedLegs = (JSONRepresentation) => ({
  ...JSONRepresentation,
  inputs: Array.isArray(JSONRepresentation?.inputs)
    ? JSONRepresentation.inputs
    : [],
  outputs: Array.isArray(JSONRepresentation?.outputs)
    ? JSONRepresentation.outputs
    : [],
})

// Account-command inputs the signer encodes — the shared signer-exact
// predicate (isAccountCommandShape, both input_type spellings) on the
// wrapper's inner input. UTXO inputs with injected command/token_id/
// account_type fields are plain utxo legs and must not drive panels.
const isAccountCommandInput = (input) => isAccountCommandShape(input?.input)

const VerifiedAmount = ({ container, decimals, fallback = 'Unknown' }) => {
  const verified = verifyAmountPair(container, decimals)
  if (!verified) return <p>{fallback}</p>
  return (
    <p className={verified.error ? 'signTxAmountMismatch' : undefined}>
      {verified.error ?? verified.amount}
      {verified.error && verified.amount != null && (
        <> — will sign {verified.amount}</>
      )}
    </p>
  )
}

// Prefer an output paid to an address outside this wallet — the same
// relevance rules as the approval summary (findRelevantOutputs), so the
// technical preview and the summary can never disagree about what is being
// approved. When every output lands on the wallet (a self-transfer), the
// payment is what goes to a receiving address.
const isOwnReceiving = (address, ownAddresses) =>
  Boolean(address) && (ownAddresses?.receiving || []).includes(address)

const EstimatedChanges = ({ action }) => {
  return (
    <div className="signTxSection">
      <h4>Estimated changes</h4>
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
      <h4>Request from</h4>
      <p>{transactionData.origin}</p>
      <h4>Request id</h4>
      <p>{transactionData.requestId}</p>
    </div>
  )
}

const NetworkFee = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  // SECURITY: the shared fee rule (TransactionAmounts.deriveApprovalFee) —
  // computed from the signed coin atoms (inputs − outputs); the dApp-supplied
  // `fee` field is display-only and used only as a verified fallback. Order
  // fill/conclusion legs are unmodelable from the payload alone → 'Unknown'.
  const verified = deriveApprovalFee(JSONRepresentation)

  return (
    <div className="signTxSection">
      <h4>Network fee</h4>
      <p className={verified?.error ? 'signTxAmountMismatch' : undefined}>
        {verified == null || verified.unknown
          ? 'Unknown'
          : (verified.error ?? verified.amount)}
        {verified?.error && verified.amount != null && (
          <> — will sign {verified.amount}</>
        )}
      </p>
    </div>
  )
}

const TransferDetails = ({ transactionData, ownAddresses }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const tokenDecimalsById = useTokenDecimalsIndex()

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) =>
      input.input?.input_type === 'UTXO' &&
      input.utxo?.value?.type === 'TokenV1',
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

  // the destination shown is the one the signer encodes for the output
  // (signerOutputDestination), exactly like the summary's "To" line
  const relevantOutput = findRelevantOutputs(
    JSONRepresentation.outputs,
    ownAddresses,
  ).outputs.find((output) => signerOutputDestination(output))

  // If no relevant output found, try to find any output with the token ID
  const fallbackOutput =
    !relevantOutput && inputWithToken
      ? JSONRepresentation.outputs.find(
          (output) => output.value?.token_id === tokenId,
        )
      : null

  const outputToUse = relevantOutput || fallbackOutput
  const destination = outputToUse ? signerOutputDestination(outputToUse) : null
  // A locked output (LockThenTransfer) hands its funds over encumbered: the
  // lock is spelled out here with the same words the approval summary uses,
  // so a locked output coming back to this wallet never reads as a plain
  // transfer to it.
  const lock =
    outputToUse?.type === 'LockThenTransfer'
      ? describeOutputLock(outputToUse.lock)
      : null

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
          {destination || 'Unknown'}
          {isOwnReceiving(destination, ownAddresses) && ' (your address)'}
        </p>
        {inputWithToken && (
          <>
            <h4>Token id</h4>
            <p>{tokenId}</p>
          </>
        )}
        <h4>Amount</h4>
        <VerifiedAmount
          container={outputToUse.value}
          // token identity comes ONLY from the signer-read container
          // (output.value.token_id) — never from a top-level injection
          decimals={resolveAssetDecimals(
            outputToUse.value?.token_id,
            tokenDecimalsById,
          )}
          fallback="Unknown"
        />
        {lock && (
          <>
            <h4>Lock</h4>
            <p className={lock.error ? 'signTxAmountMismatch' : undefined}>
              {lock.text ?? lock.error}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const FreezeTokenDetails = ({ transactionData, unfreeze }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => isAccountCommandInput(input) && input.input?.token_id,
  )

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
    </div>
  )
}

const ChangeTokenMetadata = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => isAccountCommandInput(input) && input.input?.token_id,
  )

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
    </div>
  )
}

const ChangeTokenAuthority = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => isAccountCommandInput(input) && input.input?.token_id,
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
    </div>
  )
}

const LockTokenSupply = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  const inputWithToken = JSONRepresentation.inputs.find(
    (input) => isAccountCommandInput(input) && input.input?.token_id,
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
    </div>
  )
}

const BurnToken = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  const burnOutput = JSONRepresentation.outputs.find(
    (output) => output.type === 'BurnToken',
  )
  // coin-vs-token keys off token-id presence (the signer encodes
  // value.token_id || null), never off the value.type label
  const tokenId = burnOutput?.value?.token_id ?? null

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
    </div>
  )
}

const ConcludeOrder = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const inputWithOrderID = JSONRepresentation.inputs.find(
    (input) => isAccountCommandInput(input) && input.input?.order_id,
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
    </div>
  )
}

const FillOrder = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const inputWithOrderID = JSONRepresentation.inputs.find(
    (input) => isAccountCommandInput(input) && input.input?.order_id,
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
    </div>
  )
}

const CreateOrder = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const tokenDecimalsById = useTokenDecimalsIndex()

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

  // SECURITY: order balances are shown from their signed `.atoms`, scaled by
  // the currency's decimals (shared rule in TransactionAmounts).
  const askDecimals = resolveCurrencyDecimals(
    outputWithCreateOrder.ask_currency,
    tokenDecimalsById,
  )
  const giveDecimals = resolveCurrencyDecimals(
    outputWithCreateOrder.give_currency,
    tokenDecimalsById,
  )

  // Order balances are verified against the signed atoms above; what is
  // intentionally NOT shown here is the order's live chain state (current
  // fills/balance) — only the payload's signed amounts are rendered.
  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Create order" />
      <div className="signTxSection">
        <h4>Ask balance</h4>
        <VerifiedAmount
          container={outputWithCreateOrder.ask_balance}
          decimals={askDecimals}
          fallback="Unknown"
        />
        <h4>Ask currency</h4>
        <p>{outputWithCreateOrder.ask_currency?.type ?? 'Unknown'}</p>
        <h4>Destination</h4>
        <p>{outputWithCreateOrder.conclude_destination}</p>
        <h4>Give balance</h4>
        <VerifiedAmount
          container={outputWithCreateOrder.give_balance}
          decimals={giveDecimals}
          fallback="Unknown"
        />
        <h4>Give currency</h4>
        <p>
          Token id: {outputWithCreateOrder.give_currency?.token_id ?? 'Unknown'}
        </p>
        <p>type: {outputWithCreateOrder.give_currency?.type ?? 'Unknown'}</p>
      </div>
    </div>
  )
}

const IssueToken = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

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

  // SECURITY: total supply is signed from `total_supply.amount.atoms` scaled
  // by this output's own (signed) `number_of_decimals` — never from the
  // dApp-supplied decimal label. Out-of-range scales (negative, NaN, huge)
  // fail closed inside the verifier instead of throwing or hanging the tab.
  const supplyDecimals = parseInt(outputWithCreateOrder.number_of_decimals, 10)

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Issue token" />
      <div className="signTxSection">
        <h4>Authority</h4>
        <p>{outputWithCreateOrder.authority}</p>
        <h4>Freezable</h4>
        <p>{outputWithCreateOrder.is_freezable ? 'True' : 'False'}</p>
        <h4>Metadata</h4>
        <p>Hex: {outputWithCreateOrder.metadata_uri?.hex ?? 'Unknown'}</p>
        <p>String: {outputWithCreateOrder.metadata_uri?.string ?? 'Unknown'}</p>
        <h4>Number of decimals</h4>
        <p>{outputWithCreateOrder.number_of_decimals}</p>
        <h4>Token ticker</h4>
        <p>Hex: {outputWithCreateOrder.token_ticker?.hex ?? 'Unknown'}</p>
        <p>String: {outputWithCreateOrder.token_ticker?.string ?? 'Unknown'}</p>
        <h4>Supply type</h4>
        <p>{outputWithCreateOrder.total_supply?.type ?? 'Unknown'}</p>
        {/* SECURITY: the signer encodes a supply amount ONLY for type 'Fixed'
            (Lockable/Unlimited encode none) — render the row only then, or a
            payload could display a cap the signed tx does not have. */}
        {outputWithCreateOrder.total_supply?.type === 'Fixed' &&
          outputWithCreateOrder.total_supply?.amount && (
            <>
              <h4>Total supply</h4>
              <VerifiedAmount
                container={outputWithCreateOrder.total_supply}
                decimals={supplyDecimals}
              />
            </>
          )}
      </div>
    </div>
  )
}

const IssueNft = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

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
    </div>
  )
}

const DataDeposit = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

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
    </div>
  )
}

const CreateDelegationId = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  const outputWithDataDeposit = JSONRepresentation.outputs.find(
    (output) => output.type === 'CreateDelegationId',
  )

  if (!outputWithDataDeposit) {
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
        <p>{outputWithDataDeposit.pool_id}</p>
      </div>
    </div>
  )
}

const DelegateStaking = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  const outputWithDataDeposit = JSONRepresentation.outputs.find(
    (output) => output.type === 'DelegateStaking',
  )

  if (!outputWithDataDeposit) {
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
        <p>{outputWithDataDeposit.delegation_id}</p>
        <h4>Amount</h4>
        <VerifiedAmount
          container={outputWithDataDeposit.amount}
          decimals={COIN_DECIMALS}
        />
      </div>
    </div>
  )
}

const DelegateWithdraw = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  // signer-exact withdrawal input (shared predicate): account input type and
  // no coexisting known command — a hybrid input signs the command, not a
  // withdrawal credit
  const inputWithWithdraw = JSONRepresentation.inputs.find((input) =>
    isDelegationWithdrawInput(input.input),
  )?.input

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
        <VerifiedAmount
          container={inputWithWithdraw.amount}
          decimals={COIN_DECIMALS}
        />
      </div>
    </div>
  )
}

const CreateHtlc = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const tokenDecimalsById = useTokenDecimalsIndex()

  const outputWithHtlc = JSONRepresentation.outputs.find(
    (output) => output.type === 'Htlc',
  )

  if (!outputWithHtlc) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Create HTLC" />
        <div className="signTxSection">
          <p>Unable to determine HTLC details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Create HTLC" />
      <div className="signTxSection">
        <h4>Amount</h4>
        <VerifiedAmount
          container={outputWithHtlc.value}
          decimals={resolveAssetDecimals(
            outputWithHtlc.value?.token_id,
            tokenDecimalsById,
          )}
        />
        <h4>Secret Hash</h4>
        <p>{outputWithHtlc.htlc?.secret_hash?.hex}</p>
        <h4>Spend Key</h4>
        <p>{outputWithHtlc.htlc?.spend_key}</p>
        <h4>Refund Key</h4>
        <p>{outputWithHtlc.htlc?.refund_key}</p>
        <h4>Refund Timelock</h4>
        <p>
          {outputWithHtlc.htlc?.refund_timelock?.type}:{' '}
          {outputWithHtlc.htlc?.refund_timelock?.content}
        </p>
      </div>
    </div>
  )
}

const SpendHtlc = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const tokenDecimalsById = useTokenDecimalsIndex()

  const inputWithHtlc = JSONRepresentation.inputs.find(
    (input) =>
      input.input?.input_type === 'UTXO' && input.utxo?.type === 'Htlc',
  )

  if (!inputWithHtlc) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Spend HTLC" />
        <div className="signTxSection">
          <p>Unable to determine HTLC details</p>
        </div>
      </div>
    )
  }

  // signer-exact: the legKind-aware resolver returns utxo.value only for
  // input_type 'UTXO' legs of signed types — an injected utxo object on an
  // account-command input commits nothing and must not render an Amount
  const container = signerAmountContainer(inputWithHtlc, 'input')

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Spend HTLC" />
      <div className="signTxSection">
        <h4>Amount</h4>
        <VerifiedAmount
          container={container}
          decimals={resolveAssetDecimals(
            container?.token_id,
            tokenDecimalsById,
          )}
        />
        <h4>Secret Hash</h4>
        <p>{inputWithHtlc.utxo.htlc?.secret_hash?.hex}</p>
        <h4>Spend Key</h4>
        <p>{inputWithHtlc.utxo.htlc?.spend_key}</p>
        <h4>Refund Key</h4>
        <p>{inputWithHtlc.utxo.htlc?.refund_key}</p>
        <h4>Refund Timelock</h4>
        <p>
          {inputWithHtlc.utxo.htlc?.refund_timelock?.type}:{' '}
          {inputWithHtlc.utxo.htlc?.refund_timelock?.content}
        </p>
      </div>
    </div>
  )
}

const BridgeRequest = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const tokenDecimalsById = useTokenDecimalsIndex()

  const inputsWithTokens = JSONRepresentation.inputs.filter(
    (input) =>
      input.input?.input_type === 'UTXO' && input.utxo?.value?.token_id,
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
        <VerifiedAmount
          container={outputsWithTokens[0]?.value}
          decimals={resolveAssetDecimals(
            outputsWithTokens[0]?.value?.token_id,
            tokenDecimalsById,
          )}
          fallback="Unknown"
        />
      </div>
    </div>
  )
}

const BurnCoin = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const tokenDecimalsById = useTokenDecimalsIndex()

  // coin burns encode as BurnToken with a Coin value (no token_id) — the
  // signer has no 'BurnCoin' output branch, so the type === 'BurnCoin'
  // search could never match a real payload
  const outputWithBurnCoin = JSONRepresentation.outputs.find(
    (output) =>
      output.type === 'BurnToken' &&
      output.value?.type === 'Coin' &&
      !output.value?.token_id,
  )

  if (!outputWithBurnCoin) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Burn coin" />
        <div className="signTxSection">
          <p>Unable to determine burn details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Burn coin" />
      <div className="signTxSection">
        <h4>Amount</h4>
        <VerifiedAmount
          container={outputWithBurnCoin.value}
          decimals={resolveAssetDecimals(
            outputWithBurnCoin.value?.token_id,
            tokenDecimalsById,
          )}
        />
      </div>
    </div>
  )
}

const TokenMint = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const tokenDecimalsById = useTokenDecimalsIndex()

  const inputWithMint = JSONRepresentation.inputs.find(
    (input) =>
      isAccountCommandInput(input) && input.input?.command === 'MintTokens',
  )

  if (!inputWithMint) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Mint tokens" />
        <div className="signTxSection">
          <p>Unable to determine mint details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Mint tokens" />
      <div className="signTxSection">
        <h4>Token id</h4>
        <p>{inputWithMint.input.token_id}</p>
        <h4>Amount</h4>
        <VerifiedAmount
          container={inputWithMint.input.amount}
          decimals={resolveAssetDecimals(
            inputWithMint.input.token_id,
            tokenDecimalsById,
          )}
        />
      </div>
    </div>
  )
}

const TokenUnmint = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )

  const inputWithUnmint = JSONRepresentation.inputs.find(
    (input) =>
      isAccountCommandInput(input) && input.input?.command === 'UnmintTokens',
  )

  if (!inputWithUnmint) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Unmint tokens" />
        <div className="signTxSection">
          <p>Unable to determine unmint details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Unmint tokens" />
      <div className="signTxSection">
        <h4>Token id</h4>
        <p>{inputWithUnmint.input.token_id}</p>
        {/* SECURITY: UnmintTokens encodes only the token_id + nonce — the
            payload's amount is not signed, so it is never rendered as a
            "will sign" number. */}
      </div>
    </div>
  )
}

const TokenMintWithLock = ({ transactionData }) => {
  const JSONRepresentation = normalizedLegs(
    transactionData.data.txData.JSONRepresentation,
  )
  const tokenDecimalsById = useTokenDecimalsIndex()

  const outputWithLock = JSONRepresentation.outputs.find(
    (output) => output.type === 'LockThenTransfer',
  )

  if (!outputWithLock) {
    return (
      <div className="transactionDetails">
        <EstimatedChanges action="Mint tokens with lock" />
        <div className="signTxSection">
          <p>Unable to determine mint details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="transactionDetails">
      <EstimatedChanges action="Mint tokens with lock" />
      <div className="signTxSection">
        <h4>Destination</h4>
        <p>{outputWithLock.destination}</p>
        <h4>Amount</h4>
        <VerifiedAmount
          container={outputWithLock.value}
          decimals={resolveAssetDecimals(
            outputWithLock.value?.token_id,
            tokenDecimalsById,
          )}
        />
        {outputWithLock.value?.token_id && (
          <>
            <h4>Token id</h4>
            <p>{outputWithLock.value.token_id}</p>
          </>
        )}
        <h4>Lock type</h4>
        <p>{outputWithLock.lock?.type}</p>
        {outputWithLock.lock?.content && (
          <>
            <h4>Lock details</h4>
            <p>{JSON.stringify(outputWithLock.lock.content)}</p>
          </>
        )}
      </div>
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

        {flags.isUnknown && <UnrecognizedOperation />}

        <TransactionBreakdown
          JSONRepresentation={transactionData?.data?.txData?.JSONRepresentation}
          ownAddresses={ownAddresses}
          tokenMap={tokenMap}
          coinTicker={coinTicker}
        />

        <NetworkFee transactionData={transactionData} />
        <RequestDetails transactionData={transactionData} />
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
