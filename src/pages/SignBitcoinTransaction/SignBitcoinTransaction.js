/* eslint-disable no-undef */
import { useLocation } from 'react-router-dom'
import { MOCKS } from './mocks'
import { Button } from '@BasicComponents'
import { PopUp, TextField } from '@ComposedComponents'
import { SignTransaction } from '@ContainerComponents'

import './SignBitcoinTransaction.css'
import { useState, useContext } from 'react'
import { Network } from '../../services/Crypto/Mintlayer/@mintlayerlib-js'

import { AppInfo } from '@Constants'
import { Account } from '@Entities'
import { AccountContext, SettingsContext } from '@Contexts'
import { BTCTransaction } from '@Cryptos'

const storage =
  typeof browser !== 'undefined' && browser.storage
    ? browser.storage
    : typeof chrome !== 'undefined' && chrome.storage
      ? chrome.storage
      : null

const runtime =
  typeof browser !== 'undefined' && browser.runtime
    ? browser.runtime
    : typeof chrome !== 'undefined' && chrome.runtime
      ? chrome.runtime
      : null

export const SignBitcoinTransactionPage = () => {
  const { state: external_state } = useLocation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [secret, setSecret] = useState('')

  const [mode, setMode] = useState('preview')

  const [selectedMock, setSelectedMock] = useState('transfer')
  const extraButtonStyles = ['buttonSignTransaction']

  const state = external_state || MOCKS[selectedMock]

  const revealed_secret =
    state?.request?.data?.txData?.JSONRepresentation.secret

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentBtcAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress

  const network = networkType === 'testnet' ? Network.Testnet : Network.Mainnet

  const handleApprove = async () => {
    setIsModalOpen(true) // Open the modal
  }

  const submitCreate = async () => {
    const pass = password

    const transactionJSONrepresentation =
      state?.request?.data?.txData?.JSONRepresentation
    console.log('transactionJSONrepresentation', transactionJSONrepresentation)

    const { WIF } = await Account.unlockAccount(accountID, pass)

    const htlc = await BTCTransaction.buildHTLCAndFundingAddress({
      receiverPubKey: transactionJSONrepresentation.recipientPublicKey,
      senderPubKey: transactionJSONrepresentation.refundPublicKey,
      senderAddress: transactionJSONrepresentation.refund,
      amount: transactionJSONrepresentation.amount, // atoms!!
      // lock: transactionJSONrepresentation.lock,
      lock: transactionJSONrepresentation.timeoutBlocks,
      secretHashHex: JSON.parse(transactionJSONrepresentation.secretHash)
        .secret_hash_hex,
      wif: WIF,
      networkType,
      fundingKeyPair: {
        publicKey: Buffer.from(
          transactionJSONrepresentation.refundPublicKey,
          'hex',
        ),
      }, // TODO: take another key from the wallet
    })

    console.log('htlc', htlc)

    // address to send funds to
    const address = htlc.p2wshAddress

    const [, txHex, txId] = await BTCTransaction.buildTransaction({
      to: address,
      amount: parseInt(transactionJSONrepresentation.amount), // atoms
      fee: 500, // TODO: update calculation of fee
      wif: WIF,
      from: currentBtcAddress,
      networkType,
    })

    console.log('tx', txHex)

    console.log('WIF', WIF)
    console.log('network', network)

    // const walletPrivKeys = ML.getWalletPrivKeysList(
    //   privKey,
    //   networkType,
    //   changeAddressesLength,
    // )

    // const keysList = {
    //   ...walletPrivKeys.mlReceivingPrivKeys,
    //   ...walletPrivKeys.mlChangePrivKeys,
    // }

    const requestId = state?.request?.requestId
    const method = 'signTransaction_approve'
    const result = {
      htlcAddress: htlc.p2wshAddress,
      transactionId: txId,
      signedTxHex: txHex,
      redeemScript: htlc.redeemScriptHex,
    }
    console.log('transactionHex', txHex)
    // eslint-disable-next-line no-undef
    runtime.sendMessage(
      {
        action: 'popupResponse',
        method,
        requestId,
        origin,
        result,
      },
      () => {
        // eslint-disable-next-line no-undef
        storage.local.remove('pendingRequest', () => {
          window.close()
        })
      },
    )
  }

  const submitSpend = async () => {
    const pass = password

    const transactionJSONrepresentation =
      state?.request?.data?.txData?.JSONRepresentation
    console.log('transactionJSONrepresentation', transactionJSONrepresentation)

    const { WIF } = await Account.unlockAccount(accountID, pass)

    const tx = await BTCTransaction.buildHtlcClaimTx({
      network,
      utxo: transactionJSONrepresentation.utxo,
      toAddress: transactionJSONrepresentation.to,
      redeemScriptHex: transactionJSONrepresentation.redeemScriptHex,
      secretHex: revealed_secret || secret,
      wif: WIF,
    })

    const requestId = state?.request?.requestId
    const method = 'signTransaction_approve'
    const result = {
      signedTxHex: tx,
    }
    // eslint-disable-next-line no-undef
    runtime.sendMessage(
      {
        action: 'popupResponse',
        method,
        requestId,
        origin,
        result,
      },
      () => {
        // eslint-disable-next-line no-undef
        storage.local.remove('pendingRequest', () => {
          window.close()
        })
      },
    )
  }

  const handleModalSubmit = async () => {
    try {
      const transactionJSONrepresentation =
        state?.request?.data?.txData?.JSONRepresentation
      console.log(
        'transactionJSONrepresentation',
        transactionJSONrepresentation,
      )

      if (transactionJSONrepresentation.secretHash) {
        await submitCreate()
        return
      }

      if (!transactionJSONrepresentation.secretHash) {
        await submitSpend()
        return
      }
    } catch (error) {
      console.error('Error during transaction signing:', error)
      setIsModalOpen(false)
    }
  }

  const handleReject = () => {
    const requestId = state?.request?.requestId
    const method = 'signTransaction_reject'
    const result = 'null'
    // eslint-disable-next-line no-undef
    runtime.sendMessage(
      {
        action: 'popupResponse',
        method,
        requestId,
        origin,
        result,
      },
      () => {
        // eslint-disable-next-line no-undef
        storage.local.remove('pendingRequest', () => {
          window.close()
        })
      },
    )
  }

  const selectMock = (name) => {
    setSelectedMock(name)
  }

  const switchHandle = () => {
    setMode(mode === 'json' ? 'preview' : 'json')
  }

  const passwordChangeHandler = (value) => {
    setPassword(value)
  }

  const secretChangeHandler = (value) => {
    setSecret(value)
  }

  return (
    <div className="SignTransaction">
      <div className="header">
        <h1 className="signTxTitle">Sign Transaction</h1>
        <Button onClickHandle={switchHandle}>
          {`Switch to ${mode === 'json' ? 'preview' : 'json'}`}
        </Button>
      </div>

      <div className="SignTxContent">
        {!external_state && (
          <div className="mock_selector">
            {Object.keys(MOCKS).map((key) => {
              return (
                <div
                  key={key}
                  onClick={() => selectMock(key)}
                  title={key}
                  className={selectedMock === key ? 'active' : ''}
                >
                  {key}
                </div>
              )
            })}
          </div>
        )}

        {state?.request?.data?.txData?.JSONRepresentation && (
          <>
            {mode === 'preview' && (
              <div className="transaction-preview-wrapper">
                <SignTransaction.JsonPreview data={state} />
                {/*<SignTransaction.TransactionPreview data={state} />*/}
              </div>
            )}
            {mode === 'json' && <SignTransaction.JsonPreview data={state} />}
          </>
        )}
      </div>

      <div className="footer">
        <Button
          onClickHandle={handleReject}
          extraStyleClasses={extraButtonStyles}
          alternate
        >
          Decline
        </Button>
        <Button
          onClickHandle={handleApprove}
          extraStyleClasses={extraButtonStyles}
        >
          Approve and return to page.
        </Button>
      </div>

      {isModalOpen && (
        <PopUp setOpen={setIsModalOpen}>
          <div className="modal-content">
            <TextField
              label="Re-enter your Password"
              password
              value={password}
              onChangeHandle={passwordChangeHandler}
              placeholder="Enter your password"
              autoFocus
            />
            {['spendHtlc'].includes(
              state?.request?.data?.txData?.JSONRepresentation.type,
            ) &&
              !revealed_secret && (
                <>
                  HTLC Secret:
                  <TextField
                    value={secret}
                    onChangeHandle={secretChangeHandler}
                    placeholder="Enter htlc secret in hex format"
                    autoFocus
                  />
                </>
              )}
            <div className="modal-buttons">
              <Button
                onClickHandle={() => setIsModalOpen(false)}
                extraStyleClasses={extraButtonStyles}
                alternate
              >
                Decline
              </Button>
              <Button
                onClickHandle={handleModalSubmit}
                extraStyleClasses={extraButtonStyles}
              >
                Approve
              </Button>
            </div>
          </div>
        </PopUp>
      )}
    </div>
  )
}

export default SignBitcoinTransactionPage
