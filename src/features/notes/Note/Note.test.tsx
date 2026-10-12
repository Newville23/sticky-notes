import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MAX_NOTE_CONTENT_LENGTH, type NoteId } from '../../../domain'
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
    expect(
      screen.getByRole('textbox', { name: 'Note content' }),
    ).toHaveAttribute('maxlength', String(MAX_NOTE_CONTENT_LENGTH))
  })

  it('rejects null characters and restores the persisted content on blur', () => {
    useNoteStore.getState().updateNote(noteId, { content: 'Safe content' })

    render(<Note id={noteId} />)
    const editor = screen.getByRole('textbox', { name: 'Note content' })

    fireEvent.change(editor, { target: { value: 'unsafe\0content' } })
    fireEvent.blur(editor)

    expect(editor).toHaveValue('Safe content')
    expect(useNoteStore.getState().notesById[noteId].content).toBe(
      'Safe content',
    )
  })

  it('renders HTML-like content as a literal textarea value', () => {
    const content = '<img src=x onerror=alert(1)>'
    useNoteStore.getState().updateNote(noteId, { content })

    const { container } = render(<Note id={noteId} />)

    expect(screen.getByRole('textbox', { name: 'Note content' })).toHaveValue(
      content,
    )
    expect(container.querySelector('img')).not.toBeInTheDocument()
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

  it('routes pointer interaction only through the drag surface', () => {
    const onPointerDown = vi.fn()

    const { container } = render(
      <div onPointerDown={onPointerDown}>
        <Note id={noteId} />
      </div>,
    )

    fireEvent.pointerDown(screen.getByRole('textbox', { name: 'Note content' }))

    expect(onPointerDown).not.toHaveBeenCalled()

    const dragSurface = container.querySelector('[data-note-drag-surface]')

    if (!dragSurface) {
      throw new Error('Expected the note drag surface')
    }

    fireEvent.pointerDown(dragSurface)

    expect(onPointerDown).toHaveBeenCalledOnce()
  })

  it('moves through the DOM without writing to the note store', () => {
    const { container } = render(
      <section className="note-canvas">
        <Note id={noteId} />
      </section>,
    )
    const canvas = container.querySelector<HTMLElement>('.note-canvas')
    const note = screen.getByRole('article', { name: 'Sticky note' })
    const dragSurface = container.querySelector<HTMLElement>(
      '[data-note-drag-surface]',
    )

    if (!canvas || !dragSurface) {
      throw new Error('Expected canvas and drag surface elements')
    }

    dragSurface.setPointerCapture = vi.fn()
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 100,
      top: 100,
      right: 260,
      bottom: 260,
      left: 100,
      width: 160,
      height: 160,
      toJSON: () => ({}),
    })
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 600,
      bottom: 400,
      left: 0,
      width: 600,
      height: 400,
      toJSON: () => ({}),
    })

    const beforeMove = useNoteStore.getState()
    const onStoreChange = vi.fn()
    const unsubscribe = useNoteStore.subscribe(onStoreChange)

    fireEvent.pointerDown(dragSurface, {
      button: 0,
      pointerId: 5,
      clientX: 120,
      clientY: 120,
    })
    fireEvent.pointerMove(dragSurface, {
      pointerId: 5,
      clientX: 200,
      clientY: 180,
    })

    expect(note.style.transform).toBe('translate3d(180px, 160px, 0)')
    expect(useNoteStore.getState()).toBe(beforeMove)
    expect(onStoreChange).not.toHaveBeenCalled()

    unsubscribe()
  })

  it('starts the next drag from the position committed by the previous drag', () => {
    const { container } = render(
      <section className="note-canvas">
        <Note id={noteId} />
      </section>,
    )
    const canvas = container.querySelector<HTMLElement>('.note-canvas')
    const note = screen.getByRole('article', { name: 'Sticky note' })
    const dragSurface = container.querySelector<HTMLElement>(
      '[data-note-drag-surface]',
    )

    if (!canvas || !dragSurface) {
      throw new Error('Expected canvas and drag surface elements')
    }

    dragSurface.setPointerCapture = vi.fn()
    dragSurface.releasePointerCapture = vi.fn()
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 100,
      top: 100,
      right: 260,
      bottom: 260,
      left: 100,
      width: 160,
      height: 160,
      toJSON: () => ({}),
    })
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 600,
      bottom: 400,
      left: 0,
      width: 600,
      height: 400,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(dragSurface, {
      button: 0,
      pointerId: 5,
      clientX: 120,
      clientY: 120,
    })
    fireEvent.pointerMove(dragSurface, {
      pointerId: 5,
      clientX: 200,
      clientY: 180,
    })
    fireEvent.pointerUp(dragSurface, { pointerId: 5 })

    expect(useNoteStore.getState().notesById[noteId].position).toEqual([
      180, 160,
    ])
    expect(note.style.transform).toBe('')

    fireEvent.pointerDown(dragSurface, {
      button: 0,
      pointerId: 6,
      clientX: 200,
      clientY: 180,
    })
    fireEvent.pointerMove(dragSurface, {
      pointerId: 6,
      clientX: 220,
      clientY: 200,
    })

    expect(note.style.transform).toBe('translate3d(200px, 180px, 0)')

    fireEvent.pointerUp(dragSurface, { pointerId: 6 })

    expect(useNoteStore.getState().notesById[noteId].position).toEqual([
      200, 180,
    ])
  })

  it('restores the persisted position and writes nothing when dragging is cancelled', () => {
    const { container } = render(
      <section className="note-canvas">
        <Note id={noteId} />
      </section>,
    )
    const canvas = container.querySelector<HTMLElement>('.note-canvas')
    const note = screen.getByRole('article', { name: 'Sticky note' })
    const dragSurface = container.querySelector<HTMLElement>(
      '[data-note-drag-surface]',
    )

    if (!canvas || !dragSurface) {
      throw new Error('Expected canvas and drag surface elements')
    }

    dragSurface.setPointerCapture = vi.fn()
    dragSurface.releasePointerCapture = vi.fn()
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 100,
      top: 100,
      right: 260,
      bottom: 260,
      left: 100,
      width: 160,
      height: 160,
      toJSON: () => ({}),
    })
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 600,
      bottom: 400,
      left: 0,
      width: 600,
      height: 400,
      toJSON: () => ({}),
    })

    const beforeDrag = useNoteStore.getState()
    const onStoreChange = vi.fn()
    const unsubscribe = useNoteStore.subscribe(onStoreChange)

    fireEvent.pointerDown(dragSurface, {
      button: 0,
      pointerId: 5,
      clientX: 120,
      clientY: 120,
    })
    fireEvent.pointerMove(dragSurface, {
      pointerId: 5,
      clientX: 200,
      clientY: 180,
    })
    fireEvent.pointerCancel(dragSurface, { pointerId: 5 })

    expect(note.style.transform).toBe('')
    expect(useNoteStore.getState()).toBe(beforeDrag)
    expect(onStoreChange).not.toHaveBeenCalled()
    expect(dragSurface.releasePointerCapture).toHaveBeenCalledWith(5)

    unsubscribe()
  })
})
