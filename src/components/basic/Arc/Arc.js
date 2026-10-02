import { arc, pie, select } from 'd3'

const createArcGenerator = () =>
  arc().innerRadius(96).outerRadius(100).cornerRadius(3)

const createPieGenerator = () =>
  pie()
    .startAngle(-0.5 * Math.PI)
    .endAngle(0.5 * Math.PI)
    .value((item) => item.value)
    .padAngle(0.02)
    .sort((a, b) => b.value - a.value)

const buildArc = ({ container, pathData, arcGenerator }) => {
  select(container)
    .selectAll('path.arc-segment')
    .data(pathData)
    .join('path')
    .attr('class', 'arc-segment')
    .attr('d', arcGenerator)
    .attr('stroke', 'none')
    .attr('fill', (item) => item.data.color)
    .attr('data-testid', (item) => `arc-${item.data.asset}-container`)
}

export { createPieGenerator, createArcGenerator, buildArc }
