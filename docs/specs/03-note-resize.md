# Note Resize

## Goal

Allow the user to resize an existing note by dragging its resize handle.

## Rules

- Resizing starts on `pointerdown` over the resize handle.
- Pointer capture must be used during the interaction.
- Initial pointer position, note dimensions, note position, and canvas bounds must be cached at resize start.
- `pointermove` must update width and height directly on the note element.
- React and Zustand state must not be updated during resizing.
- Note dimensions must respect the minimum allowed size.
- Resizing must not cause the note to exceed canvas boundaries.
- Final dimensions must be committed to global state only on `pointerup`.
- `pointercancel` must restore the persisted dimensions.

## Acceptance Criteria

**Given** an existing note  
**When** the user drags its resize handle and releases  
**Then** the note dimensions change visually and the final dimensions are persisted once.

**Given** a resize below the minimum size  
**When** the pointer moves beyond the allowed minimum  
**Then** the note dimensions are clamped to the minimum size.

**Given** a resize that would exceed the canvas  
**When** the pointer moves beyond the available space  
**Then** the dimensions are clamped to the maximum available width and height.

**Given** an active resize  
**When** `pointermove` occurs  
**Then** no React state or Zustand state update is triggered.

**Given** an active resize  
**When** `pointercancel` occurs  
**Then** the note returns to its last persisted dimensions.