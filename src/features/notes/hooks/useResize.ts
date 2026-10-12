import { useCallback, useRef, type PointerEvent, type RefObject } from 'react'
import type { Dimensions, Point, Rect } from '../../../domain'
import { calculateResizeDimensions } from '../geometry'

export interface ResizeSession {
  readonly pointerId: number
  readonly initialPointerPosition: Point
  readonly initialDimensions: Dimensions
  readonly notePosition: Point
  currentDimensions: Dimensions
  readonly canvasBounds: Rect
}

export interface UseResizeParams {
  readonly noteRef: RefObject<HTMLElement | null>
  readonly initialDimensions: Dimensions
  readonly notePosition: Point
  readonly onResizeEnd: (dimensions: Dimensions) => void
}

function toRect(bounds: DOMRect): Rect {
  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.width,
    height: bounds.height,
  }
}

export function useResize({
  noteRef,
  initialDimensions,
  notePosition,
  onResizeEnd,
}: UseResizeParams) {
  const sessionRef = useRef<ResizeSession | null>(null)

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || sessionRef.current) {
        return
      }

      const noteElement = noteRef.current
      const canvasElement = noteElement?.closest<HTMLElement>('.note-canvas')
      const captureElement = event.currentTarget

      if (
        !noteElement ||
        !canvasElement ||
        typeof captureElement.setPointerCapture !== 'function'
      ) {
        return
      }

      const canvasBounds = canvasElement.getBoundingClientRect()

      captureElement.setPointerCapture(event.pointerId)
      sessionRef.current = {
        pointerId: event.pointerId,
        initialPointerPosition: [event.clientX, event.clientY],
        initialDimensions,
        notePosition,
        currentDimensions: initialDimensions,
        canvasBounds: toRect(canvasBounds),
      }
      event.preventDefault()
    },
    [initialDimensions, notePosition, noteRef],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const session = sessionRef.current
      const noteElement = noteRef.current

      if (!session || session.pointerId !== event.pointerId || !noteElement) {
        return
      }

      const dimensions = calculateResizeDimensions({
        initialDimensions: session.initialDimensions,
        initialPointerPosition: session.initialPointerPosition,
        currentPointerPosition: [event.clientX, event.clientY],
        notePosition: session.notePosition,
        canvasDimensions: [
          session.canvasBounds.width,
          session.canvasBounds.height,
        ],
      })

      session.currentDimensions = dimensions
      noteElement.style.width = `${dimensions[0]}px`
      noteElement.style.height = `${dimensions[1]}px`
    },
    [noteRef],
  )

  const endResize = useCallback(
    (event: PointerEvent<HTMLElement>, commit: boolean) => {
      const session = sessionRef.current

      if (!session || session.pointerId !== event.pointerId) {
        return
      }

      const noteElement = noteRef.current
      const finalDimensions = session.currentDimensions

      sessionRef.current = null

      try {
        if (
          commit &&
          (finalDimensions[0] !== session.initialDimensions[0] ||
            finalDimensions[1] !== session.initialDimensions[1])
        ) {
          onResizeEnd(finalDimensions)
        }
      } finally {
        if (noteElement) {
          noteElement.style.width = ''
          noteElement.style.height = ''
        }

        if (typeof event.currentTarget.releasePointerCapture === 'function') {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
      }
    },
    [noteRef, onResizeEnd],
  )

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      endResize(event, true)
    },
    [endResize],
  )

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      endResize(event, false)
    },
    [endResize],
  )

  const handleLostPointerCapture = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (sessionRef.current?.pointerId !== event.pointerId) {
        return
      }

      sessionRef.current = null
      const noteElement = noteRef.current

      if (noteElement) {
        noteElement.style.width = ''
        noteElement.style.height = ''
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
