import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../commons/components/basic/button'
import VerticalGroup from '../../commons/components/group/verticalGroup'
import CenteredLayout from '../../commons/components/group/centeredLayout'
import { generateAddr, generateMnemonic, generateKeysFromMnemonic } from '../../commons/crypto/btc'
import { BTC_NETWORK } from '../../environmentVars'

const CreateRestore = () => {
  const navigate = useNavigate()

  const goToSetAccountPage = () => navigate('/set-account')

  const mnemonic = generateMnemonic()
  const keys = generateKeysFromMnemonic(mnemonic)
  const address = generateAddr(mnemonic)

  console.log(`
    Generated BTC wallet (${BTC_NETWORK}):

    Address: ${address}
    Mnemonic: ${mnemonic} 
    WIF: ${keys[1]}
  `)

  return (
    <div data-testid="create-restore">
      <h1 className="center-text title-create">
        Your Bitcoin wallet right in your browser
      </h1>
      <CenteredLayout>
        <VerticalGroup>
          <Button onClickHandle={goToSetAccountPage}>Create</Button>
          <Button alternate>Restore</Button>
        </VerticalGroup>
      </CenteredLayout>
      <div className="footnote-wrapper">
        <small
          className="center-text footnote-name"
          data-testid="footnote-name"
        >
          ©Mojito Wallet, 2022
        </small>
        <a
          className="center-text footnote-link"
          href="http://mojito-wallet.com"
          target="_blank"
          data-testid="footnote-link"
        >
          mojito-wallet.com
        </a>
      </div>
    </div>
  )
}

export default CreateRestore
