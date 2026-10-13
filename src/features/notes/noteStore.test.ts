import { MAX_NOTE_CONTENT_LENGTH, type Note } from '../../domain'
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
      undoBuffer: [],
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

  it('rejects invalid content updates without replacing persisted content', () => {
    const { createNote, updateNote } = useNoteStore.getState()
    const id = createNote({ ...firstNoteInput, content: 'Persisted content' })
    const beforeUpdate = useNoteStore.getState()

    updateNote(id, { content: 'invalid\0content' })
    updateNote(id, { content: 'a'.repeat(MAX_NOTE_CONTENT_LENGTH + 1) })

    expect(useNoteStore.getState()).toBe(beforeUpdate)
    expect(useNoteStore.getState().notesById[id].content).toBe(
      'Persisted content',
    )
  })

  it('rejects invalid content before creating a note', () => {
    const { createNote } = useNoteStore.getState()
    const nonStringContent = {
      ...firstNoteInput,
      content: 42,
    } as unknown as CreateNoteInput

    expect(() => createNote(nonStringContent)).toThrow(TypeError)
    expect(() =>
      createNote({ ...firstNoteInput, content: 'invalid\0content' }),
    ).toThrow(RangeError)
    expect(() =>
      createNote({
        ...firstNoteInput,
        content: 'a'.repeat(MAX_NOTE_CONTENT_LENGTH + 1),
      }),
    ).toThrow(RangeError)
    expect(useNoteStore.getState().noteIds).toHaveLength(0)
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
    expect(useNoteStore.getState().undoBuffer).toHaveLength(1)
    expect(useNoteStore.getState().undoBuffer[0].snapshot).toEqual(snapshot)

    if (!snapshot) {
      throw new Error('Expected the deleted note snapshot')
    }

    restoreNote(snapshot)

    expect(useNoteStore.getState().notesById[firstId]).toBe(deletedNote)
    expect(useNoteStore.getState().noteIds).toEqual([firstId, secondId])
    expect(useNoteStore.getState().undoBuffer).toHaveLength(0)
  })

  it('keeps multiple deleted snapshots ordered and discards them independently', () => {
    const { createNote, deleteNote, discardDeletedNote } =
      useNoteStore.getState()
    const firstId = createNote(firstNoteInput)
    const secondId = createNote(secondNoteInput)

    deleteNote(firstId)
    deleteNote(secondId)

    expect(
      useNoteStore
        .getState()
        .undoBuffer.map(({ snapshot }) => snapshot.note.id),
    ).toEqual([firstId, secondId])

    discardDeletedNote(firstId)

    expect(
      useNoteStore
        .getState()
        .undoBuffer.map(({ snapshot }) => snapshot.note.id),
    ).toEqual([secondId])
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
