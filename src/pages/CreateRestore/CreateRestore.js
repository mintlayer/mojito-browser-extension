import React from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../../components/basic/Button/Button'

import VerticalGroup from '../../components/layouts/VerticalGroup/VerticalGroup'
import CenteredLayout from '../../components/layouts/CenteredLayout/CenteredLayout'

const CreateRestorePage = () => {
  const navigate = useNavigate()

  const goToSetAccountPage = () => navigate('/set-account')
  const goToRestoreAccountPage = () => navigate('/restore-account')

  return (
    <div data-testid="create-restore">
      <h1 className="center-text title-create">
        Your Bitcoin wallet right in your browser
      </h1>
      <CenteredLayout>
        <VerticalGroup>
          <Button onClickHandle={goToSetAccountPage}>Create</Button>
          <Button
            onClickHandle={goToRestoreAccountPage}
            alternate
          >
            Restore
          </Button>
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

export default CreateRestorePage
