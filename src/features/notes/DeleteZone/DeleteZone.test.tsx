import { createRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { DELETE_UNDO_WINDOW_MS } from '../../../domain'
import { useNoteStore } from '../noteStore'
import { DeleteZone } from './DeleteZone'

describe('DeleteZone', () => {
  beforeEach(() => {
    useNoteStore.setState({ notesById: {}, noteIds: [], undoBuffer: [] })
  })

  it('renders hidden by default with deletion guidance', () => {
    const { container } = render(<DeleteZone />)
    const deleteZone = container.querySelector('[data-delete-zone]')

    expect(deleteZone).toHaveClass('delete-zone')
    expect(deleteZone).not.toHaveClass('delete-zone--visible')
    expect(deleteZone).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Drop here to delete')).toBeInTheDocument()
  })

  it('exposes its element through a ref for interaction orchestration', () => {
    const ref = createRef<HTMLDivElement>()

    render(<DeleteZone ref={ref} />)

    expect(ref.current).toHaveAttribute('data-delete-zone')
  })

  it('restores the latest deleted note through the undo button', () => {
    const noteId = useNoteStore.getState().createNote({
      content: 'Restore me',
      position: [40, 60],
      dimensions: [220, 220],
      background: 'green',
    })
    const deletedNote = useNoteStore.getState().notesById[noteId]

    useNoteStore.getState().deleteNote(noteId)
    render(<DeleteZone />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Undo last note deletion' }),
    )

    expect(useNoteStore.getState().notesById[noteId]).toBe(deletedNote)
    expect(useNoteStore.getState().noteIds).toEqual([noteId])
    expect(useNoteStore.getState().undoBuffer).toHaveLength(0)
    expect(
      screen.queryByRole('button', { name: 'Undo last note deletion' }),
    ).not.toBeInTheDocument()
  })

  it('keeps older deletions available after undoing the latest one', () => {
    const firstId = useNoteStore.getState().createNote({
      content: 'First',
      position: [40, 60],
      dimensions: [160, 160],
      background: 'yellow',
    })
    const secondId = useNoteStore.getState().createNote({
      content: 'Second',
      position: [80, 100],
      dimensions: [220, 220],
      background: 'red',
    })

    useNoteStore.getState().deleteNote(firstId)
    useNoteStore.getState().deleteNote(secondId)
    render(<DeleteZone />)

    expect(
      screen.getByRole('button', { name: 'Undo last note deletion' }),
    ).toHaveTextContent('Undo delete (2)')

    fireEvent.click(
      screen.getByRole('button', { name: 'Undo last note deletion' }),
    )

    expect(useNoteStore.getState().notesById[secondId]).toBeDefined()
    expect(useNoteStore.getState().notesById[firstId]).toBeUndefined()
    expect(useNoteStore.getState().undoBuffer).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Undo last note deletion' }),
    ).toHaveTextContent('Undo delete')
  })

  it('discards a deleted snapshot when its recovery window expires', () => {
    vi.useFakeTimers()

    try {
      const noteId = useNoteStore.getState().createNote({
        content: 'Temporary snapshot',
        position: [40, 60],
        dimensions: [160, 160],
        background: 'yellow',
      })

      useNoteStore.getState().deleteNote(noteId)
      render(<DeleteZone />)

      act(() => vi.advanceTimersByTime(DELETE_UNDO_WINDOW_MS - 1))

      expect(useNoteStore.getState().undoBuffer).toHaveLength(1)

      act(() => vi.advanceTimersByTime(1))

      expect(useNoteStore.getState().undoBuffer).toHaveLength(0)
      expect(
        screen.queryByRole('button', { name: 'Undo last note deletion' }),
      ).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
