import { memo, type CSSProperties } from 'react'
import type { NoteBackground, NoteId } from '../../../domain'
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

  return (
    <article
      className={`note ${getBackgroundClass(note.background)}`}
      style={style}
      aria-label="Sticky note"
      data-note-id={id}
    />
  )
})
