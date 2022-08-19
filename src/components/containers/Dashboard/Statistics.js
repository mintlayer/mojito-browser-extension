import { VerticalGroup } from '@LayoutComponents'

import './Statistics.css'

const Statistics = ({ stats = [], highestBalance }) => {
  return (
    <>
      <VerticalGroup smallGap>
        <div className="stats-list">
          <ul>
            {stats &&
              stats.map((stat) => (
                <li key={stat.name}>
                  <dt
                    className={
                      parseFloat(stat.value) >= 0 ? 'positive' : 'negative'
                    }
                  >
                    {parseFloat(stat.value) >= 0 ? '+' : '-'}{' '}
                    {Math.abs(parseFloat(stat.value))}{' '}
                    <span className="stat-unit">{stat.unit}</span>
                  </dt>
                  <dd>{stat.name}</dd>
                </li>
              ))}
          </ul>
        </div>
      </VerticalGroup>
    </>
  )
}

export default Statistics
