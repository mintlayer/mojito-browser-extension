import { useContext } from 'react'

import { Button } from '@BasicComponents'
import { AppInfo } from '@Constants'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-arrow-right-top.svg'

import { SettingsContext } from '@Contexts'

import styles from './NftDetails.module.css'

const NftDetailsItem = ({ title, content }) => {
  return (
    <div
      className={styles.nftDetailsItem}
      data-testid="nft-details-item"
    >
      <h2 data-testid="nft-details-item-title">{title}</h2>
      <div
        className={styles.nftDetailsContent}
        data-testid="nft-details-item-content"
      >
        {content}
      </div>
    </div>
  )
}

const NftDetails = ({ nft, handleSend }) => {
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET

  const buttonExtraStyles = [styles.nftDetailsButton]

  const explorerLink = `https://${
    isTestnet ? 'lovelace.' : ''
  }explorer.mintlayer.org/nft/${nft?.token_id}`

  const getImageLink = () => {
    const rawImageLink = nft?.data?.icon_uri?.string || 'NFT'
    // Replace 'ipfs://' with a public IPFS gateway URL
    if (rawImageLink.startsWith('ipfs://')) {
      return rawImageLink.replace('ipfs://', 'https://gateway.ipfs.io/ipfs/')
    }
    return rawImageLink
  }

  const addFundsClickHandle = () => {
    handleSend && handleSend()
  }

  return (
    <div
      className={styles.nftDetails}
      data-testid="nft-details"
    >
      <div className={styles.nftDetailsItemsWrapper}>
        <div className={styles.nftImage}>
          <img
            src={getImageLink()}
            alt="NFT"
          />
        </div>
        {/* <DelegationDetailsItem
          title={'Date:'}
          content={date}
        /> */}
        <NftDetailsItem
          title={'Token id:'}
          content={nft.token_id}
        />
        <NftDetailsItem
          title={'Name:'}
          content={nft.data.name.string}
        />
        <NftDetailsItem
          title={'Description:'}
          content={nft.data.description.string}
        />
        <NftDetailsItem
          title={'Ticker:'}
          content={nft.data.ticker.string}
        />
        <NftDetailsItem
          title={'Address:'}
          content={nft.destination}
        />
      </div>
      <CenteredLayout>
        <div className={styles.nftDetailsActionButtons}>
          <VerticalGroup smallGap>
            <Button
              extraStyleClasses={buttonExtraStyles}
              onClickHandle={addFundsClickHandle}
            >
              Send
            </Button>

            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button extraStyleClasses={buttonExtraStyles}>
                Open In Block Explorer
                <IconArrowTopRight className={styles.nftExplorerButtonIcon} />
              </Button>
            </a>
          </VerticalGroup>
        </div>
      </CenteredLayout>
    </div>
  )
}

export { NftDetailsItem }

export default NftDetails
