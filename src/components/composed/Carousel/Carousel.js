import React, { useEffect, useRef, useState } from 'react'

import next from '@Assets/images/next.svg'

import './Carousel.css'

const Carousel = ({ accounts = [], onClick, onDelete, onPrevious, onNext }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selected, setSelected] = useState(undefined)
  const carouselRef = useRef()

  function calculateNextTranslateValue(currentSlide) {
    const buttonSize = 12
    const marginRight = 0.75
    return -1 * (buttonSize + marginRight) * currentSlide
  }

  const translateHandleClick = (direction) => {
    const nextSlide = currentSlide + direction
    setCurrentSlide(nextSlide)
    direction < 0
      ? onPrevious && onPrevious(nextSlide)
      : onNext && onNext(nextSlide)
  }

  const handleClick = (index) => {
    setSelected(index)
    setCurrentSlide(index)
    onClick && onClick(accounts[index])
  }

  const handleDelete = (index) => {
    onDelete(accounts[index])
  }

  useEffect(() => {
    const newTranslateValue = calculateNextTranslateValue(currentSlide)
    carouselRef.current.style.transform = `translateX(${newTranslateValue}rem)`
  }, [currentSlide])

  const carouselSize = () => {
    switch (accounts.length) {
      case 0:
        return 'small'
      case 1:
        return 'small'
      case 2:
        return 'mid'
      default:
        return ''
    }
  }
  return (
    <div className={`carousel ${carouselSize()}`}>
      <button
        name="back"
        type="button"
        className="back"
        onClick={() => translateHandleClick(-1)}
        disabled={currentSlide <= 0}
      >
        <img
          className="back-icon"
          src={next}
          alt="back"
        />
      </button>
      <div className="slides">
        <div
          className="wrapper"
          ref={carouselRef}
        >
          {accounts.map((account, index) => (
            <div
              key={account.id}
              className="item-wrapper"
            >
              <button
                className="delete-button"
                onClick={() => handleDelete(index)}
              >
                X
              </button>
              <button
                name="account"
                key={account.id}
                className={`button-account 
                ${index === currentSlide ? 'current' : ''}
                ${index === selected ? 'selected' : 'unselected'}
              `}
                onClick={() => handleClick(index)}
              >
                {account.name}
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        name="next"
        type="button"
        className="next"
        onClick={() => translateHandleClick(1)}
        disabled={currentSlide >= accounts.length - 1}
      >
        <img
          className="next-icon"
          src={next}
          alt="next"
        />
      </button>
    </div>
  )
}

export default Carousel
