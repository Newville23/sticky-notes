# Note Creation

## Goal
Allow the user to create one note at a time inside the canvas using the active toolbar configuration.

## Rules

- default configuration is `S` size and yellow background.
- toolbar allows selecting `S`, `M`, `L`, or `XL` before creation.
- a note is created by clicking an empty position inside the canvas.
- the pointer position determines the initial note position.
- the complete note must remain inside canvas boundaries.
- each note must receive a unique immutable ID (crypto.randomUUID).
- the new note must be added to both `notesById` and `noteIds`.

## Acceptance Criteria

**Given** the default toolbar configuration  
**When** the user clicks inside the canvas  
**Then** one `S`, yellow note is created at the calculated pointer position.

**Given** a selected size or color  
**When** a note is created  
**Then** the note uses the selected configuration.

**Given** a creation position near a canvas boundary  
**When** the note would exceed the canvas  
**Then** its initial position is clamped so the complete note remains visible.

**Given** a note already exists  
**When** another note is created  
**Then** the existing note remains unchanged and a new unique note is added.