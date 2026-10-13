import { useCallback, useRef, type RefObject } from 'react'
import type { NoteId, Point, Rect } from '../../../domain'
import { isPointInsideRect } from '../geometry'
import { useNoteStore } from '../noteStore'

interface NoteDeleteSession {
  readonly deleteZone: HTMLElement
  readonly deleteZoneBounds: Rect
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

  const handleDragStart = useCallback(() => {
    const canvas = noteRef.current?.closest<HTMLElement>('.note-canvas')
    const deleteZone = canvas?.querySelector<HTMLElement>('[data-delete-zone]')

    if (!deleteZone) {
      return
    }

    const deleteZoneBounds = toRect(deleteZone.getBoundingClientRect())

    deleteZone.classList.add('delete-zone--visible')
    deleteZone.setAttribute('aria-hidden', 'false')
    sessionRef.current = {
      deleteZone,
      deleteZoneBounds,
      isActive: false,
    }
  }, [noteRef])

  const handleDragMove = useCallback((pointerPosition: Point) => {
    const session = sessionRef.current

    if (!session) {
      return
    }

    const isActive = isPointInsideRect(
      pointerPosition,
      session.deleteZoneBounds,
    )

    if (isActive !== session.isActive) {
      session.isActive = isActive
      session.deleteZone.classList.toggle('delete-zone--active', isActive)
    }
  }, [])

  const handleDrop = useCallback(
    (pointerPosition: Point): boolean => {
      const session = sessionRef.current

      if (!session) {
        return false
      }

      sessionRef.current = null
      const shouldDelete = isPointInsideRect(
        pointerPosition,
        session.deleteZoneBounds,
      )

      try {
        if (!shouldDelete) {
          return false
        }

        return Boolean(deleteNote(noteId))
      } finally {
        hideDeleteZone(session)
      }
    },
    [deleteNote, noteId],
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
