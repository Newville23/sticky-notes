import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useNoteStore } from './features/notes/noteStore'

describe('App', () => {
  beforeEach(() => {
    useNoteStore.setState({ notesById: {}, noteIds: [], undoBuffer: [] })
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
})
