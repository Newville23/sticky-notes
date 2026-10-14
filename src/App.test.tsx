import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useNoteStore } from './features/notes/noteStore'

describe('App', () => {
  beforeEach(() => {
    useNoteStore.setState({
      notesById: {},
      noteIds: [],
      undoBuffer: [],
      nextDeletionNumber: 1,
    })
  })

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

  it('creates cascading notes with the selected configuration', async () => {
    const user = userEvent.setup()
    render(<App />)
    const canvas = screen.getByRole('region', {
      name: 'Sticky notes canvas',
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

    await user.click(screen.getByRole('button', { name: 'Add note' }))

    const state = useNoteStore.getState()
    const firstNote = state.notesById[state.noteIds[0]]

    expect(firstNote.dimensions).toEqual([300, 300])
    expect(firstNote.background).toBe('green')
    expect(firstNote.position).toEqual([150, 50])
    expect(screen.getByRole('textbox', { name: 'Note content' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Add note' }))

    const nextState = useNoteStore.getState()
    const secondNote = nextState.notesById[nextState.noteIds[1]]

    expect(nextState.noteIds).toHaveLength(2)
    expect(nextState.notesById[nextState.noteIds[0]]).toBe(firstNote)
    expect(secondNote.dimensions).toEqual([300, 300])
    expect(secondNote.background).toBe('green')
    expect(secondNote.position).toEqual([174, 74])
    expect(
      screen.getAllByRole('textbox', { name: 'Note content' })[1],
    ).toHaveFocus()
  })

  it('continues the cascade when the selected note size increases', async () => {
    const user = userEvent.setup()
    render(<App />)
    const canvas = screen.getByRole('region', {
      name: 'Sticky notes canvas',
    })
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 1_024,
      bottom: 768,
      left: 0,
      width: 1_024,
      height: 768,
      toJSON: () => ({}),
    })

    await user.click(screen.getByRole('button', { name: 'Add note' }))
    await user.click(screen.getByRole('button', { name: 'XL note size' }))
    await user.click(screen.getByRole('button', { name: 'Add note' }))

    const state = useNoteStore.getState()
    const firstNote = state.notesById[state.noteIds[0]]
    const secondNote = state.notesById[state.noteIds[1]]

    expect(firstNote.position).toEqual([432, 304])
    expect(secondNote.position).toEqual([456, 328])
    expect(secondNote.dimensions).toEqual([380, 380])
  })

  it('creates exactly one cursor-centered note with the active configuration', async () => {
    const user = userEvent.setup()
    render(<App />)
    const canvas = screen.getByRole('region', {
      name: 'Sticky notes canvas',
    })
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 50,
      top: 50,
      right: 700,
      bottom: 450,
      left: 100,
      width: 600,
      height: 400,
      toJSON: () => ({}),
    })

    await user.click(screen.getByRole('button', { name: 'L note size' }))
    await user.click(
      screen.getByRole('button', { name: 'red note background' }),
    )
    fireEvent.doubleClick(canvas, {
      button: 0,
      clientX: 350,
      clientY: 250,
    })

    const state = useNoteStore.getState()
    const note = state.notesById[state.noteIds[0]]

    expect(state.noteIds).toHaveLength(1)
    expect(note).toMatchObject({
      position: [100, 50],
      dimensions: [300, 300],
      background: 'red',
    })
    expect(screen.getByRole('textbox', { name: 'Note content' })).toHaveFocus()
  })

  it('clamps direct placement at the canvas edges', () => {
    render(<App />)
    const canvas = screen.getByRole('region', {
      name: 'Sticky notes canvas',
    })
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 50,
      top: 50,
      right: 700,
      bottom: 450,
      left: 100,
      width: 600,
      height: 400,
      toJSON: () => ({}),
    })

    fireEvent.doubleClick(canvas, {
      button: 0,
      clientX: 105,
      clientY: 55,
    })
    fireEvent.doubleClick(canvas, {
      button: 0,
      clientX: 695,
      clientY: 445,
    })

    const state = useNoteStore.getState()
    expect(state.notesById[state.noteIds[0]].position).toEqual([0, 0])
    expect(state.notesById[state.noteIds[1]].position).toEqual([440, 240])
  })

  it('ignores single clicks, non-primary double-clicks and interactive children', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const canvas = screen.getByRole('region', {
      name: 'Sticky notes canvas',
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

    fireEvent.click(canvas, { button: 0, clientX: 300, clientY: 200 })
    fireEvent.doubleClick(canvas, {
      button: 2,
      clientX: 300,
      clientY: 200,
    })
    expect(useNoteStore.getState().noteIds).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Add note' }))
    const note = screen.getByRole('article', { name: 'Sticky note' })
    const editor = screen.getByRole('textbox', { name: 'Note content' })
    const resizeHandle = container.querySelector('[data-note-resize-handle]')
    const deleteZone = container.querySelector('[data-delete-zone]')

    if (!resizeHandle || !deleteZone) {
      throw new Error('Expected interactive canvas children')
    }

    fireEvent.doubleClick(note)
    fireEvent.doubleClick(editor)
    fireEvent.doubleClick(resizeHandle)
    fireEvent.doubleClick(deleteZone)
    fireEvent.doubleClick(screen.getByRole('button', { name: 'S note size' }))

    expect(useNoteStore.getState().noteIds).toHaveLength(1)
  })

  it('keeps direct placement independent from the toolbar cascade', async () => {
    const user = userEvent.setup()
    render(<App />)
    const canvas = screen.getByRole('region', {
      name: 'Sticky notes canvas',
    })
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 1_024,
      bottom: 768,
      left: 0,
      width: 1_024,
      height: 768,
      toJSON: () => ({}),
    })

    await user.click(screen.getByRole('button', { name: 'Add note' }))
    fireEvent.doubleClick(canvas, {
      button: 0,
      clientX: 512,
      clientY: 384,
    })
    await user.click(screen.getByRole('button', { name: 'Add note' }))

    const state = useNoteStore.getState()
    expect(state.noteIds).toHaveLength(3)
    expect(state.notesById[state.noteIds[0]].position).toEqual([432, 304])
    expect(state.notesById[state.noteIds[1]].position).toEqual([432, 304])
    expect(state.notesById[state.noteIds[2]].position).toEqual([456, 328])
  })

  it('ignores canvas double-click creation during an active pointer interaction', async () => {
    const user = userEvent.setup()
    const { container } = render(<App />)
    const canvas = screen.getByRole('region', {
      name: 'Sticky notes canvas',
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
    await user.click(screen.getByRole('button', { name: 'Add note' }))

    const resizeHandle = container.querySelector<HTMLElement>(
      '[data-note-resize-handle]',
    )

    if (!resizeHandle) {
      throw new Error('Expected resize handle')
    }

    resizeHandle.setPointerCapture = vi.fn()
    resizeHandle.releasePointerCapture = vi.fn()
    fireEvent.pointerDown(resizeHandle, {
      button: 0,
      pointerId: 9,
      clientX: 380,
      clientY: 280,
    })
    fireEvent.doubleClick(canvas, {
      button: 0,
      clientX: 100,
      clientY: 100,
    })

    expect(useNoteStore.getState().noteIds).toHaveLength(1)

    fireEvent.pointerCancel(resizeHandle, { pointerId: 9 })
    fireEvent.doubleClick(canvas, {
      button: 0,
      clientX: 100,
      clientY: 100,
    })

    expect(useNoteStore.getState().noteIds).toHaveLength(2)
  })
})
