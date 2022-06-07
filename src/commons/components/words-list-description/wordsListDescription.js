import CenteredLayout from '../group/centeredLayout'

const WordsDescription = () => {
  return (
    <CenteredLayout>
      <p
        className="words-list-description"
        data-testid="description-paragraph"
      >
        Write down all of the next words. They will be asked to restores your
        wallet in the future.
      </p>
      <p
        className="words-list-description"
        data-testid="description-paragraph"
      >
        Save they in a very safe place. It is only your backup
      </p>
    </CenteredLayout>
  )
}

export default WordsDescription
