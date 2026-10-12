import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotesWorkspace } from './NotesWorkspace'

const noteCanvasRender = vi.fn()

vi.mock('./NoteCanvas', () => ({
  NoteCanvas: () => {
    noteCanvasRender()

    return <section aria-label="Sticky notes canvas" />
  },
}))

describe('NotesWorkspace', () => {
  beforeEach(() => {
    noteCanvasRender.mockClear()
  })

  it('does not rerender the canvas when creation controls change', async () => {
    const user = userEvent.setup()

    render(<NotesWorkspace />)

    expect(noteCanvasRender).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'L note size' }))
    await user.click(
      screen.getByRole('button', { name: 'green note background' }),
    )

    expect(noteCanvasRender).toHaveBeenCalledTimes(1)
  })
})
