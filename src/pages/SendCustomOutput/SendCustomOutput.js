import React, { useContext, useState, useEffect } from 'react'
import { Select, Textarea, Button, Error, Loader } from '@BasicComponents'
import { TextField } from '@ComposedComponents'
import {
  validateOutput,
  getInfoAboutOutput,
  getTemplate,
  stringToHex,
} from './SendCustomOutput.helpers'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { useMlWalletInfo } from '@Hooks'
import { Account } from '@Entities'
import { ML } from '@Cryptos'
import { MLTransaction } from '@Helpers'
import { Mintlayer } from '@APIs'
import { LocalStorageService } from '@Storage'
import {
  getTransactionUtxos,
  totalUtxosAmount,
} from '../../utils/Helpers/ML/MLTransaction'

import styles from './SendCustomOutput.module.css'
import { VerticalGroup } from '@LayoutComponents'
import { useLocation } from 'react-router-dom'

const SendCustomOutput = () => {
  const { state } = useLocation()
  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses

  const coinType = networkType === AppInfo.NETWORK_TYPES.MAINNET ? 'ML' : 'TML'

  const {
    balance: mlBalance,
    utxos,
    unusedAddresses,
    feerate,
    currentHeight,
  } = useMlWalletInfo(currentMlAddresses)

  const templateOptions = [
    { value: 'Transfer', label: 'Transfer' },
    { value: 'IssueFungibleToken', label: 'IssueFungibleToken' },
    { value: 'IssueNft', label: 'IssueNft' },
    { value: 'DataDeposit', label: 'DataDeposit' },
  ]

  const [customOutputs, setCustomOutputs] = useState([])
  const [fee, setFee] = useState('')
  const [error, setError] = useState('')
  const [inputs, setInputs] = useState([])
  const [outputs, setOutputs] = useState([])
  const [transactionHex, setTransactionHex] = useState('')
  const [passValidity, setPassValidity] = useState(true)
  const [passPristinity, setPassPristinity] = useState(true)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const changePassHandle = (value) => {
    setPass(value)
  }

  useEffect(() => {
    if (state && state.output) {
      // check if array
      if (Array.isArray(state.output)) {
        setCustomOutputs(state.output)
      } else {
        setCustomOutputs([state.output])
      }
    }
  }, [state])

  const enableAugmentButton = customOutputs.length > 0

  const getFields = (output) => {
    const allFields = getInfoAboutOutput(output).allFields
    console.log('allFields', allFields)
    const fields = Object.keys(allFields).map((key) => {
      return {
        id: key,
        label: key,
        value: allFields[key],
      }
    })
    return fields
  }

  const handleOutputChange = (index) => (e) => {
    const text = e.target.value
    const outputs = customOutputs
    try {
      outputs[index] = JSON.parse(text)
      setCustomOutputs([...outputs])
    } catch (e) {
      // TODO: handle error
    }
  }

  const handleValidate = async () => {
    if (!customOutputs) {
      setError('Please select a custom output template')
      return
    }
    if (!validateOutput(customOutputs)) {
      setError('Invalid output')
      return
    }

    // parse output
    const customOutput = customOutputs[0]
    const parsedOutput = getInfoAboutOutput(customOutput)
    let amountToSend = 0

    if (!parsedOutput) {
      setError('Invalid output')
      return
    }

    if (parsedOutput.amountToSend) {
      amountToSend = parsedOutput.amountToSend * 1e11
    }

    if (parsedOutput.requiredFields) {
      console.log('required fields', parsedOutput.requiredFields)
    }

    const adjustedOutput = customOutput

    const unusedChangeAddress = unusedAddresses.change

    const utxoCoin = utxos.filter((utxo) => utxo.utxo.value.type === 'Coin')
    const inputs = getTransactionUtxos({
      utxos: utxoCoin,
      amount: +(parsedOutput.extraFee || 0) + amountToSend + fee,
    })

    setInputs(inputs)
    const utxoBalance = totalUtxosAmount(inputs)

    const transactionFee = fee
    const extraFee = parsedOutput.extraFee || 0

    const amountToReturn =
      BigInt(utxoBalance) -
      BigInt(amountToSend) -
      BigInt(transactionFee) -
      BigInt(extraFee)

    // add change
    const output = {
      type: 'Transfer',
      destination: unusedChangeAddress,
      value: {
        type: 'Coin',
        amount: {
          atoms: amountToReturn.toString(),
          decimal: amountToReturn.toString() / 1e11,
        },
      },
    }

    setOutputs([adjustedOutput, output])

    // calculate fee
    const transactionSize =
      await MLTransaction.calculateCustomTransactionSizeInBytes({
        network: networkType,
        inputs,
        outputs,
        currentHeight,
      })

    const new_fee = Math.ceil(feerate * (transactionSize / 1000))
    setFee(new_fee)
    setError('')
  }

  const handleBuildTransaction = async (ev) => {
    ev.preventDefault()
    setLoading(true)
    if (!pass) {
      setPassPristinity(false)
      setPassValidity(false)
      setLoading(false)
      setPassErrorMessage('Password must be set.')
      return
    }

    try {
      const unlockedAccount = await Account.unlockAccount(accountID, pass)

      if (unlockedAccount) {
        setPassPristinity(true)
        setPassValidity(true)
        setLoading(false)
        setPassErrorMessage('')

        const mlPrivKeys = unlockedAccount.mlPrivKeys

        const privKey =
          networkType === 'mainnet'
            ? mlPrivKeys.mlMainnetPrivateKey
            : mlPrivKeys.mlTestnetPrivateKey

        const changeAddressesLength =
          currentMlAddresses.mlChangeAddresses.length

        const walletPrivKeys = ML.getWalletPrivKeysList(
          privKey,
          networkType,
          changeAddressesLength,
        )
        const keysList = {
          ...walletPrivKeys.mlReceivingPrivKeys,
          ...walletPrivKeys.mlChangePrivKeys,
        }

        const transactionHex = await MLTransaction.sendCustomTransaction({
          keysList: keysList,
          network: networkType,
          inputs: inputs,
          outputs: outputs,
          currentHeight,
        })

        setTransactionHex(transactionHex)
      }
    } catch (e) {
      setPassPristinity(false)
      setPassValidity(false)
      setLoading(false)
      setPassErrorMessage('Password is incorrect')
      return
    }

    setLoading(false)
    return false
  }

  const handleBroadcast = async () => {
    const result = await Mintlayer.broadcastTransaction(transactionHex)

    const account = LocalStorageService.getItem('unlockedAccount')
    const accountName = account.name
    const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
    const unconfirmedTransactions =
      LocalStorageService.getItem(unconfirmedTransactionString) || []

    unconfirmedTransactions.push({
      direction: 'out',
      type: 'Unconfirmed',
      destAddress: 'destAddress',
      value: 'value',
      confirmations: 0,
      date: '',
      txid: JSON.parse(result).tx_id,
      fee: fee.toString(),
      isConfirmed: false,
      mode: 'mode',
      usedUtxosOutpoints: inputs.map(({ outpoint: { index, source_id } }) => ({
        index,
        source_id,
      })),
    })
    LocalStorageService.setItem(
      unconfirmedTransactionString,
      unconfirmedTransactions,
    )

    return true
  }

  const handleInsertTemplate = () => {
    const template = getTemplate(selectedTemplate)
    setCustomOutputs([...customOutputs, template])
    setSelectedTemplate('')
  }

  const handleTogglePreview = () => {
    // TODO toggle preview
  }
  //
  // useEffect(() => {
  //   if (customOutputs) {
  //     const customOutput = JSON.parse(customOutputs)[0]
  //     const allFields = getInfoAboutOutput(customOutput).allFields
  //
  //     const fields = Object.keys(allFields).map((key) => {
  //       return {
  //         id: key,
  //         label: key,
  //         value: allFields[key],
  //       }
  //     })
  //
  //     setFields(fields)
  //   }
  // }, [customOutputs])

  const handleUpdateField = (index, id) => (event) => {
    const datas = customOutputs

    const data = datas[index]

    if (id === 'value.amount.decimal') {
      data['value']['amount']['decimal'] = event.target.value
      data['value']['amount']['atoms'] = (event.target.value * 1e11).toString()
    } else if (id === 'total_supply.amount.decimal') {
      data['total_supply']['amount']['decimal'] = event.target.value
      data['total_supply']['amount']['atoms'] = (
        event.target.value * 1e11
      ).toString()
    } else if (id === 'token_ticker.string') {
      data['token_ticker']['string'] = event.target.value
      data['token_ticker']['hex'] = stringToHex(event.target.value)
    } else if (id === 'metadata_uri.string') {
      data['metadata_uri']['string'] = event.target.value
      data['metadata_uri']['hex'] = stringToHex(event.target.value)
    } else if (id === 'data.description.string') {
      data['data']['description']['string'] = event.target.value
      data['data']['description']['hex'] = stringToHex(event.target.value)
    } else if (id === 'data.media_hash.string') {
      data['data']['media_hash']['string'] = event.target.value
      data['data']['media_hash']['hex'] = stringToHex(event.target.value)
    } else if (id === 'data.name.string') {
      data['data']['name']['string'] = event.target.value
      data['data']['name']['hex'] = stringToHex(event.target.value)
    } else if (id === 'data.ticker.string') {
      data['data']['ticker']['string'] = event.target.value
      data['data']['ticker']['hex'] = stringToHex(event.target.value)
    } else if (id.includes('.')) {
      const [key, subKey] = id.split('.')
      data[key][subKey] = event.target.value
    } else {
      data[id] = event.target.value
    }

    setCustomOutputs([...datas])
  }

  const handleOutputRemove = (index) => () => {
    const newOutputs = customOutputs.filter((_, i) => i !== index)
    setCustomOutputs(newOutputs)
  }

  return (
    <div className={styles.customOutputWrapper}>
      <VerticalGroup midGap>
        <div className={styles.balance}>Balance: {mlBalance} TML</div>
        <div className={styles.templateSelectorWrapper}>
          Select output:
          <div className={styles.templateSelector}>
            <Select
              options={templateOptions}
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              placeholder="Select"
            />
            <Button
              onClickHandle={handleInsertTemplate}
              disabled={loading}
            >
              Add
            </Button>
          </div>
        </div>
        <div className={styles.workAreaList}>
          {customOutputs.map((output, index) => {
            return (
              <div className={styles.workArea}>
                <form className={styles.form}>
                  <div>
                    {getFields(output).map((field) => {
                      return (
                        <div
                          className={styles.fieldGroup}
                          key={field.id}
                        >
                          <label>{field.label}</label>
                          <input
                            className={styles.customInput}
                            type="text"
                            onChange={handleUpdateField(index, field.id)}
                            value={field.value}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div>
                    <button onClick={handleOutputRemove(index)}>remove</button>
                  </div>
                </form>
                <div className={styles.text}>
                  <Textarea
                    disabled
                    value={JSON.stringify(output, null, 2)}
                    onChange={handleOutputChange(index)}
                    size={{ cols: 50, rows: 10 }}
                    placeholder="Custom Output"
                    extraClasses={styles.customTextarea}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div className={styles.validationBox}>
          <Button
            onClickHandle={handleValidate}
            disabled={!enableAugmentButton}
          >
            Augment and preview inputs/outputs
          </Button>
        </div>
        {error && <Error error={error} />}
      </VerticalGroup>
      <div className={styles.transactionPreview}>
        <div className={styles.transactionPreviewHeader}>
          Transaction preview{' '}
          <Button
            onClickHandle={handleTogglePreview}
            extraStyleClasses={[styles.transactionPreviewButton]}
          >
            switch to explorer view
          </Button>
        </div>
        <div className={styles.fee}>
          Minimum fee: {fee / 1e11} {coinType}
        </div>
        <div className={styles.augmentedData}>
          <div className={styles.input}>
            <h3>Inputs:</h3>
            {JSON.stringify(inputs, null, 2)}
          </div>
          <div className={styles.output}>
            <h3>Outputs:</h3>
            {JSON.stringify(outputs, null, 2)}
          </div>
        </div>
      </div>
      <div>
        <div>
          <div className={styles.password}>
            <TextField
              label="Enter your password:"
              placeHolder="Password"
              password
              validity={passValidity}
              pristinity={passPristinity}
              onChangeHandle={changePassHandle}
              bigGap={false}
              extraStyleClasses={[styles.passwordInput]}
            />
          </div>
        </div>

        {passErrorMessage && <Error error={passErrorMessage} />}
      </div>
      <div className={styles.transactionHexPreview}>
        <div className={styles.transactionHexPreviewInputs}>
          <Button
            onClickHandle={handleBuildTransaction}
            disabled={loading}
            extraStyleClasses={[styles.buildTransactionButton]}
          >
            {loading ? <Loader /> : 'Generate transaction data'}
          </Button>
        </div>
        {transactionHex && (
          <div className={styles.transactionHexPreviewResult}>
            {transactionHex}
          </div>
        )}

        <div>
          <Button
            onClickHandle={handleBroadcast}
            disabled={transactionHex === '' || loading}
            extraStyleClasses={[styles.broadcastTransactionButton]}
          >
            {loading ? <Loader /> : 'Broadcast transaction'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SendCustomOutput
