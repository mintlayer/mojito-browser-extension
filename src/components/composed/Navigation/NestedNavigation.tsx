import { ReactNode, useContext } from 'react'
import { useNavigate } from 'react-router'
import { ReactComponent as TriangleIcon } from '@Assets/images/icon-triangle.svg'

import { AccountContext } from '@Contexts'

import styles from './NestedNavigation.module.css'

interface NestedAction {
  id: number
  name: string
  link: string
}

interface NestedItem {
  id: number
  label: string
  icon?: ReactNode
  link?: string
  type?: string
  actions?: NestedAction[]
}

interface NavigationItem {
  id: number
  label: string
  icon?: ReactNode
  link?: string
  type?: string
  content: NestedItem[]
}

interface NestedNavigationProps {
  item: NavigationItem
  onNestedItemClick: (item: NestedItem) => void
  nestedItemID: number | null
}

const NestedNavigation = ({
  item,
  onNestedItemClick,
  nestedItemID,
}: NestedNavigationProps) => {
  const { sliderMenuOpen, setSliderMenuOpen } = useContext(AccountContext)
  const navigate = useNavigate()
  const toggleSliderMenu = () => {
    setSliderMenuOpen(!sliderMenuOpen)
  }
  return (
    <ul className={styles.nestedMenu}>
      {item.content.map((nestedItem) => (
        <li
          key={nestedItem.id}
          className={`${styles.nestedMenuItem} ${nestedItemID === nestedItem.id && styles.nestedMenuItemOpen}`}
        >
          <div
            className={styles.nestedLabelWrapper}
            onClick={() => {
              onNestedItemClick(nestedItem)
            }}
          >
            {nestedItem.icon && nestedItem.icon}
            {nestedItem.label}
          </div>
          <TriangleIcon
            className={`${styles.navigationTriangle} ${nestedItemID === nestedItem.id && styles.navigationTriangleOpen}`}
          />
          {nestedItem.type === 'menu' && nestedItemID === nestedItem.id && (
            <ul className={styles.nestedItemMenu}>
              {nestedItem.actions?.map((action) => (
                <li
                  key={action.id}
                  className={`${styles.nestedItemMenuItem} ${nestedItemID === nestedItem.id && styles.nestedItemMenuItem}`}
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
