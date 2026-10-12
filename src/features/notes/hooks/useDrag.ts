import { useCallback, useRef, type PointerEvent, type RefObject } from 'react'
import type { Point, Rect } from '../../../domain'
import { calculateDragPosition } from '../geometry'

export interface DragSession {
  readonly pointerId: number
  readonly initialPointerPosition: Point
  readonly initialNotePosition: Point
  currentPosition: Point
  readonly noteBounds: Rect
  readonly canvasBounds: Rect
}

export interface UseDragParams {
  readonly noteRef: RefObject<HTMLElement | null>
  readonly initialNotePosition: Point
  readonly onDragEnd: (position: Point) => void
}

function toRect(bounds: DOMRect): Rect {
  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.width,
    height: bounds.height,
  }
}

export function useDrag({
  noteRef,
  initialNotePosition,
  onDragEnd,
}: UseDragParams) {
  const sessionRef = useRef<DragSession | null>(null)

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || sessionRef.current) {
        return
      }

      const noteElement = noteRef.current
      const canvasElement = noteElement?.closest<HTMLElement>('.note-canvas')

      if (!noteElement || !canvasElement) {
        return
      }

      const captureElement = event.currentTarget

      if (typeof captureElement.setPointerCapture !== 'function') {
        return
      }

      const noteBounds = noteElement.getBoundingClientRect()
      const canvasBounds = canvasElement.getBoundingClientRect()

      captureElement.setPointerCapture(event.pointerId)
      sessionRef.current = {
        pointerId: event.pointerId,
        initialPointerPosition: [event.clientX, event.clientY],
        initialNotePosition,
        currentPosition: initialNotePosition,
        noteBounds: toRect(noteBounds),
        canvasBounds: toRect(canvasBounds),
      }
      event.preventDefault()
    },
    [initialNotePosition, noteRef],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const session = sessionRef.current
      const noteElement = noteRef.current

      if (!session || session.pointerId !== event.pointerId || !noteElement) {
        return
      }

      const position = calculateDragPosition({
        initialPosition: session.initialNotePosition,
        initialPointerPosition: session.initialPointerPosition,
        currentPointerPosition: [event.clientX, event.clientY],
        noteDimensions: [session.noteBounds.width, session.noteBounds.height],
        canvasDimensions: [
          session.canvasBounds.width,
          session.canvasBounds.height,
        ],
      })

      session.currentPosition = position
      noteElement.style.transform = `translate3d(${position[0]}px, ${position[1]}px, 0)`
    },
    [noteRef],
  )

  const endDrag = useCallback(
    (event: PointerEvent<HTMLElement>, commit: boolean) => {
      const session = sessionRef.current

      if (!session || session.pointerId !== event.pointerId) {
        return
      }

      const noteElement = noteRef.current
      const finalPosition = session.currentPosition

      sessionRef.current = null

      try {
        if (
          commit &&
          (finalPosition[0] !== session.initialNotePosition[0] ||
            finalPosition[1] !== session.initialNotePosition[1])
        ) {
          onDragEnd(finalPosition)
        }
      } finally {
        if (noteElement) {
          noteElement.style.transform = ''
        }

        if (typeof event.currentTarget.releasePointerCapture === 'function') {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      }
    },
    [noteRef, onDragEnd],
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      endDrag(event, true)
    },
    [endDrag],
  )

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      endDrag(event, false)
    },
    [endDrag],
  )

  const handleLostPointerCapture = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (sessionRef.current?.pointerId === event.pointerId) {
        sessionRef.current = null
        const noteElement = noteRef.current

        if (noteElement) {
          noteElement.style.transform = ''
        }
      }
    },
    [noteRef],
  )

  return {
    sessionRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
  }
}
