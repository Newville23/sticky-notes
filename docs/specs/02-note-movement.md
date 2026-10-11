# Note Movement

## Goal

Allow the user to move an existing note within the canvas by dragging it.

## Rules

- Dragging starts on `pointerdown`.
- Pointer capture must be used during the interaction.
- Initial pointer position, note position, note bounds, and canvas bounds must be cached at drag start.
- `pointermove` must update the note visually using `transform`.
- During `pointermove`, there must be zero React state updates and zero Zustand writes.
- `pointermove` may update only interaction refs and the active note's DOM styles.
- Note coordinates must be clamped so the full note remains inside the canvas.
- Final coordinates must be committed to global state only on `pointerup`.
- `pointercancel` must restore the persisted position and clear the interaction.

## Acceptance Criteria

**Given** a note inside the canvas  
**When** the user drags it to a valid position and releases the pointer  
**Then** the note moves visually during the drag and its final position is persisted once.

**Given** a drag that would move the note outside the canvas  
**When** the pointer moves beyond the allowed boundary  
**Then** the note is clamped to the nearest valid position.

**Given** an active drag  
**When** `pointermove` occurs  
**Then** no React state or Zustand state update is triggered.

**Given** an active drag  
**When** `pointercancel` occurs  
**Then** the note returns to its last persisted position.