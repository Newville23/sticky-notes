import { createRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { DELETE_UNDO_WINDOW_MS } from '../../../domain'
import { useNoteStore } from '../noteStore'
import { DeleteZone } from './DeleteZone'

function createNote(content: string) {
  return useNoteStore.getState().createNote({
    content,
    position: [40, 60],
    dimensions: [160, 160],
    background: 'yellow',
  })
}

describe('DeleteZone', () => {
  beforeEach(() => {
    useNoteStore.setState({
      notesById: {},
      noteIds: [],
      undoBuffer: [],
      nextDeletionNumber: 1,
    })
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

  it('restores a deleted note through its numbered toast', () => {
    const noteId = createNote('Restore me')
    const deletedNote = useNoteStore.getState().notesById[noteId]

    useNoteStore.getState().deleteNote(noteId)
    render(<DeleteZone />)

    fireEvent.click(screen.getByRole('button', { name: 'Undo delete (1)' }))

    expect(useNoteStore.getState().notesById[noteId]).toBe(deletedNote)
    expect(useNoteStore.getState().noteIds).toEqual([noteId])
    expect(useNoteStore.getState().undoBuffer).toHaveLength(0)
    expect(
      screen.queryByRole('button', { name: 'Undo delete (1)' }),
    ).not.toBeInTheDocument()
  })

  it('renders a predictable stack and restores only the selected deletion', () => {
    const firstId = createNote('First')
    const secondId = createNote('Second')

    useNoteStore.getState().deleteNote(firstId)
    useNoteStore.getState().deleteNote(secondId)
    render(<DeleteZone />)

    expect(
      screen
        .getAllByRole('button', { name: /Undo delete/ })
        .map((button) => button.textContent),
    ).toEqual(['Undo delete (1)', 'Undo delete (2)'])

    fireEvent.click(screen.getByRole('button', { name: 'Undo delete (1)' }))

    expect(useNoteStore.getState().notesById[firstId]).toBeDefined()
    expect(useNoteStore.getState().notesById[secondId]).toBeUndefined()
    expect(
      useNoteStore
        .getState()
        .undoBuffer.map(({ deletionNumber }) => deletionNumber),
    ).toEqual([2])
    expect(
      screen.queryByRole('button', { name: 'Undo delete (1)' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Undo delete (2)' }),
    ).toBeInTheDocument()
  })

  it('expires and cleans up each deletion independently', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    try {
      const firstId = createNote('First')
      const secondId = createNote('Second')

      useNoteStore.getState().deleteNote(firstId)
      act(() => vi.advanceTimersByTime(1_000))
      useNoteStore.getState().deleteNote(secondId)
      render(<DeleteZone />)

      act(() => vi.advanceTimersByTime(DELETE_UNDO_WINDOW_MS - 1_001))
      expect(useNoteStore.getState().undoBuffer).toHaveLength(2)

      act(() => vi.advanceTimersByTime(1))

      expect(
        useNoteStore
          .getState()
          .undoBuffer.map(({ deletionNumber }) => deletionNumber),
      ).toEqual([2])
      expect(
        screen.queryByRole('button', { name: 'Undo delete (1)' }),
      ).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Undo delete (2)' }),
      ).toBeInTheDocument()

      act(() => vi.advanceTimersByTime(1_000))

      expect(useNoteStore.getState().undoBuffer).toHaveLength(0)
      expect(
        screen.queryByRole('button', { name: 'Undo delete (2)' }),
      ).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('announces new undo notifications politely without moving focus', () => {
    render(
      <>
        <button type="button">Keep focus</button>
        <DeleteZone />
      </>,
    )
    const focusTarget = screen.getByRole('button', { name: 'Keep focus' })
    focusTarget.focus()
    const noteId = createNote('Announce me')

    act(() => useNoteStore.getState().deleteNote(noteId))

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Note deleted. Undo delete (1) is available for 5 seconds.',
    )
    expect(focusTarget).toHaveFocus()
  })

  it('clears pending expiry timers when the toast stack unmounts', () => {
    vi.useFakeTimers()

    try {
      const noteId = createNote('Temporary snapshot')
      useNoteStore.getState().deleteNote(noteId)
      const { unmount } = render(<DeleteZone />)

      expect(vi.getTimerCount()).toBe(1)

      unmount()

      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
