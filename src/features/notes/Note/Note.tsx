import {
  memo,
  useCallback,
  useRef,
  type CSSProperties,
  type FocusEvent,
} from 'react'
import {
  MAX_NOTE_CONTENT_LENGTH,
  isValidNoteContent,
  type NoteBackground,
  type NoteId,
  type Point,
} from '../../../domain'
import { useNoteStore } from '../noteStore'
import { useDrag } from '../hooks/useDrag'
import './Note.css'

export interface NoteProps {
  readonly id: NoteId
}

interface NoteStyle extends CSSProperties {
  readonly '--note-x': string
  readonly '--note-y': string
  readonly '--note-width': string
  readonly '--note-height': string
}

function getBackgroundClass(background: NoteBackground): string {
  return `note--${background}`
}

export const Note = memo(function Note({ id }: NoteProps) {
  const noteRef = useRef<HTMLElement>(null)
  const note = useNoteStore((state) => state.notesById[id])
  const updateNote = useNoteStore((state) => state.updateNote)
  const commitPosition = useCallback(
    (position: Point) => {
      updateNote(id, { position })
    },
    [id, updateNote],
  )
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleLostPointerCapture,
  } = useDrag({
    noteRef,
    initialNotePosition: note?.position ?? [0, 0],
    onDragEnd: commitPosition,
  })

  if (!note) {
    return null
  }

  const [x, y] = note.position
  const [width, height] = note.dimensions
  const style: NoteStyle = {
    '--note-x': `${x}px`,
    '--note-y': `${y}px`,
    '--note-width': `${width}px`,
    '--note-height': `${height}px`,
  }
  const commitContent = (event: FocusEvent<HTMLTextAreaElement>) => {
    const content = event.currentTarget.value

    if (!isValidNoteContent(content)) {
      event.currentTarget.value = note.content
      return
    }

    if (content !== note.content) {
      updateNote(id, { content })
    }
  }

  return (
    <article
      ref={noteRef}
      className={`note ${getBackgroundClass(note.background)}`}
      style={style}
      aria-label="Sticky note"
      data-note-id={id}
    >
      <div
        className="note__drag-surface"
        data-note-drag-surface=""
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
      />
      <textarea
        className="note__editor"
        aria-label="Note content"
        defaultValue={note.content}
        maxLength={MAX_NOTE_CONTENT_LENGTH}
        placeholder="Write something…"
        autoFocus
        onBlur={commitContent}
        onPointerDown={(event) => event.stopPropagation()}
      />
    </article>
  )
})
