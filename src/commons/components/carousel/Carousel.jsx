import React, { useEffect, useRef, useState } from 'react'
import './Carousel.css'

/**
Create component, that will receive a list of accounts (name and id) and generate clickable components in a carousel list. The click function should also be a prop of the list, so it can be controlled by the page that uses it.
Use CSS for the animation.
*/

export default function Carousel({
  accounts = [],
  onClick,
  onPrevious,
  onNext,
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selected, setSelected] = useState(undefined)
  const carouselRef = useRef()

  useEffect(() => {
    const translate = -1 * currentSlide * (12 + 0.75) // rem => mx-3 + w-48
    carouselRef.current.style.transform = `translateX(${translate}rem)`
  }, [currentSlide])

  const translateHandleClick = (direction) => {
    const next = currentSlide + direction
    if (next >= 0 && next < accounts.length) {
      setCurrentSlide(next)
      direction < 0 ? onPrevious && onPrevious() : onNext && onNext()
    }
  }

  const handleClick = (index) => {
    setSelected(index)
    setCurrentSlide(index)
    onClick && onClick(accounts[index])
  }

  return (
    <div className="carousel">
      <button
        type="button"
        className="back"
        onClick={() => translateHandleClick(-1)}
        disabled={currentSlide <= 0}
      >
        &lt;
      </button>
      <div className="slides">
        <div
          className="wrapper"
          ref={carouselRef}
        >
          {accounts.map((account, index) => (
            <button
              key={account.id}
              className={`button-account 
                ${index === currentSlide ? 'current' : ''}
                ${index === selected ? 'selected' : 'unselected'}
              `}
              onClick={() => handleClick(index)}
            >
              {account.name}
              {/* <div className="bg-gray-100">{account.id}</div> */}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="next"
        onClick={() => translateHandleClick(1)}
        disabled={currentSlide >= accounts.length - 1}
      >
        &gt;
      </button>
    </div>
  )
}
