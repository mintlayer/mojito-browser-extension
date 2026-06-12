import { useContext } from 'react'
import { VerticalGroup } from '@LayoutComponents'
import { MintlayerContext } from '@Contexts'
import { StatisticsSkeleton } from './DashboardSkeleton'

import './Statistics.css'

const Statistics = ({ stats = [] }) => {
  const { balanceLoading } = useContext(MintlayerContext)

  return (
    <>
      <VerticalGroup smallGap>
        <div className="stats-list">
          {balanceLoading ? (
            <StatisticsSkeleton />
          ) : (
            <ul>
              {stats.map((stat) => (
                <li
                  key={stat.name}
                  className={`stat-item ${
                    parseFloat(stat.value) >= 0
                      ? 'stats-positive'
                      : 'stats-negative'
                  }`}
                >
                  <dt>
                    {parseFloat(stat.value) >= 0 ? '+' : '-'}
                    {Math.abs(parseFloat(stat.value))}
                    <span className="stat-unit"> {stat.unit}</span>
                  </dt>
                  <dd>{stat.name}</dd>
                </li>
              ))}
            </ul>
          )}
        </div>
      </VerticalGroup>
    </>
  )
}

export default Statistics
