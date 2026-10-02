import './SkeletonLoader.css'

const SkeletonText = () => {
  return (
    <div
      className="cardBody bodyText"
      data-testid="card-body"
    >
      <div
        className="skeleton skeletonText skeletonTextBody"
        data-testid="skeleton-text"
      ></div>
    </div>
  )
}

const SkeletonLoader = ({ variant = 'default' }) => {
  const isCompact = variant === 'compact'

  return (
    <div
      className={`card ${isCompact ? 'card-compact' : ''}`}
      data-testid="card"
    >
      <div
        className={`cardHeader ${isCompact ? 'cardHeader-compact' : ''}`}
        data-testid="card-header"
      >
        <div
          className={`cardHeader headerImg skeleton ${isCompact ? 'cardHeader-compact' : ''}`}
        />
      </div>

      <div className="cardBodyWrapper">
        <div
          className="cardBody cardBodyLeft"
          data-testid="body-item"
        >
          {Array.from({ length: isCompact ? 2 : 3 }).map((item, index) => (
            <SkeletonText key={index} />
          ))}
        </div>

        <div
          className="cardBody cardBodyRight"
          data-testid="body-item"
        >
          {Array.from({ length: isCompact ? 2 : 3 }).map((item, index) => (
            <SkeletonText key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

export { SkeletonText }
export default SkeletonLoader
