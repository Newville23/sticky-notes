# Performance, Reliability and Testing

## Goal

Ensure note interactions remain responsive, predictable, and testable under the supported desktop environment.

## Performance Rules

- `pointermove` must not update React or Zustand state.
- Active coordinates and interaction data must be stored in refs.
- Movement must use CSS `transform`.
- Geometry measurements such as `getBoundingClientRect()` should be performed once at interaction start and cached when possible.
- Global state must be committed only when an interaction completes.
- Updating one note must not rerender unrelated notes.
- The canvas should subscribe primarily to `noteIds`.
- Typing note content must not write to Zustand on every keystroke.
- Content must be committed once when the note editor loses focus.

## Reliability Rules

- Coordinates and dimensions must always contain valid numeric values.
- Notes must never become inaccessible outside canvas boundaries.
- `pointercancel` must safely rollback the active interaction.
- Pointer capture and temporary interaction state must be cleaned up after completion, cancellation, or failure.
- Invalid operations must fail safely without corrupting application state.
- Unrecoverable rendering errors must be handled by an application-level error boundary.

## Testing

Unit tests must cover:

- Geometry and clamping calculations.
- Note creation, update, deletion, and restoration.
- Toolbar creation using the active size and background configuration.
- Deterministic creation placement and boundary clamping.
- Immediate focus of a newly created note editor.
- Local content entry and a single persisted commit when editing finishes.
- Minimum and maximum resize constraints.
- Delete recovery timing and exact snapshot restoration.

Interaction tests must verify:

- Pointer capture lifecycle.
- Drag and resize behavior.
- `pointercancel` rollback.
- No React state updates or Zustand writes during `pointermove`.
- A single state commit on interaction completion.
- Unrelated notes do not rerender when another note changes.
- Empty canvas clicks do not create notes.
- Content keystrokes do not write to Zustand and blur commits once.
- Pointer activity inside the content editor does not start note dragging.

Manual browser smoke tests must run on the latest supported Chrome and Firefox versions at a minimum viewport of `1024 × 768`.

## Acceptance Criteria

**Given** an active drag or resize  
**When** `pointermove` occurs  
**Then** zero React state updates and zero Zustand writes occur; only refs and the active note's DOM styles may change.

**Given** an interaction completes  
**When** `pointerup` occurs  
**Then** the final state is committed once.

**Given** a newly created note  
**When** its editor mounts  
**Then** it receives focus without storing focus state globally.

**Given** an active note editor  
**When** the user types and then moves focus away  
**Then** typing causes no Zustand writes and the final content is committed once on blur.

**Given** invalid geometry or an interrupted interaction  
**When** the operation cannot complete normally  
**Then** the application preserves the last valid persisted state.

**Given** the automated test suite  
**When** it runs  
**Then** core geometry, state operations, interaction behavior pass.
