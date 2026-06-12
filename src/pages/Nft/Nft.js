import { Wallet } from '@ContainerComponents'
import { PageWrapper } from '@BasicComponents'
import styles from './Nft.module.css'

const NftPage = () => {
  return (
    <PageWrapper>
      <div className={styles.nftPage}>
        <Wallet.NftList />
      </div>
    </PageWrapper>
  )
}

export default NftPage
