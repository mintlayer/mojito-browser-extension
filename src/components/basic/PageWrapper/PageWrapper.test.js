import { render, screen } from '@testing-library/react'
import PageWrapper from './PageWrapper'

describe('PageWrapper', () => {
  it('renders children inside a section element', () => {
    render(
      <PageWrapper>
        <p>Hello</p>
      </PageWrapper>,
    )

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hello').closest('section')).toBeInTheDocument()
  })

  it('applies inline style', () => {
    const { container } = render(
      <PageWrapper style={{ backgroundColor: 'red' }}>
        <p>Styled</p>
      </PageWrapper>,
    )

    const section = container.querySelector('section')
    expect(section.style.backgroundColor).toBe('red')
  })

  it('appends custom className alongside default', () => {
    const { container } = render(
      <PageWrapper className="custom-class">
        <p>Classed</p>
      </PageWrapper>,
    )

    const section = container.querySelector('section')
    expect(section.className).toContain('custom-class')
    expect(section.className).toContain('wrapper')
  })

  it('handles no className without extra spaces', () => {
    const { container } = render(
      <PageWrapper>
        <p>Plain</p>
      </PageWrapper>,
    )

    const section = container.querySelector('section')
    expect(section.className).not.toContain('undefined')
    expect(section.className).not.toContain('null')
  })

  it('handles empty string className', () => {
    const { container } = render(
      <PageWrapper className="">
        <p>Empty</p>
      </PageWrapper>,
    )

    const section = container.querySelector('section')
    expect(section.className).not.toContain('  ')
  })
})
