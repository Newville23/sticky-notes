import type { RefObject } from 'react'
import { act, renderHook } from '@testing-library/react'
import type { NoteId } from '../../../domain'
import { useNoteStore } from '../noteStore'
import type { DragSession } from './useDrag'
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
  const dragSession: DragSession = {
    pointerId: 5,
    initialPointerPosition: [120, 120],
    initialNotePosition: [100, 100],
    currentPosition: [100, 100],
    noteBounds: { x: 100, y: 100, width: 160, height: 160 },
    canvasBounds: { x: 0, y: 0, width: 600, height: 400 },
  }

  return { ...hook, deleteZone, dragSession }
}

describe('useNoteDelete', () => {
  let noteId: NoteId

  beforeEach(() => {
    useNoteStore.setState({
      notesById: {},
      noteIds: [],
      undoBuffer: [],
      nextDeletionNumber: 1,
    })
    noteId = useNoteStore.getState().createNote({
      content: 'Recoverable note',
      position: [100, 100],
      dimensions: [160, 160],
      background: 'yellow',
    })
  })

  it('reveals the delete zone and caches its bounds at drag start', () => {
    const { result, deleteZone, dragSession } = setupDeleteHook(noteId)

    act(() => result.current.handleDragStart(dragSession))

    expect(deleteZone).toHaveClass('delete-zone--visible')
    expect(deleteZone).toHaveAttribute('aria-hidden', 'false')
    expect(deleteZone.getBoundingClientRect).toHaveBeenCalledOnce()
    expect(result.current.sessionRef.current).toMatchObject({
      deleteZone,
      deleteZoneBounds: { x: 200, y: 300, width: 200, height: 60 },
      initialNotePosition: [100, 100],
      initialNoteBounds: { x: 100, y: 100, width: 160, height: 160 },
      snapshot: {
        note: useNoteStore.getState().notesById[noteId],
        index: 0,
      },
      isActive: false,
    })
  })

  it('updates only the zone state when note occupancy crosses 75%', () => {
    const { result, deleteZone, dragSession } = setupDeleteHook(noteId)
    const beforeMove = useNoteStore.getState()

    act(() => {
      result.current.handleDragStart(dragSession)
      result.current.handleDragMove([250, 300])
    })

    expect(deleteZone).toHaveClass('delete-zone--active')
    expect(useNoteStore.getState()).toBe(beforeMove)

    act(() => result.current.handleDragMove([251, 300]))

    expect(deleteZone).not.toHaveClass('delete-zone--active')
    expect(useNoteStore.getState().notesById[noteId]).toBeDefined()
    expect(deleteZone.getBoundingClientRect).toHaveBeenCalledOnce()
  })

  it('deletes at the exact occupancy threshold regardless of pointer location', () => {
    const { result, deleteZone, dragSession } = setupDeleteHook(noteId)
    let dropHandled = false

    act(() => {
      result.current.handleDragStart(dragSession)
      dropHandled = result.current.handleDrop([250, 300])
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

  it('keeps the note and cleans up when occupancy is below the threshold', () => {
    const { result, deleteZone, dragSession } = setupDeleteHook(noteId)
    let dropHandled = true

    act(() => {
      result.current.handleDragStart(dragSession)
      dropHandled = result.current.handleDrop([251, 300])
    })

    expect(dropHandled).toBe(false)
    expect(useNoteStore.getState().notesById[noteId]).toBeDefined()
    expect(deleteZone).not.toHaveClass('delete-zone--visible')
    expect(deleteZone).toHaveAttribute('aria-hidden', 'true')
  })

  it('stores the exact pre-drag persisted snapshot for undo', () => {
    const { result, dragSession } = setupDeleteHook(noteId)
    const preDragNote = useNoteStore.getState().notesById[noteId]

    act(() => {
      result.current.handleDragStart(dragSession)
      useNoteStore.getState().updateNote(noteId, { position: [140, 140] })
      result.current.handleDrop([250, 300])
    })

    const [entry] = useNoteStore.getState().undoBuffer
    expect(entry.snapshot).toEqual({ note: preDragNote, index: 0 })

    act(() => useNoteStore.getState().restoreDeletedNote(entry.deletionNumber))

    expect(useNoteStore.getState().notesById[noteId]).toBe(preDragNote)
    expect(useNoteStore.getState().notesById[noteId].position).toEqual([
      100, 100,
    ])
  })

  it('cleans up without deleting when dragging is cancelled', () => {
    const { result, deleteZone, dragSession } = setupDeleteHook(noteId)

    act(() => {
      result.current.handleDragStart(dragSession)
      result.current.handleDragMove([250, 300])
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
