import './sortButton.css'
import Button from '../basic/button'
import { ReactComponent as ArrowIcon } from '../../assets/img/icon-arrow.svg'

const SortButton = ({ title, up }) => {
  const buttonExtraClasses = ['button-sort']
  const buttonUpExtraClasses = ['button-sort', 'button-sort-up']
  return (
    <div
      className="sort-item"
      data-testid={'sort-button-container'}
    >
      <Button
        extraStyleClasses={up ? buttonUpExtraClasses : buttonExtraClasses}
      >
        <ArrowIcon />
      </Button>
      {title && <span data-testid={'sort-button-title'}>{title}</span>}
    </div>
  )
}

export default SortButton
