import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MAX_NOTE_CONTENT_LENGTH, type NoteId } from '../../../domain'
import { DeleteZone } from '../DeleteZone'
import { useNoteStore } from '../noteStore'
import { Note } from './Note'

describe('Note', () => {
  let noteId: NoteId

  beforeEach(() => {
    useNoteStore.setState({ notesById: {}, noteIds: [], undoBuffer: [] })
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

  it('resizes through the DOM and commits dimensions once on pointer release', () => {
    const { container } = render(
      <section className="note-canvas">
        <Note id={noteId} />
      </section>,
    )
    const canvas = container.querySelector<HTMLElement>('.note-canvas')
    const note = screen.getByRole('article', { name: 'Sticky note' })
    const resizeHandle = container.querySelector<HTMLElement>(
      '[data-note-resize-handle]',
    )

    if (!canvas || !resizeHandle) {
      throw new Error('Expected canvas and resize handle elements')
    }

    resizeHandle.setPointerCapture = vi.fn()
    resizeHandle.releasePointerCapture = vi.fn()
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

    fireEvent.pointerDown(resizeHandle, {
      button: 0,
      pointerId: 9,
      clientX: 260,
      clientY: 260,
    })
    fireEvent.pointerMove(resizeHandle, {
      pointerId: 9,
      clientX: 320,
      clientY: 300,
    })

    expect(note.style.width).toBe('220px')
    expect(note.style.height).toBe('200px')
    expect(useNoteStore.getState()).toBe(beforeMove)
    expect(onStoreChange).not.toHaveBeenCalled()

    fireEvent.pointerUp(resizeHandle, { pointerId: 9 })

    expect(useNoteStore.getState().notesById[noteId].dimensions).toEqual([
      220, 200,
    ])
    expect(onStoreChange).toHaveBeenCalledOnce()
    expect(note.style.width).toBe('')
    expect(note.style.height).toBe('')
    expect(resizeHandle.releasePointerCapture).toHaveBeenCalledWith(9)

    unsubscribe()
  })

  it('restores persisted dimensions when resizing is cancelled', () => {
    const { container } = render(
      <section className="note-canvas">
        <Note id={noteId} />
      </section>,
    )
    const canvas = container.querySelector<HTMLElement>('.note-canvas')
    const note = screen.getByRole('article', { name: 'Sticky note' })
    const resizeHandle = container.querySelector<HTMLElement>(
      '[data-note-resize-handle]',
    )

    if (!canvas || !resizeHandle) {
      throw new Error('Expected canvas and resize handle elements')
    }

    resizeHandle.setPointerCapture = vi.fn()
    resizeHandle.releasePointerCapture = vi.fn()
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

    const beforeResize = useNoteStore.getState()

    fireEvent.pointerDown(resizeHandle, {
      button: 0,
      pointerId: 9,
      clientX: 260,
      clientY: 260,
    })
    fireEvent.pointerMove(resizeHandle, {
      pointerId: 9,
      clientX: 320,
      clientY: 300,
    })
    fireEvent.pointerCancel(resizeHandle, { pointerId: 9 })

    expect(useNoteStore.getState()).toBe(beforeResize)
    expect(note.style.width).toBe('')
    expect(note.style.height).toBe('')
    expect(resizeHandle.releasePointerCapture).toHaveBeenCalledWith(9)
  })

  it('deletes the note only when dragging ends inside the delete zone', () => {
    const { container } = render(
      <section className="note-canvas">
        <Note id={noteId} />
        <DeleteZone />
      </section>,
    )
    const canvas = container.querySelector<HTMLElement>('.note-canvas')
    const note = screen.getByRole('article', { name: 'Sticky note' })
    const dragSurface = container.querySelector<HTMLElement>(
      '[data-note-drag-surface]',
    )
    const deleteZone =
      container.querySelector<HTMLElement>('[data-delete-zone]')

    if (!canvas || !dragSurface || !deleteZone) {
      throw new Error('Expected canvas, drag surface and delete zone elements')
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
    vi.spyOn(deleteZone, 'getBoundingClientRect').mockReturnValue({
      x: 200,
      y: 300,
      top: 300,
      right: 400,
      bottom: 360,
      left: 200,
      width: 200,
      height: 60,
      toJSON: () => ({}),
    })

    fireEvent.pointerDown(dragSurface, {
      button: 0,
      pointerId: 5,
      clientX: 120,
      clientY: 120,
    })

    expect(deleteZone).toHaveClass('delete-zone--visible')
    expect(deleteZone).toHaveAttribute('aria-hidden', 'false')

    fireEvent.pointerMove(dragSurface, {
      pointerId: 5,
      clientX: 250,
      clientY: 320,
    })

    expect(deleteZone).toHaveClass('delete-zone--active')
    expect(useNoteStore.getState().notesById[noteId]).toBeDefined()

    fireEvent.pointerUp(dragSurface, {
      pointerId: 5,
      clientX: 250,
      clientY: 320,
    })

    expect(useNoteStore.getState().notesById[noteId]).toBeUndefined()
    expect(useNoteStore.getState().noteIds).not.toContain(noteId)
    expect(deleteZone).not.toHaveClass(
      'delete-zone--visible',
      'delete-zone--active',
    )
    expect(deleteZone).toHaveAttribute('aria-hidden', 'true')
    expect(deleteZone.getBoundingClientRect).toHaveBeenCalledOnce()
    expect(dragSurface.releasePointerCapture).toHaveBeenCalledWith(5)
  })
})
