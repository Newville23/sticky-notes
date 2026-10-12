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
  type Dimensions,
  type NoteBackground,
  type NoteId,
  type Point,
} from '../../../domain'
import { useNoteStore } from '../noteStore'
import { useDrag } from '../hooks/useDrag'
import { useResize } from '../hooks/useResize'
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
  const commitDimensions = useCallback(
    (dimensions: Dimensions) => {
      updateNote(id, { dimensions })
    },
    [id, updateNote],
  )
  const {
    handlePointerDown: handleDragPointerDown,
    handlePointerMove: handleDragPointerMove,
    handlePointerUp: handleDragPointerUp,
    handlePointerCancel: handleDragPointerCancel,
    handleLostPointerCapture: handleDragLostPointerCapture,
  } = useDrag({
    noteRef,
    initialNotePosition: note?.position ?? [0, 0],
    onDragEnd: commitPosition,
  })
  const {
    handlePointerDown: handleResizePointerDown,
    handlePointerMove: handleResizePointerMove,
    handlePointerUp: handleResizePointerUp,
    handlePointerCancel: handleResizePointerCancel,
    handleLostPointerCapture: handleResizeLostPointerCapture,
  } = useResize({
    noteRef,
    initialDimensions: note?.dimensions ?? [0, 0],
    notePosition: note?.position ?? [0, 0],
    onResizeEnd: commitDimensions,
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
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
        onPointerCancel={handleDragPointerCancel}
        onLostPointerCapture={handleDragLostPointerCapture}
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
      <div
        className="note__resize-handle"
        data-note-resize-handle=""
        aria-hidden="true"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
        onPointerCancel={handleResizePointerCancel}
        onLostPointerCapture={handleResizeLostPointerCapture}
      />
    </article>
  )
})
