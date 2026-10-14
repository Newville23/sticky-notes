# Note Deletion and Undo

## Goal

Allow the user to delete a note by dragging it into the delete zone and restore it within a short recovery period.

## Rules

- The delete zone must be visible during note dragging.
- The minimum note dimensions are `160 × 160` pixels.
- Delete-zone occupancy is `intersection area(note, zone) / area(zone)`, using the note's border box.
- The delete zone becomes active when occupancy reaches `75%`.
- A note is deleted only when `pointerup` occurs while occupancy is at least `75%`; the pointer position is irrelevant.
- Passing over the delete zone must not delete the note.
- Releasing below the threshold commits the drag normally; cancelling the interaction restores its starting position.
- Deletion must remove the note immediately from visible state.
- Each deletion must dispatch its own undo toast and remain recoverable for 5 seconds.
- Each toast must display `Undo delete (N)`, where `N` is the deletion's stable, monotonically increasing order within the current application session.
- Toasts must be displayed in a predictable stack and expire independently.
- Activating a toast must restore only its associated note and remove that toast.
- Undo must restore the exact pre-drag persisted note state, including ID, content, position, dimensions, and background.
- After 5 seconds, the corresponding toast and deleted snapshot must be discarded.
- Multiple deleted notes may coexist in the temporary recovery buffer.
- Undo notifications must be exposed through a polite live region without moving keyboard focus.

## Acceptance Criteria

**Given** an active note drag\
**When** at least 75% of the delete zone is covered by the note and the note is released\
**Then** the note is immediately removed and its individual undo toast becomes available.

**Given** occupancy is below 75%\
**When** the note is released\
**Then** the note is moved normally and is not deleted.

**Given** a deleted note within the 5-second recovery period\
**When** the user activates its undo toast\
**Then** the exact pre-drag note state is restored and only that toast is removed.

**Given** multiple notes deleted during the same recovery period\
**When** their undo notifications are displayed\
**Then** each deletion has an independently actionable and expiring `Undo delete (N)` toast with a stable deletion number.

**Given** the recovery period has expired\
**When** that deletion's undo toast expires\
**Then** the note remains removed and only its corresponding temporary snapshot is discarded.
