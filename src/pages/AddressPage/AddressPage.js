import { useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { AddressList } from '@ComposedComponents'
import { Button } from '@BasicComponents'
import { PopUp } from '@ComposedComponents'
import { Wallet } from '@ContainerComponents'
import { ReactComponent as IconQr } from '@Assets/images/icons-qr.svg'
import { MintlayerContext, BitcoinContext } from '@Contexts'
import './AddressPage.css'

const AddressPage = () => {
  const { unusedAddresses: mintlayerUnusedAddresses } =
    useContext(MintlayerContext)
  const { unusedAddresses: bitcoinUnusedAddresses } = useContext(BitcoinContext)
  const [search, setSearch] = useState('')
  const [openShowAddress, setOpenShowAddress] = useState(false)
  const { coinType } = useParams()

  const requiredAddress =
    coinType === 'Mintlayer' ? mintlayerUnusedAddresses.receive : bitcoinUnusedAddresses.receivingAddress.address
  return (
    <div className="address-page">
      <div className="address-page-header">
        <div className="address-page-header-receive">
          <Button
            extraStyleClasses={['qr-button-receive']}
            onClickHandle={() => setOpenShowAddress(true)}
          >
            <IconQr className="icon-qr" />
          </Button>
          <span className="address-page-title">Receive</span>
        </div>
        <input
          type="text"
          placeholder="Search by address or token id"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="address-search-input"
        />
      </div>

      <AddressList search={search} />
      {openShowAddress && (
        <PopUp setOpen={setOpenShowAddress}>
          <Wallet.ShowAddress address={requiredAddress}></Wallet.ShowAddress>
        </PopUp>
      )}
    </div>
  )
}

export default AddressPage
