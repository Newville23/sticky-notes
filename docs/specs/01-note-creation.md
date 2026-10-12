# Note Creation and Content Entry

## Goal
Allow the user to explicitly create one note at a time using the active toolbar
configuration and immediately enter its content.

## Rules

- default configuration is `S` size and yellow background.
- toolbar allows selecting `S`, `M`, `L`, or `XL` before creation.
- toolbar provides an explicit `Add note` button.
- the `Add note` button is the only note-creation mechanism.
- clicking an empty position inside the canvas must not create a note.
- the first note is centered in the canvas using its selected dimensions.
- subsequent notes use a deterministic diagonal cascading offset from the previous creation position so changing the selected size does not reset or reverse the cascade.
- placement must not depend on the pointer position.
- the complete note must remain inside canvas boundaries.
- each note must receive a unique immutable ID (crypto.randomUUID).
- the new note must be added to both `notesById` and `noteIds`.
- each note provides a text editor for its content.
- the newly created note editor receives focus immediately after mounting.
- note content must be a plain-text string with a maximum length of 2,000 characters.
- the editor must enforce the 2,000-character limit with its native `maxLength` constraint.
- note content containing a null character is invalid and must not replace persisted content.
- note content must be rendered only as a text or form-control value and must never use `innerHTML` or `dangerouslySetInnerHTML`.
- content editing remains local to the note while typing.
- note content is committed to Zustand when the editor loses focus, not on every keystroke.

## Acceptance Criteria

**Given** the default toolbar configuration  
**When** the user activates `Add note`  
**Then** one `S`, yellow note is created at a deterministic position inside the canvas.

**Given** a selected size or color  
**When** the user activates `Add note`  
**Then** the note uses the selected configuration.

**Given** a calculated creation position that would exceed a canvas boundary  
**When** the note is created  
**Then** its initial position is clamped so the complete note remains visible.

**Given** a note already exists  
**When** the user activates `Add note` again  
**Then** the existing note remains unchanged and a new unique note is added.

**Given** a newly created note  
**When** it mounts inside the canvas  
**Then** its content editor receives focus and is ready for text entry.

**Given** a user is typing note content  
**When** the editor value changes  
**Then** no Zustand write occurs for each keystroke.

**Given** edited note content  
**When** the editor loses focus  
**Then** the final content is committed once to that note without rerendering unrelated notes.

**Given** a user is entering note content  
**When** the content reaches 2,000 characters  
**Then** the editor prevents additional characters without writing intermediate content to Zustand.

**Given** note content containing a null character  
**When** an update reaches the content-validation boundary  
**Then** the invalid content is rejected and the last valid persisted content remains unchanged.

**Given** note content that resembles HTML  
**When** the note is rendered  
**Then** the content remains literal plain text and is never interpreted as markup.

**Given** any canvas state  
**When** the user clicks an empty canvas position  
**Then** no note is created.
