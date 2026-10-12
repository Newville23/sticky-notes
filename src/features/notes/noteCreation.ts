import {
  DEFAULT_NOTE_BACKGROUND,
  DEFAULT_NOTE_SIZE_PRESET,
  type NoteBackground,
  type NoteSizePreset,
} from '../../domain'

export interface NoteCreationConfiguration {
  readonly size: NoteSizePreset
  readonly background: NoteBackground
}

export const DEFAULT_NOTE_CREATION_CONFIGURATION: NoteCreationConfiguration = {
  size: DEFAULT_NOTE_SIZE_PRESET,
  background: DEFAULT_NOTE_BACKGROUND,
}
