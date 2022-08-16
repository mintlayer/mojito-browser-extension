import { Format } from '@Helpers'
import { VerticalGroup } from '@LayoutComponents'

import './Statistics.css'

const Statistics = ({ stats = [], highestBalance = 0 }) => {
  return (
    <>
      <VerticalGroup smallGap>
        <div className="highest-balance">
          <dl>
            <dt>{Format.fiatValue(highestBalance)}</dt>
            <dd>Highest Balance</dd>
          </dl>
        </div>
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
                    {Math.abs(parseFloat(stat.value))}%
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
