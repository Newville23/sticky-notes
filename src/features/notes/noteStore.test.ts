import type { Note } from '../../domain'
import { useNoteStore, type CreateNoteInput } from './noteStore'

const firstNoteInput: CreateNoteInput = {
  content: '',
  position: [10, 20],
  dimensions: [160, 160],
  background: 'yellow',
}

const secondNoteInput: CreateNoteInput = {
  content: '',
  position: [40, 50],
  dimensions: [220, 220],
  background: 'green',
}

describe('noteStore', () => {
  beforeEach(() => {
    useNoteStore.setState({
      notesById: {},
      noteIds: [],
    })
  })

  it('creates notes in normalized state with unique IDs', () => {
    const { createNote } = useNoteStore.getState()

    const firstId = createNote(firstNoteInput)
    const secondId = createNote(secondNoteInput)
    const state = useNoteStore.getState()

    expect(firstId).not.toBe(secondId)
    expect(state.noteIds).toEqual([firstId, secondId])
    expect(state.notesById[firstId]).toEqual({ id: firstId, ...firstNoteInput })
    expect(state.notesById[secondId]).toEqual({
      id: secondId,
      ...secondNoteInput,
    })
  })

  it('updates only the targeted note and preserves the ID list', () => {
    const { createNote, updateNote } = useNoteStore.getState()
    const firstId = createNote(firstNoteInput)
    const secondId = createNote(secondNoteInput)
    const beforeUpdate = useNoteStore.getState()
    const untouchedNote = beforeUpdate.notesById[secondId]

    updateNote(firstId, {
      position: [80, 90],
      background: 'red',
    })

    const afterUpdate = useNoteStore.getState()
    expect(afterUpdate.notesById[firstId]).toMatchObject({
      id: firstId,
      position: [80, 90],
      background: 'red',
    })
    expect(afterUpdate.notesById[secondId]).toBe(untouchedNote)
    expect(afterUpdate.noteIds).toBe(beforeUpdate.noteIds)
  })

  it('does not publish state changes for missing notes or identical values', () => {
    const { createNote, updateNote } = useNoteStore.getState()
    const id = createNote(firstNoteInput)
    const beforeUpdate = useNoteStore.getState()

    updateNote('missing-note', { background: 'red' })
    updateNote(id, { background: 'yellow' })

    expect(useNoteStore.getState()).toBe(beforeUpdate)
  })

  it('deletes a note and restores its exact snapshot and ordering', () => {
    const { createNote, deleteNote, restoreNote } = useNoteStore.getState()
    const firstId = createNote(firstNoteInput)
    const secondId = createNote(secondNoteInput)
    const deletedNote = useNoteStore.getState().notesById[firstId]

    const snapshot = deleteNote(firstId)

    expect(snapshot).toEqual({ note: deletedNote, index: 0 })
    expect(useNoteStore.getState().notesById[firstId]).toBeUndefined()
    expect(useNoteStore.getState().noteIds).toEqual([secondId])

    if (!snapshot) {
      throw new Error('Expected the deleted note snapshot')
    }

    restoreNote(snapshot)

    expect(useNoteStore.getState().notesById[firstId]).toBe(deletedNote)
    expect(useNoteStore.getState().noteIds).toEqual([firstId, secondId])
  })

  it('does not overwrite a note when restoring a duplicate ID', () => {
    const { createNote, restoreNote } = useNoteStore.getState()
    const id = createNote(firstNoteInput)
    const beforeRestore = useNoteStore.getState()
    const conflictingNote: Note = {
      ...secondNoteInput,
      id,
    }

    restoreNote({ note: conflictingNote, index: 0 })

    expect(useNoteStore.getState()).toBe(beforeRestore)
    expect(useNoteStore.getState().notesById[id]).toEqual({
      id,
      ...firstNoteInput,
    })
  })
})
