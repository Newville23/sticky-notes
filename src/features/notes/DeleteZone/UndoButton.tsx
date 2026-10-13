import { memo, useEffect } from 'react'
import { useNoteStore } from '../noteStore'

export const UndoButton = memo(function UndoButton() {
  const undoBuffer = useNoteStore((state) => state.undoBuffer)
  const discardDeletedNote = useNoteStore((state) => state.discardDeletedNote)
  const restoreNote = useNoteStore((state) => state.restoreNote)

  useEffect(() => {
    const timeoutIds = undoBuffer.map(({ snapshot, expiresAt }) =>
      window.setTimeout(
        () => discardDeletedNote(snapshot.note.id),
        Math.max(0, expiresAt - Date.now()),
      ),
    )

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [discardDeletedNote, undoBuffer])

  const latestEntry = undoBuffer.at(-1)

  if (!latestEntry) {
    return null
  }

  const countLabel = undoBuffer.length > 1 ? ` (${undoBuffer.length})` : ''
  const handleUndo = () => {
    if (latestEntry.expiresAt <= Date.now()) {
      discardDeletedNote(latestEntry.snapshot.note.id)
      return
    }

    restoreNote(latestEntry.snapshot)
  }

  return (
    <button
      className="undo-button"
      type="button"
      onClick={handleUndo}
      aria-label="Undo last note deletion"
    >
      Undo delete{countLabel}
    </button>
  )
})
