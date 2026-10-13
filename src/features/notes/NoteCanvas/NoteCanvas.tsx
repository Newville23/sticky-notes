import { memo, type Ref } from 'react'
import { DeleteZone } from '../DeleteZone'
import { Note } from '../Note'
import { useNoteStore } from '../noteStore'
import './NoteCanvas.css'

export interface NoteCanvasProps {
  readonly ref?: Ref<HTMLElement>
}

export const NoteCanvas = memo(function NoteCanvas({ ref }: NoteCanvasProps) {
  const noteIds = useNoteStore((state) => state.noteIds)

  return (
    <section ref={ref} className="note-canvas" aria-label="Sticky notes canvas">
      {noteIds.length === 0 ? (
        <div className="note-canvas__empty">
          <span className="note-canvas__empty-mark" aria-hidden="true"></span>
          <p className="note-canvas__empty-title">Your canvas is ready</p>
          <p className="note-canvas__empty-message">
            Choose a size and color, then select Add note.
          </p>
        </div>
      ) : (
        noteIds.map((id) => <Note key={id} id={id} />)
      )}
      <DeleteZone />
    </section>
  )
})
