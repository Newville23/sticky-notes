# Note Deletion and Undo

## Goal

Allow the user to delete a note by dragging it into the delete zone and restore it within a short recovery period.

## Rules

- The delete zone must be visible during note dragging.
- A note is deleted only when `pointerup` occurs inside the delete zone.
- Passing over the delete zone must not delete the note.
- Deletion must remove the note immediately from visible state.
- The deleted note snapshot must remain recoverable for 5 seconds.
- Undo must restore the exact note state, including ID, content, position, dimensions, and background.
- After 5 seconds, the deleted snapshot may be discarded.
- Multiple deleted notes may coexist in the temporary recovery buffer.

## Acceptance Criteria

**Given** an active note drag  
**When** the note is released inside the delete zone  
**Then** the note is immediately removed and an undo action becomes available.

**Given** a note passes over the delete zone  
**When** the pointer is not released  
**Then** the note remains unchanged.

**Given** a deleted note within the 5-second recovery period  
**When** the user triggers undo floatting element 
**Then** the exact deleted note is restored.

**Given** the recovery period has expired  
**When** undo is no longer available  
**Then** the deleted note remains removed and its temporary snapshot is discarded.