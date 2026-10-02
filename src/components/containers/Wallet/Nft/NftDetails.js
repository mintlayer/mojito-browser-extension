import { useContext } from 'react'

import { Button } from '@BasicComponents'
import { AppInfo } from '@Constants'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-arrow-right-top.svg'

import { SettingsContext } from '@Contexts'

import useNftImage from './useNftImage'

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

  // The full artwork for the detail view; icon_uri is only the fallback.
  const imageSrc = useNftImage(
    nft?.data?.media_uri?.string || nft?.data?.icon_uri?.string,
  )

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
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={nft?.data?.name?.string || 'NFT'}
            />
          ) : (
            <div className={styles.nftImagePlaceholder}>
              {(nft?.data?.name?.string || 'NFT').charAt(0)}
            </div>
          )}
        </div>
        <NftDetailsItem
          title={'Token id:'}
          content={nft?.token_id}
        />
        <NftDetailsItem
          title={'Name:'}
          content={nft?.data?.name?.string || 'N/A'}
        />
        <NftDetailsItem
          title={'Description:'}
          content={nft?.data?.description?.string || 'N/A'}
        />
        <NftDetailsItem
          title={'Ticker:'}
          content={nft?.data?.ticker?.string || 'N/A'}
        />
        <NftDetailsItem
          title={'Address:'}
          content={nft?.destination || 'N/A'}
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
