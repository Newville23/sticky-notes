import { create } from 'zustand'
import {
  DELETE_UNDO_WINDOW_MS,
  assertValidNoteContent,
  createNoteId,
  isValidNoteContent,
  type Note,
  type NoteId,
} from '../../domain'

export type CreateNoteInput = Omit<Note, 'id'>
export type NoteChanges = Partial<Omit<Note, 'id'>>

export interface DeletedNoteSnapshot {
  readonly note: Note
  readonly index: number
}

export interface UndoBufferEntry {
  readonly deletionNumber: number
  readonly snapshot: DeletedNoteSnapshot
  readonly expiresAt: number
}

export interface NoteState {
  readonly notesById: Record<NoteId, Note>
  readonly noteIds: NoteId[]
  readonly undoBuffer: UndoBufferEntry[]
  readonly nextDeletionNumber: number
}

export interface NoteActions {
  readonly createNote: (input: CreateNoteInput) => NoteId
  readonly updateNote: (id: NoteId, changes: NoteChanges) => void
  readonly deleteNote: (
    id: NoteId,
    snapshot?: DeletedNoteSnapshot,
  ) => DeletedNoteSnapshot | undefined
  readonly restoreDeletedNote: (deletionNumber: number) => void
  readonly discardDeletedNote: (deletionNumber: number) => void
}

export type NoteStore = NoteState & NoteActions

const initialNoteState: NoteState = {
  notesById: {},
  noteIds: [],
  undoBuffer: [],
  nextDeletionNumber: 1,
}

export const useNoteStore = create<NoteStore>()((set, get) => ({
  ...initialNoteState,

  createNote: (input) => {
    assertValidNoteContent(input.content)

    let id = createNoteId()

    while (get().notesById[id]) {
      id = createNoteId()
    }

    const note: Note = { id, ...input }

    set((state) => ({
      notesById: {
        ...state.notesById,
        [id]: note,
      },
      noteIds: [...state.noteIds, id],
    }))

    return id
  },

  updateNote: (id, changes) => {
    set((state) => {
      const note = state.notesById[id]

      if (
        !note ||
        ('content' in changes && !isValidNoteContent(changes.content))
      ) {
        return state
      }

      const nextNote: Note = {
        ...note,
        ...changes,
        id,
      }

      if (
        Object.is(note.content, nextNote.content) &&
        Object.is(note.position, nextNote.position) &&
        Object.is(note.dimensions, nextNote.dimensions) &&
        Object.is(note.background, nextNote.background)
      ) {
        return state
      }

      return {
        notesById: {
          ...state.notesById,
          [id]: nextNote,
        },
      }
    })
  },

  deleteNote: (id, persistedSnapshot) => {
    let deletedSnapshot: DeletedNoteSnapshot | undefined

    set((state) => {
      const note = state.notesById[id]
      const index = state.noteIds.indexOf(id)

      if (!note || index === -1) {
        return state
      }

      if (persistedSnapshot && persistedSnapshot.note.id !== id) {
        return state
      }

      const snapshot = persistedSnapshot ?? { note, index }
      deletedSnapshot = snapshot

      const notesById = { ...state.notesById }
      delete notesById[id]

      return {
        notesById,
        noteIds: state.noteIds.filter((noteId) => noteId !== id),
        nextDeletionNumber: state.nextDeletionNumber + 1,
        undoBuffer: [
          ...state.undoBuffer,
          {
            deletionNumber: state.nextDeletionNumber,
            snapshot,
            expiresAt: Date.now() + DELETE_UNDO_WINDOW_MS,
          },
        ],
      }
    })

    return deletedSnapshot
  },

  restoreDeletedNote: (deletionNumber) => {
    set((state) => {
      const entry = state.undoBuffer.find(
        (candidate) => candidate.deletionNumber === deletionNumber,
      )

      if (!entry) {
        return state
      }

      const { note, index } = entry.snapshot

      if (state.notesById[note.id]) {
        return state
      }

      const insertionIndex = Math.max(0, Math.min(index, state.noteIds.length))
      const noteIds = [...state.noteIds]
      noteIds.splice(insertionIndex, 0, note.id)

      return {
        notesById: {
          ...state.notesById,
          [note.id]: note,
        },
        noteIds,
        undoBuffer: state.undoBuffer.filter(
          (candidate) => candidate.deletionNumber !== deletionNumber,
        ),
      }
    })
  },

  discardDeletedNote: (deletionNumber) => {
    set((state) => {
      const undoBuffer = state.undoBuffer.filter(
        (candidate) => candidate.deletionNumber !== deletionNumber,
      )

      return undoBuffer.length === state.undoBuffer.length
        ? state
        : { undoBuffer }
    })
  },
}))
