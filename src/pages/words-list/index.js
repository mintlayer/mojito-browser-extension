
import InputsList from '../../commons/components/inputs-list/inputsList'
import  './words-list.css'
import Button from '../../commons/components/basic/button'

const wordsList = [
  'car', 'phone', 'lighter'
]

const Words = () => {
  // const submitHandler = (e) => {
  //   e.preventDefault()
  // }

  return (
    <form className="form" method='POST' data-testid="words-list-form">
      <InputsList amount={12} restoreMode wordsList={wordsList}/>
      <div className="button-wrapper">
        <Button>
          Submit
        </Button>
      </div>
    </form>
  )}

export default Words
