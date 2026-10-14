import { useCallback, useRef, type RefObject } from 'react'
import {
  DELETE_ZONE_OCCUPANCY_THRESHOLD,
  type NoteId,
  type Point,
  type Rect,
} from '../../../domain'
import { calculateDeleteZoneOccupancy } from '../geometry'
import { useNoteStore, type DeletedNoteSnapshot } from '../noteStore'
import type { DragSession } from './useDrag'

interface NoteDeleteSession {
  readonly deleteZone: HTMLElement
  readonly deleteZoneBounds: Rect
  readonly initialNotePosition: Point
  readonly initialNoteBounds: Rect
  readonly snapshot: DeletedNoteSnapshot
  isActive: boolean
}

export interface UseNoteDeleteParams {
  readonly noteId: NoteId
  readonly noteRef: RefObject<HTMLElement | null>
}

function toRect(bounds: DOMRect): Rect {
  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.width,
    height: bounds.height,
  }
}

function hideDeleteZone(session: NoteDeleteSession): void {
  session.deleteZone.classList.remove(
    'delete-zone--visible',
    'delete-zone--active',
  )
  session.deleteZone.setAttribute('aria-hidden', 'true')
}

export function useNoteDelete({ noteId, noteRef }: UseNoteDeleteParams) {
  const sessionRef = useRef<NoteDeleteSession | null>(null)
  const deleteNote = useNoteStore((state) => state.deleteNote)

  const handleDragStart = useCallback(
    (dragSession: DragSession) => {
      const canvas = noteRef.current?.closest<HTMLElement>('.note-canvas')
      const deleteZone =
        canvas?.querySelector<HTMLElement>('[data-delete-zone]')
      const state = useNoteStore.getState()
      const note = state.notesById[noteId]
      const index = state.noteIds.indexOf(noteId)

      if (!deleteZone || !note || index === -1) {
        return
      }

      const deleteZoneBounds = toRect(deleteZone.getBoundingClientRect())

      deleteZone.classList.add('delete-zone--visible')
      deleteZone.setAttribute('aria-hidden', 'false')
      sessionRef.current = {
        deleteZone,
        deleteZoneBounds,
        initialNotePosition: dragSession.initialNotePosition,
        initialNoteBounds: dragSession.noteBounds,
        snapshot: { note, index },
        isActive: false,
      }
    },
    [noteId, noteRef],
  )

  const getOccupancy = useCallback(
    (session: NoteDeleteSession, position: Point) => {
      const noteRect: Rect = {
        x:
          session.initialNoteBounds.x +
          position[0] -
          session.initialNotePosition[0],
        y:
          session.initialNoteBounds.y +
          position[1] -
          session.initialNotePosition[1],
        width: session.initialNoteBounds.width,
        height: session.initialNoteBounds.height,
      }

      return calculateDeleteZoneOccupancy(noteRect, session.deleteZoneBounds)
    },
    [],
  )

  const handleDragMove = useCallback(
    (position: Point) => {
      const session = sessionRef.current

      if (!session) {
        return
      }

      const isActive =
        getOccupancy(session, position) >= DELETE_ZONE_OCCUPANCY_THRESHOLD

      if (isActive !== session.isActive) {
        session.isActive = isActive
        session.deleteZone.classList.toggle('delete-zone--active', isActive)
      }
    },
    [getOccupancy],
  )

  const handleDrop = useCallback(
    (position: Point): boolean => {
      const session = sessionRef.current

      if (!session) {
        return false
      }

      sessionRef.current = null
      const shouldDelete =
        getOccupancy(session, position) >= DELETE_ZONE_OCCUPANCY_THRESHOLD

      try {
        if (!shouldDelete) {
          return false
        }

        return Boolean(deleteNote(noteId, session.snapshot))
      } finally {
        hideDeleteZone(session)
      }
    },
    [deleteNote, getOccupancy, noteId],
  )

  const handleDragCancel = useCallback(() => {
    const session = sessionRef.current

    if (!session) {
      return
    }

    sessionRef.current = null
    hideDeleteZone(session)
  }, [])

  return {
    sessionRef,
    handleDragStart,
    handleDragMove,
    handleDrop,
    handleDragCancel,
  }
}
