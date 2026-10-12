import { memo, type ReactNode } from 'react'
import './NoteCanvas.css'

export interface NoteCanvasProps {
  readonly children?: ReactNode
}

export const NoteCanvas = memo(function NoteCanvas({
  children,
}: NoteCanvasProps) {
  return (
    <section className="note-canvas" aria-label="Sticky notes canvas">
      {children ?? (
        <div className="note-canvas__empty">
          <span className="note-canvas__empty-mark" aria-hidden="true"></span>
          <p className="note-canvas__empty-title">Your canvas is ready</p>
          <p className="note-canvas__empty-message">
            Choose a size and color, then click anywhere to add a note.
          </p>
        </div>
      )}
    </section>
  )
})
