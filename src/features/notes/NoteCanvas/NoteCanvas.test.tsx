import { render, screen } from '@testing-library/react'
import { NoteCanvas } from './NoteCanvas'

describe('NoteCanvas', () => {
  it('renders an accessible empty canvas', () => {
    render(<NoteCanvas />)

    expect(
      screen.getByRole('region', { name: 'Sticky notes canvas' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Your canvas is ready')).toBeInTheDocument()
  })

  it('renders supplied canvas content instead of the empty state', () => {
    render(
      <NoteCanvas>
        <article>Note content</article>
      </NoteCanvas>,
    )

    expect(screen.getByText('Note content')).toBeInTheDocument()
    expect(screen.queryByText('Your canvas is ready')).not.toBeInTheDocument()
  })
})
