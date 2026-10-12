import { render, screen } from '@testing-library/react'
import { Toolbar } from './Toolbar'

describe('Toolbar', () => {
  it('renders arbitrary content inside an accessible floating container', () => {
    render(
      <Toolbar ariaLabel="Editor controls">
        <button type="button">Custom action</button>
      </Toolbar>,
    )

    expect(screen.getByLabelText('Editor controls')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Custom action' }),
    ).toBeInTheDocument()
  })
})
