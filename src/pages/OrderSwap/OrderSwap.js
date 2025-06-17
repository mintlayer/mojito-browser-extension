import { useState, useContext, useEffect } from 'react'

import { Loading, TextField } from '@ComposedComponents'
import { Button, Error } from '@BasicComponents'
import { CenteredLayout } from '@LayoutComponents'
import { ML as MlHelpers } from '@Helpers'
import { AccountContext, SettingsContext } from '@Contexts'

import './OrderSwap.css'

const OrderSwapPage = () => {
  const { balanceLoading } = useContext(AccountContext)
  // const { client } = useContext(MintlayerContext)
  const { networkType } = useContext(SettingsContext)
  const [orderId, setOrderId] = useState('')
  const [orderIdValidity, setOrderIdValidity] = useState(false)
  const [amount, setAmount] = useState('')
  const [amountValidity, setAmountValidity] = useState(false)
  const [destinationAddress, setDestinationAddress] = useState('')
  const [destinationAddressValidity, setDestinationAddressValidity] =
    useState(false)
  const [txErrorMessage, setTxErrorMessage] = useState(null)
  const [isFormValid, setIsFormValid] = useState(false)
  const [fieldPristinity, setFieldPristinity] = useState(true)
  const inputExtraClasses = ['swap-order-input']

  const onSubmit = async (event) => {
    event.preventDefault()

    setFieldPristinity(false)
    if (!amountValidity) {
      setTxErrorMessage('Amount is invalid')
      return
    }

    if (!orderIdValidity) {
      setTxErrorMessage('Order ID is invalid')
      return
    }

    if (!destinationAddressValidity) {
      setTxErrorMessage('Destination address is invalid')
      return
    }
    setTxErrorMessage(null)
    // isFormValid && client.createOrder({ conclude_destination: 'tmt1qxskh99uvaa8agqpdjt5psuq94fl5n6lg5dcd639', ask_token: 'tmltk1aa3vvztufv5m054klp960p6f6pf59ugxp394x7n42v0clgwhrw3q3mpcq3', ask_amount: 10, give_token: 'Coin', give_amount: 10 })
    isFormValid &&
      console.log('Submitting order swap with:', {
        orderId,
        amount,
        destinationAddress,
        networkType,
      })
  }

  const orderIdChangeHandler = (value) => {
    const isValid = MlHelpers.isMlOrderIdValid(value, networkType)
    setOrderIdValidity(isValid)
    setOrderId(value)
  }

  const amountChangeHandler = (value) => {
    const isValid = value && !isNaN(value) && parseFloat(value) > 0
    setAmountValidity(isValid)
    setAmount(value)
  }

  const destinationAddressChangeHandler = (value) => {
    const isValid = MlHelpers.isMlAddressValid(value, networkType)
    setDestinationAddressValidity(isValid)
    setDestinationAddress(value)
  }

  useEffect(() => {
    const isValid =
      orderIdValidity && amountValidity && destinationAddressValidity
    if (isValid) {
      setTxErrorMessage(null)
      setIsFormValid(isValid)
    }
  }, [orderIdValidity, amountValidity, destinationAddressValidity])

  return (
    <div>
      <h1 className="order-swap-title">Order Swap</h1>

      <form
        onSubmit={onSubmit}
        className="order-swap-form"
      >
        {balanceLoading ? (
          <div className="loading-center">
            <Loading />
          </div>
        ) : (
          <>
            <TextField
              label={'Order id'}
              value={orderId}
              onChangeHandle={orderIdChangeHandler}
              validity={orderIdValidity}
              placeHolder={'Enter order ID'}
              extraStyleClasses={inputExtraClasses}
              pristinity={fieldPristinity}
              bigGap={false}
              focus={false}
            />

            <TextField
              label={'Amount'}
              value={amount}
              onChangeHandle={amountChangeHandler}
              validity={orderIdValidity}
              placeHolder={'Enter amount'}
              extraStyleClasses={inputExtraClasses}
              pristinity={fieldPristinity}
              bigGap={false}
              focus={false}
            />

            <TextField
              label={'Destination address'}
              value={destinationAddress}
              onChangeHandle={destinationAddressChangeHandler}
              validity={destinationAddressValidity}
              placeHolder={'Enter address'}
              extraStyleClasses={inputExtraClasses}
              pristinity={fieldPristinity}
              bigGap={false}
              focus={false}
            />

            {txErrorMessage ? (
              <>
                <Error error={txErrorMessage} />
              </>
            ) : (
              <></>
            )}

            <CenteredLayout>
              <Button
                extraStyleClasses={['send-transaction-button']}
                onClickHandle={onSubmit}
              >
                Swap Order
              </Button>
            </CenteredLayout>
          </>
        )}
      </form>
    </div>
  )
}

export default OrderSwapPage
