import { fireEvent, render, screen } from '@testing-library/react'
import { NoteCanvas } from './NoteCanvas'
import { useNoteStore } from '../noteStore'

describe('NoteCanvas', () => {
  beforeEach(() => {
    useNoteStore.setState({ notesById: {}, noteIds: [] })
  })

  it('renders an accessible empty canvas', () => {
    render(<NoteCanvas />)

    expect(
      screen.getByRole('region', { name: 'Sticky notes canvas' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Your canvas is ready')).toBeInTheDocument()
  })

  it('renders notes from the ID slice instead of the empty state', () => {
    useNoteStore.getState().createNote({
      content: '',
      position: [40, 30],
      dimensions: [220, 220],
      background: 'green',
    })

    render(<NoteCanvas />)

    expect(screen.getByRole('article', { name: 'Sticky note' })).toHaveClass(
      'note--green',
    )
    expect(screen.queryByText('Your canvas is ready')).not.toBeInTheDocument()
  })

  it('does not create a note when the empty canvas is clicked', () => {
    render(<NoteCanvas />)
    const canvas = screen.getByRole('region', { name: 'Sticky notes canvas' })
    fireEvent.click(canvas)

    expect(useNoteStore.getState().noteIds).toHaveLength(0)
  })
})
