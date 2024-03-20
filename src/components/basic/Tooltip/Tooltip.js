import './Tooltip.css'

const Tooltip = ({ message, visible }) => {
  return (
    <span
      className={`tooltip ${visible && 'visible'}`}
      data-testid="tooltip"
    >
      {message}
    </span>
  )
}

export default Tooltip
