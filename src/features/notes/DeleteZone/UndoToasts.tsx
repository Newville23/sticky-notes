import { memo, useEffect } from 'react'
import { useNoteStore, type UndoBufferEntry } from '../noteStore'

interface UndoToastProps {
  readonly entry: UndoBufferEntry
  readonly onDiscard: (deletionNumber: number) => void
  readonly onRestore: (deletionNumber: number) => void
}

const UndoToast = memo(function UndoToast({
  entry,
  onDiscard,
  onRestore,
}: UndoToastProps) {
  const handleUndo = () => {
    if (entry.expiresAt <= Date.now()) {
      onDiscard(entry.deletionNumber)
      return
    }

    onRestore(entry.deletionNumber)
  }

  return (
    <button className="undo-toast" type="button" onClick={handleUndo}>
      Undo delete ({entry.deletionNumber})
    </button>
  )
})

export const UndoToasts = memo(function UndoToasts() {
  const undoBuffer = useNoteStore((state) => state.undoBuffer)
  const discardDeletedNote = useNoteStore((state) => state.discardDeletedNote)
  const restoreDeletedNote = useNoteStore((state) => state.restoreDeletedNote)

  useEffect(() => {
    const timeoutIds = undoBuffer.map(({ deletionNumber, expiresAt }) =>
      window.setTimeout(
        () => discardDeletedNote(deletionNumber),
        Math.max(0, expiresAt - Date.now()),
      ),
    )

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [discardDeletedNote, undoBuffer])

  if (undoBuffer.length === 0) {
    return null
  }

  const latestDeletionNumber = undoBuffer.at(-1)?.deletionNumber

  return (
    <>
      <div className="undo-toasts" aria-label="Deleted notes">
        {undoBuffer.map((entry) => (
          <UndoToast
            key={entry.deletionNumber}
            entry={entry}
            onDiscard={discardDeletedNote}
            onRestore={restoreDeletedNote}
          />
        ))}
      </div>
      <div
        className="undo-toasts__announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Note deleted. Undo delete ({latestDeletionNumber}) is available for 5
        seconds.
      </div>
    </>
  )
})
