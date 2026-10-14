# Note Deletion and Undo

## Goal

Allow the user to delete a note by dragging it into the delete zone and restore it within a short recovery period.

## Rules

- The delete zone must be visible during note dragging.
- The minimum note dimensions are `160 × 160` pixels.
- Delete eligibility is determined by inclusive rectangle contact between the note's border box and the delete-zone hitbox; percentage occupancy is not used.
- Two rectangles touch when their horizontal and vertical intervals overlap or share a boundary. Exact edge-to-edge and corner-to-corner contact both count.
- The delete-zone hitbox must remain geometrically stable while visible and active presentation styles animate.
- The delete zone becomes active while the note border box and delete-zone hitbox touch.
- A note is deleted only when `pointerup` occurs while the rectangles still touch; the pointer position is irrelevant.
- Passing over the delete zone must not delete the note.
- Releasing while the rectangles are separated commits the drag normally; cancelling the interaction restores its starting position.
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
**When** the note border box overlaps or shares an edge or corner with the delete-zone hitbox and the note is released\
**Then** the note is immediately removed and its individual undo toast becomes available.

**Given** the note border box and delete-zone hitbox are separated, including by as little as one CSS pixel\
**When** the note is released\
**Then** the note is moved normally and is not deleted.

**Given** the note touches or crosses the delete zone during a drag\
**When** it is moved away before release\
**Then** the note is not deleted and its final position is committed normally.

**Given** a deleted note within the 5-second recovery period\
**When** the user activates its undo toast\
**Then** the exact pre-drag note state is restored and only that toast is removed.

**Given** multiple notes deleted during the same recovery period\
**When** their undo notifications are displayed\
**Then** each deletion has an independently actionable and expiring `Undo delete (N)` toast with a stable deletion number.

**Given** the recovery period has expired\
**When** that deletion's undo toast expires\
**Then** the note remains removed and only its corresponding temporary snapshot is discarded.
