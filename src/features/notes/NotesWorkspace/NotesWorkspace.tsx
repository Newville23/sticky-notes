import { useCallback, useRef, type MouseEvent } from 'react'
import { Toolbar } from '../../../components/Toolbar'
import {
  DEFAULT_NOTE_CONTENT,
  NOTE_SIZE_PRESETS,
  type Point,
} from '../../../domain'
import { calculateNoteCreationPosition } from '../geometry'
import { NoteCanvas } from '../NoteCanvas'
import { NoteControls } from '../NoteControls'
import { hasActivePointerInteraction } from '../pointerInteraction'
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

    const { createNote } = useNoteStore.getState()
    const configuration = creationConfigurationRef.current
    const dimensions = NOTE_SIZE_PRESETS[configuration.size]
    const canvasBounds = canvas.getBoundingClientRect()
    const position = calculateNoteCreationPosition({
      noteDimensions: dimensions,
      canvasDimensions: [canvasBounds.width, canvasBounds.height],
      strategy: {
        type: 'cascade',
        previousPosition: lastCreationPositionRef.current ?? undefined,
      },
    })

    createNote({
      content: DEFAULT_NOTE_CONTENT,
      position,
      dimensions,
      background: configuration.background,
    })
    lastCreationPositionRef.current = position
  }, [])
  const handleCanvasDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (
        event.button !== 0 ||
        event.target !== event.currentTarget ||
        hasActivePointerInteraction(event.currentTarget)
      ) {
        return
      }

      const canvasBounds = event.currentTarget.getBoundingClientRect()
      const configuration = creationConfigurationRef.current
      const dimensions = NOTE_SIZE_PRESETS[configuration.size]
      const position = calculateNoteCreationPosition({
        noteDimensions: dimensions,
        canvasDimensions: [canvasBounds.width, canvasBounds.height],
        strategy: {
          type: 'direct',
          center: [
            event.clientX - canvasBounds.left,
            event.clientY - canvasBounds.top,
          ],
        },
      })

      useNoteStore.getState().createNote({
        content: DEFAULT_NOTE_CONTENT,
        position,
        dimensions,
        background: configuration.background,
      })
    },
    [],
  )

  return (
    <main className="notes-workspace">
      <Toolbar ariaLabel="Note controls">
        <NoteControls
          onConfigurationChange={handleCreationConfigurationChange}
          onAddNote={handleAddNote}
        />
      </Toolbar>
      <NoteCanvas ref={canvasRef} onDoubleClick={handleCanvasDoubleClick} />
    </main>
  )
}
