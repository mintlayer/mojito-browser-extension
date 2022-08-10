import { CenteredLayout } from '@LayoutComponents'

import './WordsListDescription.css'

const WordsDescription = () => {
  return (
    <CenteredLayout>
      <p
        className="center-text words-list-description"
        data-testid="description-paragraph"
      >
        Write down all of the next words.
        <br /> They will be asked to restores your wallet in the future.
      </p>
      <p
        className="center-text words-list-description"
        data-testid="description-paragraph"
      >
        Save they in a very safe place.
        <br /> It is only your backup
      </p>
    </CenteredLayout>
  )
}

export default WordsDescription
