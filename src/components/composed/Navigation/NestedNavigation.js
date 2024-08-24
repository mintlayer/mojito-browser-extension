import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReactComponent as TriangleIcon } from '@Assets/images/icon-triangle.svg'

import { AccountContext } from '@Contexts'

import './NestedNavigation.css'

const NestedNavigation = ({ item, onNestedItemClick, nestedItemID }) => {
  const { sliderMenuOpen, setSliderMenuOpen } = useContext(AccountContext)
  const navigate = useNavigate()
  const toggleSliderMenu = () => {
    setSliderMenuOpen(!sliderMenuOpen)
  }
  return (
    <ul className="nested-menu">
      {item.content.map((nestedItem) => (
        <li
          key={nestedItem.id}
          className={`nested-menu-item ${nestedItemID === nestedItem.id && 'nested-menu-item-open'}`}
        >
          <div
            className="nested-label-wrapper"
            onClick={() => {
              onNestedItemClick(nestedItem)
            }}
          >
            {nestedItem.icon && nestedItem.icon}
            {nestedItem.label}
          </div>
          <TriangleIcon
            className={`navigation-triangle ${nestedItemID === nestedItem.id && 'navigation-triangle-open'}`}
          />
          {nestedItem.type === 'menu' && nestedItemID === nestedItem.id && (
            <ul className="nested-item-menu">
              {nestedItem.actions.map((action) => (
                <li
                  key={action.id}
                  className={`nested-item-menu-item ${nestedItemID === nestedItem.id && 'nested-item-menu-item-open'}`}
                  onClick={() => {
                    navigate(action.link)
                    toggleSliderMenu()
                  }}
                >
                  {action.name}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

export default NestedNavigation
