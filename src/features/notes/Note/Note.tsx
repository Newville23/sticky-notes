import { memo, type CSSProperties, type FocusEvent } from 'react'
import {
  MAX_NOTE_CONTENT_LENGTH,
  isValidNoteContent,
  type NoteBackground,
  type NoteId,
} from '../../../domain'
import { useNoteStore } from '../noteStore'
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
  const note = useNoteStore((state) => state.notesById[id])
  const updateNote = useNoteStore((state) => state.updateNote)

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
      className={`note ${getBackgroundClass(note.background)}`}
      style={style}
      aria-label="Sticky note"
      data-note-id={id}
    >
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
