import { Wallet } from '@ContainerComponents'
import { PageWrapper } from '@BasicComponents'
import styles from './Nft.module.css'

const NftPage = () => {
  return (
    <PageWrapper>
      <div className={styles.nftPage}>
        <h1 className={styles.pageTitle}>NFTs</h1>
        <Wallet.NftList />
      </div>
    </PageWrapper>
  )
}

export default NftPage
