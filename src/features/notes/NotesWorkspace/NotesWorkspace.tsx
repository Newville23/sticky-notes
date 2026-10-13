import { useCallback, useRef } from 'react'
import { Toolbar } from '../../../components/Toolbar'
import {
  DEFAULT_NOTE_CONTENT,
  NOTE_SIZE_PRESETS,
  type Point,
} from '../../../domain'
import { calculateNoteCreationPosition } from '../geometry'
import { NoteCanvas } from '../NoteCanvas'
import { NoteControls } from '../NoteControls'
import {
  DEFAULT_NOTE_CREATION_CONFIGURATION,
  type NoteCreationConfiguration,
} from '../noteCreation'
import { useNoteStore } from '../noteStore'
import './NotesWorkspace.css'

export function NotesWorkspace() {
  const canvasRef = useRef<HTMLElement>(null)
  const lastCreationPositionRef = useRef<Point | null>(null)
  const creationConfigurationRef = useRef<NoteCreationConfiguration>(
    DEFAULT_NOTE_CREATION_CONFIGURATION,
  )
  const handleCreationConfigurationChange = useCallback(
    (configuration: NoteCreationConfiguration) => {
      creationConfigurationRef.current = configuration
    },
    [],
  )
  const handleAddNote = useCallback(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const { noteIds, notesById, createNote } = useNoteStore.getState()
    const configuration = creationConfigurationRef.current
    const dimensions = NOTE_SIZE_PRESETS[configuration.size]
    const canvasBounds = canvas.getBoundingClientRect()
    const lastNoteId = noteIds.at(-1)
    const previousPosition =
      noteIds.length === 0
        ? undefined
        : (lastCreationPositionRef.current ??
          (lastNoteId ? notesById[lastNoteId]?.position : undefined))
    const position = calculateNoteCreationPosition({
      noteDimensions: dimensions,
      canvasDimensions: [canvasBounds.width, canvasBounds.height],
      previousPosition,
    })

    createNote({
      content: DEFAULT_NOTE_CONTENT,
      position,
      dimensions,
      background: configuration.background,
    })
    lastCreationPositionRef.current = position
  }, [])

  return (
    <main className="notes-workspace">
      <Toolbar ariaLabel="Note controls">
        <NoteControls
          onConfigurationChange={handleCreationConfigurationChange}
          onAddNote={handleAddNote}
        />
      </Toolbar>
      <NoteCanvas ref={canvasRef} />
    </main>
  )
}
