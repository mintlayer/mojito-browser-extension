import React from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@BasicComponents'
import { VerticalGroup, CenteredLayout } from '@LayoutComponents'

import './CreateRestore.css'

const CreateRestorePage = () => {
  const navigate = useNavigate()

  const goToSetAccountPage = () => navigate('/set-account')
  const goToRestoreAccountPage = () => navigate('/restore-account')

  return (
    <div data-testid="create-restore">
      <h1 className="center-text title-create">
        Your Mintlayer, right in your browser.
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
          ©Mintlayer, 2024
        </small>
        <a
          className="center-text footnote-link"
          href="https://mintlayer.org"
          target="_blank"
          data-testid="footnote-link"
        >
          mintlayer.org
        </a>
        <small
          className="footnote-version"
          data-testid="footnote-name"
        >
          v1.2.1
        </small>
      </div>
    </div>
  )
}

export default CreateRestorePage
