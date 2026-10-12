import { useCallback, useRef } from 'react'
import { Toolbar } from '../../components/Toolbar'
import { NoteCanvas } from './NoteCanvas'
import { NoteControls } from './NoteControls'
import {
  DEFAULT_NOTE_CREATION_CONFIGURATION,
  type NoteCreationConfiguration,
} from './noteCreation'
import './NotesWorkspace.css'

export function NotesWorkspace() {
  const creationConfigurationRef = useRef<NoteCreationConfiguration>(
    DEFAULT_NOTE_CREATION_CONFIGURATION,
  )
  const handleCreationConfigurationChange = useCallback(
    (configuration: NoteCreationConfiguration) => {
      creationConfigurationRef.current = configuration
    },
    [],
  )

  return (
    <main className="notes-workspace">
      <Toolbar ariaLabel="Note controls">
        <NoteControls
          onConfigurationChange={handleCreationConfigurationChange}
        />
      </Toolbar>
      <NoteCanvas />
    </main>
  )
}
