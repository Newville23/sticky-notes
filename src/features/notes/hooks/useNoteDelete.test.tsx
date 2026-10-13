import type { RefObject } from 'react'
import { act, renderHook } from '@testing-library/react'
import type { NoteId } from '../../../domain'
import { useNoteStore } from '../noteStore'
import { useNoteDelete } from './useNoteDelete'

function createBounds({
  left,
  top,
  width,
  height,
}: {
  left: number
  top: number
  width: number
  height: number
}): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  }
}

function setupDeleteHook(noteId: NoteId) {
  const canvas = document.createElement('section')
  const note = document.createElement('article')
  const deleteZone = document.createElement('div')

  canvas.className = 'note-canvas'
  deleteZone.dataset.deleteZone = ''
  deleteZone.className = 'delete-zone'
  deleteZone.setAttribute('aria-hidden', 'true')
  canvas.append(note, deleteZone)
  vi.spyOn(deleteZone, 'getBoundingClientRect').mockReturnValue(
    createBounds({ left: 200, top: 300, width: 200, height: 60 }),
  )

  const noteRef: RefObject<HTMLElement | null> = { current: note }
  const hook = renderHook(() => useNoteDelete({ noteId, noteRef }))

  return { ...hook, deleteZone }
}

describe('useNoteDelete', () => {
  let noteId: NoteId

  beforeEach(() => {
    useNoteStore.setState({ notesById: {}, noteIds: [], undoBuffer: [] })
    noteId = useNoteStore.getState().createNote({
      content: 'Recoverable note',
      position: [100, 100],
      dimensions: [160, 160],
      background: 'yellow',
    })
  })

  it('reveals the delete zone and caches its bounds at drag start', () => {
    const { result, deleteZone } = setupDeleteHook(noteId)

    act(() => result.current.handleDragStart())

    expect(deleteZone).toHaveClass('delete-zone--visible')
    expect(deleteZone).toHaveAttribute('aria-hidden', 'false')
    expect(deleteZone.getBoundingClientRect).toHaveBeenCalledOnce()
    expect(result.current.sessionRef.current).toMatchObject({
      deleteZone,
      deleteZoneBounds: { x: 200, y: 300, width: 200, height: 60 },
      isActive: false,
    })
  })

  it('updates only the zone state while passing over it', () => {
    const { result, deleteZone } = setupDeleteHook(noteId)
    const beforeMove = useNoteStore.getState()

    act(() => {
      result.current.handleDragStart()
      result.current.handleDragMove([250, 320])
    })

    expect(deleteZone).toHaveClass('delete-zone--active')
    expect(useNoteStore.getState()).toBe(beforeMove)

    act(() => result.current.handleDragMove([100, 100]))

    expect(deleteZone).not.toHaveClass('delete-zone--active')
    expect(useNoteStore.getState().notesById[noteId]).toBeDefined()
    expect(deleteZone.getBoundingClientRect).toHaveBeenCalledOnce()
  })

  it('deletes only when the pointer is released inside the zone', () => {
    const { result, deleteZone } = setupDeleteHook(noteId)
    let dropHandled = false

    act(() => {
      result.current.handleDragStart()
      dropHandled = result.current.handleDrop([250, 320])
    })

    expect(dropHandled).toBe(true)
    expect(useNoteStore.getState().notesById[noteId]).toBeUndefined()
    expect(useNoteStore.getState().noteIds).not.toContain(noteId)
    expect(deleteZone).not.toHaveClass(
      'delete-zone--visible',
      'delete-zone--active',
    )
    expect(deleteZone).toHaveAttribute('aria-hidden', 'true')
    expect(result.current.sessionRef.current).toBeNull()
  })

  it('keeps the note and cleans up when released outside the zone', () => {
    const { result, deleteZone } = setupDeleteHook(noteId)
    let dropHandled = true

    act(() => {
      result.current.handleDragStart()
      dropHandled = result.current.handleDrop([100, 100])
    })

    expect(dropHandled).toBe(false)
    expect(useNoteStore.getState().notesById[noteId]).toBeDefined()
    expect(deleteZone).not.toHaveClass('delete-zone--visible')
    expect(deleteZone).toHaveAttribute('aria-hidden', 'true')
  })

  it('cleans up without deleting when dragging is cancelled', () => {
    const { result, deleteZone } = setupDeleteHook(noteId)

    act(() => {
      result.current.handleDragStart()
      result.current.handleDragMove([250, 320])
      result.current.handleDragCancel()
    })

    expect(useNoteStore.getState().notesById[noteId]).toBeDefined()
    expect(deleteZone).not.toHaveClass(
      'delete-zone--visible',
      'delete-zone--active',
    )
    expect(deleteZone).toHaveAttribute('aria-hidden', 'true')
    expect(result.current.sessionRef.current).toBeNull()
  })
})
