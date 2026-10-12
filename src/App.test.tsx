import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('renders the canvas with the default note configuration', () => {
    render(<App />)

    expect(
      screen.getByRole('region', { name: 'Sticky notes canvas' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'S note size' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('button', { name: 'yellow note background' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates the selected size and background', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'L note size' }))
    await user.click(
      screen.getByRole('button', { name: 'green note background' }),
    )

    expect(screen.getByRole('button', { name: 'L note size' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('button', { name: 'green note background' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
