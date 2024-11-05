import React, { useContext, useEffect, useState } from 'react'
import styles from './SendCustomOutput.module.css'
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

const SendCustomOutput = () => {
  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses

  const {
    balance: mlBalance,
    utxos,
    unusedAddresses,
    feerate,
    currentHeight,
  } = useMlWalletInfo(currentMlAddresses)

  useEffect(() => {
    // add style to body
    document.body.style.height = 'auto'
    document.documentElement.style.overflow = 'auto'
    return () => {
      document.body.style.height = '600px'
      document.documentElement.style.overflow = 'hidden'
    }
  }, [])

  const [customOutput, setCustomOutput] = useState('')
  const [fee, setFee] = useState('')
  const [error, setError] = useState('')
  const [inputs, setInputs] = useState([])
  const [outputs, setOutputs] = useState([])
  const [fields, setFields] = useState([])
  const [transactionHex, setTransactionHex] = useState('')

  const tplRef = React.createRef()
  const passwordRef = React.createRef()

  const handleOutputChange = (e) => {
    const text = e.target.value
    setCustomOutput(text)
  }

  const handleValidate = async () => {
    // validate output
    if (!validateOutput(customOutput)) {
      setError('Invalid output')
      return
    }

    // parse output
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
      // TODO go through the required fields and check and add info
    }

    const adjustedOutput = JSON.parse(customOutput)

    const unusedChangeAddress = unusedAddresses.change

    const utxoCoin = utxos.filter((utxo) => utxo.utxo.value.type === 'Coin')
    const inputs = getTransactionUtxos({
      utxos: utxoCoin,
      amount: +(parsedOutput.extraFee || 0) + amountToSend + fee,
    })
    console.log('inputs', inputs)

    setInputs(inputs)
    const utxoBalance = totalUtxosAmount(inputs)
    console.log('utxoBalance', utxoBalance)

    const transactionFee = fee
    const extraFee = parsedOutput.extraFee || 0

    const amountToReturn =
      BigInt(utxoBalance) -
      BigInt(amountToSend) -
      BigInt(transactionFee) -
      BigInt(extraFee)

    console.log('amountToReturn', amountToReturn)

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
  }

  const handleBuildTransaction = async () => {
    const password = passwordRef.current.value
    const changeAddressesLength = currentMlAddresses.mlChangeAddresses.length

    const { mlPrivKeys } = await Account.unlockAccount(accountID, password)
    const privKey =
      networkType === 'mainnet'
        ? mlPrivKeys.mlMainnetPrivateKey
        : mlPrivKeys.mlTestnetPrivateKey

    const walletPrivKeys = await ML.getWalletPrivKeysList(
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

    return false
  }

  const handleBroadcast = async () => {
    // TODO broadcast transaction
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
    if (
      customOutput?.length > 0 &&
      !window.confirm(
        'Are you sure you want to insert a template? It will overwrite the current output',
      )
    ) {
      return
    }
    const templateName = tplRef.current.selectedOptions[0].value
    const template = JSON.stringify(getTemplate(templateName), null, 2)
    setCustomOutput(template)
  }

  const handleTogglePreview = () => {
    // TODO toggle preview
  }

  useEffect(() => {
    if (customOutput) {
      const allFields = getInfoAboutOutput(customOutput).allFields

      const fields = Object.keys(allFields).map((key) => {
        return {
          id: key,
          label: key,
          value: allFields[key],
        }
      })

      setFields(fields)
    }
  }, [customOutput])

  const handleUpdateField = (id) => (event) => {
    const data = JSON.parse(customOutput)

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

    setCustomOutput(JSON.stringify(data, null, 2))
  }

  return (
    <div>
      <div className={styles.balance}>Balance: {mlBalance} TML</div>
      <div className={styles.templateSelector}>
        Use template:
        <select ref={tplRef}>
          <option value="">Select</option>
          <option value="Transfer">Transfer</option>
          <option value="IssueFungibleToken">IssueFungibleToken</option>
          <option value="IssueNft">IssueNft</option>
          <option value="DataDeposit">DataDeposit</option>
        </select>
        <button onClick={handleInsertTemplate}>apply</button>
      </div>
      <div className={styles.workArea}>
        <div className={styles.form}>
          <div>
            {fields.map((field) => {
              return (
                <div
                  className={styles.fieldGroup}
                  key={field.id}
                >
                  <label>{field.label}</label>
                  <input
                    className={styles.input}
                    type="text"
                    onChange={handleUpdateField(field.id)}
                    value={field.value}
                  />
                </div>
              )
            })}
          </div>
        </div>
        <div className={styles.text}>
          <textarea
            disabled
            onChange={handleOutputChange}
            value={customOutput}
          >
            {customOutput}
          </textarea>
        </div>
      </div>
      <div>{error && <div className={styles.error}>{error}</div>}</div>
      <div className={styles.validationBox}>
        <button onClick={handleValidate}>
          Validate and augment with inputs/outputs
        </button>
      </div>
      <div className={styles.transactionPreview}>
        <div className={styles.transactionPreviewHeader}>
          Transaction preview{' '}
          <button onClick={handleTogglePreview}>switch to explorer view</button>
        </div>
        <div className={styles.augmentedData}>
          <div className={styles.input}>{JSON.stringify(inputs, null, 2)}</div>
          <div>></div>
          <div className={styles.output}>
            {JSON.stringify(outputs, null, 2)}
          </div>
        </div>
      </div>
      <div className={styles.fee}>
        Fee:{' '}
        <input
          type="text"
          disabled
          value={fee / 1e11}
        />{' '}
        <span>TML</span>
      </div>
      <div className={styles.transactionHexPreview}>
        <div className={styles.transactionHexPreviewInputs}>
          <div>
            password:{' '}
            <input
              type="password"
              ref={passwordRef}
            />
          </div>
          <button onClick={handleBuildTransaction}>Build transaction</button>
        </div>
        <div className={styles.transactionHexPreviewResult}>
          {transactionHex}
        </div>
      </div>
      <div className={styles.broadcast}>
        <button onClick={handleBroadcast}>Broadcast transaction</button>
      </div>
    </div>
  )
}

export default SendCustomOutput
