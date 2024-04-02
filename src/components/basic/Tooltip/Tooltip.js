import './Tooltip.css'

const Tooltip = ({ message, visible, position }) => {
  const orientation = [
    'top',
    'bottom',
    'left',
    'right',
    'topLeft',
    'topRight',
    'bottomLeft',
    'bottomRight',
  ]
  return (
    <span
      className={`tooltip ${
        orientation.includes(position) ? position : 'bottom'
      } ${!visible && 'hidden'}`}
      data-testid="tooltip"
    >
      {message}
    </span>
  )
}

export default Tooltip
