import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../commons/components/basic/button'
import VerticalGroup from '../../commons/components/group/verticalGroup'
import CenteredLayout from '../../commons/components/group/centeredLayout'

const CreateRestore = () => {
  const navigate = useNavigate()

  const goToSetAccountNamePage = () => navigate('/set-account-name')

  return (
    <div data-testid="create-restore">
      <h1 className="center-text title-create">
        Your Bitcoin wallet right in your browser
      </h1>
      <CenteredLayout>
        <VerticalGroup>
          <Button onClickHandle={goToSetAccountNamePage}>Create</Button>
          <Button alternate>Restore</Button>
        </VerticalGroup>
      </CenteredLayout>
      <div className="footnote-wrapper">
        <p
          className="center-text footnote-name"
          data-testid="footnote-name"
        >
          ©Mojito Wallet, 2022
        </p>
        <a
          className="center-text footnote-link"
          href="http://mojito-wallet.com"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="footnote-link"
        >
          mojito-wallet.com
        </a>
      </div>
    </div>
  )
}

export default CreateRestore
