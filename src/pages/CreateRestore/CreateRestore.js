import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@BasicComponents'
import { VerticalGroup, CenteredLayout } from '@LayoutComponents'
import { AccountContext } from '@Contexts'

import './CreateRestore.css'
import { LocalStorageService } from '@Storage'

const CreateRestorePage = () => {
  const { isExtended } = useContext(AccountContext)
  const navigate = useNavigate()
  const devLocation = ':300'
  const isDevMode = window.location.href.includes(devLocation)

  const expandHandler = (dest) => {
    window.open(
      typeof browser !== 'undefined'
        ? // eslint-disable-next-line no-undef
          browser.runtime.getURL('popup.html')
        : // eslint-disable-next-line no-undef
          chrome.runtime.getURL('popup.html'),
      '_blank',
      LocalStorageService.setItem('extendPath', dest),
    )
  }

  const goToSetAccountPage = () => {
    if (isDevMode) {
      return navigate('/set-account')
    }
    isExtended ? navigate('/set-account') : expandHandler('/set-account')
  }
  const goToRestoreAccountPage = () => {
    if (isDevMode) {
      return navigate('/restore-account')
    }
    isExtended
      ? navigate('/restore-account')
      : expandHandler('/restore-account')
  }

  return (
    <div data-testid="create-restore">
      <h2 className="center-text title-create">
        Your Mintlayer, right in your browser.
      </h2>
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
          v1.2.6
        </small>
      </div>
    </div>
  )
}

export default CreateRestorePage
