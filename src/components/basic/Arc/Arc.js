import * as d3 from 'd3'

const createArcGenerator = () => d3.arc().innerRadius(94).outerRadius(100)

const createPieGenerator = () =>
  d3
    .pie()
    .startAngle(-0.5 * Math.PI)
    .endAngle(0.5 * Math.PI)
    .value((item) => item.value)

const createTooltip = () =>
  d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .attr('data-testid', 'tooltip-container')
    .style('opacity', 0)

const mouseMoveHandle = (tooltip, ev) => {
  tooltip.style('left', `${ev.pageX}px`).style('top', `${ev.pageY - 35}px`)
}

const mouseOverHandle = (tooltip, _, item) => {
  tooltip
    .attr('data-show', 'true')
    .transition()
    .duration(200)
    .style('opacity', 0.9)

  tooltip.html(`${item.data.asset} <br />${item.data.value} ${item.data.valueSymbol} `)
}

const mouseOutHandle = (tooltip) => {
  tooltip
    .attr('data-show', 'false')
    .transition()
    .duration(500)
    .style('opacity', 0)
}

const buildArc = ({
  container,
  pathData,
  arcGenerator,
  tooltip,
  mouseMoveFn = mouseMoveHandle,
  mouseOverFn = mouseOverHandle,
  mouseOutFn = mouseOutHandle,
}) => {
  const mouseMoveHandleBinded = mouseMoveFn.bind(null, tooltip)
  const mouseOverHandleBinded = mouseOverFn.bind(null, tooltip)
  const mouseOutHandleBinded = mouseOutFn.bind(null, tooltip)

  d3.select(container)
    .selectAll('path')
    .data(pathData)
    .join('path')
    .attr('d', arcGenerator)
    .attr('stroke', '#fff')
    .attr('fill', (item) => item.data.color)
    .attr('data-testid', (item) => `arc-${item.data.asset}-container`)
    .on('mouseover', mouseMoveHandleBinded)
    .on('mousemove', mouseOverHandleBinded)
    .on('mouseout', mouseOutHandleBinded)
}

export {
  createPieGenerator,
  createArcGenerator,
  createTooltip,
  buildArc,
  mouseMoveHandle,
  mouseOverHandle,
  mouseOutHandle,
}
