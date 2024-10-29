import { useEffect, useRef, useState, useContext } from 'react'
import { ReactComponent as IconClose } from '@Assets/images/icon-close.svg'
import { AccountContext } from '@Contexts'
import { ReactComponent as IconAccount } from '@Assets/images/icon-account.svg'

// import next from '@Assets/images/next.svg'

import { ReactComponent as IconNext } from '@Assets/images/next.svg'

import './Carousel.css'

const Carousel = ({ accounts = [], onClick, onPrevious, onNext }) => {
  const { setRemoveAccountPopupOpen, setDeletingAccount } =
    useContext(AccountContext)
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
    setRemoveAccountPopupOpen(true)
    setDeletingAccount(accounts[index])
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
        data-testid="back"
        onClick={() => translateHandleClick(-1)}
        disabled={currentSlide <= 0}
      >
        <IconNext className="back-icon" />
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
              onClick={() => handleClick(index)}
              data-testid="carousel-item"
            >
              <button
                className="delete-button"
                onClick={() => handleDelete(index)}
              >
                <IconClose className="icon-delete-button" />
              </button>
              <button
                name="account"
                key={account.id}
                className={`button-account 
                ${index === currentSlide ? 'current' : ''}
                ${index === selected ? 'selected' : 'unselected'}
              `}
                data-testid="carousel-item-button"
              >
                <IconAccount />
              </button>
              <h3 className="account-name">{account.name}</h3>
            </div>
          ))}
        </div>
      </div>
      <button
        name="next"
        type="button"
        className="next"
        data-testid="next"
        onClick={() => translateHandleClick(1)}
        disabled={currentSlide >= accounts.length - 1}
      >
        <IconNext className="next-icon" />
      </button>
    </div>
  )
}

export default Carousel
