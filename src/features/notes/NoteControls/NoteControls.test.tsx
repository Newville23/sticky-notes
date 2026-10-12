import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NoteControls } from './NoteControls'

describe('NoteControls', () => {
  it('renders the selected size and background', () => {
    render(<NoteControls onConfigurationChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'S note size' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('button', { name: 'yellow note background' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps selection state local and reports the complete configuration', async () => {
    const user = userEvent.setup()
    const onConfigurationChange = vi.fn()

    render(<NoteControls onConfigurationChange={onConfigurationChange} />)

    await user.click(screen.getByRole('button', { name: 'XL note size' }))
    await user.click(
      screen.getByRole('button', { name: 'red note background' }),
    )

    expect(onConfigurationChange).toHaveBeenNthCalledWith(1, {
      size: 'XL',
      background: 'yellow',
    })
    expect(onConfigurationChange).toHaveBeenNthCalledWith(2, {
      size: 'XL',
      background: 'red',
    })
    expect(
      screen.getByRole('button', { name: 'XL note size' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'red note background' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
