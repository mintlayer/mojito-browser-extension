import { useState, useContext } from 'react'
import { useParams } from 'react-router'
import { AddressList, PopUp } from '@ComposedComponents'
import { Button, PageWrapper } from '@BasicComponents'
import { Wallet } from '@ContainerComponents'
import { ReactComponent as IconQr } from '@Assets/images/icons-qr.svg'
import { ReactComponent as IconSearch } from '@Assets/images/icon-search.svg'
import { MintlayerContext, BitcoinContext } from '@Contexts'
import styles from './AddressPage.module.css'

const AddressPage = () => {
  const {
    unusedAddresses: mintlayerUnusedAddresses,
    addressData: mlAddressData,
  } = useContext(MintlayerContext)
  const {
    unusedAddresses: bitcoinUnusedAddresses,
    formatedAddresses: btcFormatedAddresses,
  } = useContext(BitcoinContext)
  const [search, setSearch] = useState('')
  const [openShowAddress, setOpenShowAddress] = useState(false)
  const { coinType } = useParams()

  const isBitcoin = coinType === 'Bitcoin'
  const ticker = isBitcoin ? 'BTC' : 'ML'

  const addressCount = isBitcoin
    ? btcFormatedAddresses?.length || 0
    : mlAddressData?.length || 0

  const bitcoinAddress =
    bitcoinUnusedAddresses?.receivingAddress?.address ||
    bitcoinUnusedAddresses?.receivingAddress ||
    ''

  const requiredAddress =
    coinType === 'Mintlayer'
      ? mintlayerUnusedAddresses?.receive || ''
      : bitcoinAddress

  return (
    <PageWrapper>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              extraStyleClasses={[styles.qrButton]}
              onClickHandle={() => setOpenShowAddress(true)}
            >
              <IconQr />
            </Button>
            <div className={styles.headerInfo}>
              <h2 className={styles.title}>Receive address</h2>
              <span className={styles.subtitle}>
                {ticker} {addressCount} addresses
              </span>
            </div>
          </div>
          <div className={styles.searchWrapper}>
            <IconSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search address or token id"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
              id="address-search-input"
            />
          </div>
        </div>

        <AddressList search={search} />

        {openShowAddress && (
          <PopUp setOpen={setOpenShowAddress}>
            <Wallet.ShowAddress address={requiredAddress}></Wallet.ShowAddress>
          </PopUp>
        )}
      </div>
    </PageWrapper>
  )
}

export default AddressPage
