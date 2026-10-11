import type { NoteBackground } from './constants'
import type { Geometry } from './geometry'

export type NoteId = string

export function createNoteId(): NoteId {
  return crypto.randomUUID()
}

export interface Note extends Geometry {
  readonly id: NoteId
  readonly content: string
  readonly background: NoteBackground
}
