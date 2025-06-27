import { useState, useContext, useEffect } from 'react'

import { Loading, TextField } from '@ComposedComponents'
import { Button, Error } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { ML as MlHelpers } from '@Helpers'
import { AccountContext, SettingsContext, MintlayerContext } from '@Contexts'

import './OrderSwap.css'

const OrderSwapPage = () => {
  const { balanceLoading } = useContext(AccountContext)
  const { client } = useContext(MintlayerContext)
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
  const [loading, setLoading] = useState(false)
  const inputExtraClasses = ['swap-order-input']
  const loadingExtraClasses = ['loading-big']

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
    // isFormValid && client.createOrder({ conclude_destination: 'tmt1qxskh99uvaa8agqpdjt5psuq94fl5n6lg5dcd639', ask_token: 'tmltk1aa3vvztufv5m054klp960p6f6pf59ugxp394x7n42v0clgwhrw3q3mpcq3', ask_amount: 5, give_token: 'Coin', give_amount: 5 })
    // isFormValid &&
    //   client.transfer({
    //     to: destinationAddress,
    //     amount: amount,
    //   })
    try {
      setLoading(true)
      if (isFormValid) {
        await client.fillOrder({
          order_id: orderId,
          amount,
          destination: destinationAddress,
        })
      }
    } catch (error) {
      if (error?.message?.includes('Not enough token UTXOs')) {
        setTxErrorMessage('Token blance is not enough to fill the order')
        return
      }

      if (error?.message?.includes('Failed to fetch order')) {
        setTxErrorMessage('Order not found or invalid order ID')
        return
      }

      if (error?.message?.includes('Invalid addressable')) {
        setTxErrorMessage('Invalid destination address')
        return
      }

      if (error.includes('Invalid addressable')) {
        setTxErrorMessage('Invalid destination address')
        return
      }

      console.error('Error filling order:', error)
      setTxErrorMessage(
        error?.message || 'An error occurred while filling the order',
      )
    } finally {
      setLoading(false)
    }
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
        {balanceLoading || loading ? (
          <div className="swap-order-loading">
            <Loading extraStyleClasses={loadingExtraClasses} />
          </div>
        ) : (
          <>
            <TextField
              label={'Order id'}
              labelPosition="left"
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
              labelPosition="left"
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
              labelPosition="left"
              value={destinationAddress}
              onChangeHandle={destinationAddressChangeHandler}
              validity={destinationAddressValidity}
              placeHolder={'Enter address'}
              extraStyleClasses={inputExtraClasses}
              pristinity={fieldPristinity}
              bigGap={false}
              focus={false}
            />

            <CenteredLayout>
              <VerticalGroup
                fullWidth
                center
              >
                {txErrorMessage ? (
                  <>
                    <Error error={txErrorMessage} />
                  </>
                ) : (
                  <></>
                )}
                <Button
                  extraStyleClasses={['go-preview-button']}
                  onClickHandle={onSubmit}
                >
                  Swap Order
                </Button>
              </VerticalGroup>
            </CenteredLayout>
          </>
        )}
      </form>
    </div>
  )
}

export default OrderSwapPage
