# Note Selection and Stacking

## Goal

Allow the user to select a note and explicitly bring it in front of overlapping notes.

## Rules

- At most one note may be selected.
- Primary pointer interaction with a note, or focus entering its editor, selects that note without changing its stacking order.
- A single click on the empty canvas clears the selection; toolbar interaction must not.
- The selected note must have a visible selected state.
- The toolbar must provide a `Bring to front` button that is disabled when no note is selected or the selected note is already frontmost.
- `noteIds` defines stacking order from back to front; the last ID is frontmost.
- Bringing a note to front moves only its ID to the end of `noteIds` and must not change its content, geometry, background, or identity.
- Bringing an already frontmost note to front is a no-op.
- Deleting the selected note clears the selection. Restoring a note does not select it automatically.
- Stacking order must remain independent from toolbar creation cascading and direct-placement history.

## Acceptance Criteria

**Given** overlapping notes and one selected note\
**When** the user activates `Bring to front`\
**Then** the selected note becomes frontmost without changing its note data.

**Given** a note that is not frontmost\
**When** the note is selected\
**Then** its stacking order remains unchanged until the user activates `Bring to front`.

**Given** no selected note or a selected note that is already frontmost\
**When** the toolbar is rendered\
**Then** `Bring to front` is disabled and no reorder can occur.

**Given** a selected note\
**When** it is deleted or the user single-clicks the empty canvas\
**Then** the selection is cleared.

**Given** a note is brought to front\
**When** another note is created from the toolbar\
**Then** toolbar cascade placement remains based on its independent creation history.
