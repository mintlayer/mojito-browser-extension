import './SkeletonLoader.css'

const SkeletonText = () => {
  return (
    <div
      className="cardBody bodyText"
      id="cardDetails"
      data-testid="card-body"
    >
      <div
        className="skeleton skeletonText skeletonTextBody"
        data-testid="skeleton-text"
      ></div>
    </div>
  )
}

const SkeletonLoader = () => {
  return (
    <div
      className="card"
      id="cardLink"
      data-testid="card"
    >
      <div
        className="cardHeader"
        data-testid="cardHeader headerImg skeleton"
      >
        <div
          className="cardHeader headerImg skeleton"
          id="logoCard"
        />
      </div>

      <div className="cardBodyWrapper">
        <div
          className="cardBody cardBodyLeft"
          data-testid="body-item"
        >
          {Array.from({ length: 3 }).map((item, index) => (
            <SkeletonText key={index} />
          ))}
        </div>

        <div
          className="cardBody cardBodyRight"
          data-testid="body-item"
        >
          {Array.from({ length: 3 }).map((item, index) => (
            <SkeletonText key={index + 5} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SkeletonLoader
