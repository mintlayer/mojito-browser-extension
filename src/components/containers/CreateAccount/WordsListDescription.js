import { CenteredLayout, VerticalGroup } from '@LayoutComponents'

import './WordsListDescription.css'

const WordsDescription = () => {
  return (
    <CenteredLayout>
      <VerticalGroup>
        <p
          className="center-text words-list-description"
          data-testid="description-paragraph"
        >
          Write down each of the words (seed phrases) that are shown on the next
          screen.
        </p>
        <p
          className="center-text words-list-description"
          data-testid="description-paragraph"
        >
          Store them in a safe place as they are the{' '}
          <span className="word-list-highlighted">
            only way to restore your wallet.
          </span>
        </p>
      </VerticalGroup>
    </CenteredLayout>
  )
}

export default WordsDescription
