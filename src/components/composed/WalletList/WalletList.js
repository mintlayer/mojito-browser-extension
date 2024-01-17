import { CenteredLayout } from '@LayoutComponents'
import { OptionButtons } from '@ComposedComponents'

import './WalletList.css'

const WalletList = ({ selectedWallets, setSelectedWallets, walletTypes }) => {
  const radioButtonExtraClasses = ['crate-wallet-button']
  return (
    <CenteredLayout>
      <p
        className="wallet-list-description"
        data-testid="wallet-list-description"
      >
        Which of these wallets would you like to add?
      </p>
      <OptionButtons
        value={selectedWallets}
        onSelect={setSelectedWallets}
        options={walletTypes}
        buttonExtraStyles={radioButtonExtraClasses}
        column
        multiple
      />
    </CenteredLayout>
  )
}

export default WalletList
