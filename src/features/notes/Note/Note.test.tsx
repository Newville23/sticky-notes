import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NoteId } from '../../../domain'
import { useNoteStore } from '../noteStore'
import { Note } from './Note'

describe('Note', () => {
  let noteId: NoteId

  beforeEach(() => {
    useNoteStore.setState({ notesById: {}, noteIds: [] })
    noteId = useNoteStore.getState().createNote({
      content: '',
      position: [100, 100],
      dimensions: [160, 160],
      background: 'yellow',
    })
  })

  it('focuses its editor when mounted', () => {
    render(<Note id={noteId} />)

    expect(screen.getByRole('textbox', { name: 'Note content' })).toHaveFocus()
  })

  it('keeps typing local and commits content once on blur', async () => {
    const user = userEvent.setup()
    const onStoreChange = vi.fn()
    const unsubscribe = useNoteStore.subscribe(onStoreChange)

    render(<Note id={noteId} />)
    const editor = screen.getByRole('textbox', { name: 'Note content' })

    await user.type(editor, 'A local draft')

    expect(editor).toHaveValue('A local draft')
    expect(useNoteStore.getState().notesById[noteId].content).toBe('')
    expect(onStoreChange).not.toHaveBeenCalled()

    fireEvent.blur(editor)

    expect(useNoteStore.getState().notesById[noteId].content).toBe(
      'A local draft',
    )
    expect(onStoreChange).toHaveBeenCalledOnce()

    unsubscribe()
  })

  it('does not start a parent pointer interaction from the editor', () => {
    const onPointerDown = vi.fn()

    render(
      <div onPointerDown={onPointerDown}>
        <Note id={noteId} />
      </div>,
    )

    fireEvent.pointerDown(screen.getByRole('textbox', { name: 'Note content' }))

    expect(onPointerDown).not.toHaveBeenCalled()
  })
})
