import React, { useContext } from 'react'
import { MintlayerContext, BitcoinContext } from '@Contexts'
import { useParams } from 'react-router-dom'

import { Loading } from '@ComposedComponents'
import AddressListItem from './AddressListItem'
import './AddressList.css'

const getFormatedMlAddresses = (addressData) => {
  return addressData.map((address) => ({
    id: address.id,
    coin_balance: {
      available: address.coin_balance.decimal || 0,
      locked: address.locked_coin_balance.decimal || 0,
    },
    tokens: address.tokens,
    used: address.transaction_history?.length > 0,
  }))
}

const sortAddresses = (addresses) => {
  return addresses.sort((a, b) => {
    if (a.used !== b.used) {
      return b.used - a.used
    }

    const availableDiff =
      (b.coin_balance?.available || 0) - (a.coin_balance?.available || 0)
    if (availableDiff !== 0) return availableDiff

    const lockedDiff =
      (b.coin_balance?.locked || 0) - (a.coin_balance?.locked || 0)
    if (lockedDiff !== 0) return lockedDiff

    const tokensCountA = a.tokens?.length || 0
    const tokensCountB = b.tokens?.length || 0
    return tokensCountB - tokensCountA
  })
}

const AddressList = ({ search }) => {
  const { fetchingBalances, addressData: mlAddressData } = useContext(MintlayerContext)
  const { formatedAddresses: btcFormatedAddresses } = useContext(BitcoinContext)
  const { coinType } = useParams()

  const requiredAddresses =
    coinType === 'Mintlayer' ? mlAddressData : btcFormatedAddresses

  const addressList =
    coinType === 'Mintlayer'
      ? sortAddresses(getFormatedMlAddresses(requiredAddresses))
      : sortAddresses(btcFormatedAddresses)

  const filteredAddresses = addressList.filter((address) => {
    const addressString = address.id || ''
    const tokenString =
      address.tokens?.map((token) => token.token_id).join(' ') || ''
    return addressString.includes(search) || tokenString.includes(search)
  })

  return (
    <div className="address-table-wrapper">
      {fetchingBalances ? (
        <div className="address-loading-wrapper">
          <Loading />
        </div>
      ) : (
        <table
          className="address-table"
          data-testid="address-table"
        >
          <thead>
            <tr>
              <th className="address-title">Address</th>
              <th className="address-title">Status</th>
              <th className="address-title">Balances</th>
            </tr>
          </thead>
          <tbody>
            {requiredAddresses && requiredAddresses.length > 0 ? (
              filteredAddresses.map((address, index) => (
                <AddressListItem
                  key={address.id || index}
                  index={index}
                  address={address}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="no-addresses"
                >
                  No addresses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AddressList
