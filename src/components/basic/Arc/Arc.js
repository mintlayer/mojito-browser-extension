import * as d3 from 'd3'

const createArcGenerator = () =>
  d3.arc().innerRadius(96).outerRadius(100).cornerRadius(3)

const createPieGenerator = () =>
  d3
    .pie()
    .startAngle(-0.5 * Math.PI)
    .endAngle(0.5 * Math.PI)
    .value((item) => item.value)
    .padAngle(0.02)
    .sort((a, b) => b.value - a.value)

const buildArc = ({ container, pathData, arcGenerator }) => {
  d3.select(container)
    .selectAll('path')
    .data(pathData)
    .join('path')
    .attr('d', arcGenerator)
    .attr('stroke', 'none')
    .attr('fill', (item) => item.data.color)
    .attr('data-testid', (item) => `arc-${item.data.asset}-container`)
}

export { createPieGenerator, createArcGenerator, buildArc }
