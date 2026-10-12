import type { NoteBackground } from './constants'
import { MAX_NOTE_CONTENT_LENGTH } from './constants'
import type { Geometry } from './geometry'

export type NoteId = string

export function createNoteId(): NoteId {
  return crypto.randomUUID()
}

export function isValidNoteContent(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= MAX_NOTE_CONTENT_LENGTH &&
    !value.includes('\0')
  )
}

export function assertValidNoteContent(
  value: unknown,
): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError('Note content must be a string')
  }

  if (value.length > MAX_NOTE_CONTENT_LENGTH) {
    throw new RangeError(
      `Note content cannot exceed ${MAX_NOTE_CONTENT_LENGTH} characters`,
    )
  }

  if (value.includes('\0')) {
    throw new RangeError('Note content cannot contain null characters')
  }
}

export interface Note extends Geometry {
  readonly id: NoteId
  readonly content: string
  readonly background: NoteBackground
}
