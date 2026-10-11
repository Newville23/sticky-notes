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
- Minimum and maximum resize constraints.
- Delete recovery timing and exact snapshot restoration.

Interaction tests must verify:

- Pointer capture lifecycle.
- Drag and resize behavior.
- `pointercancel` rollback.
- No Zustand writes during `pointermove`.
- A single state commit on interaction completion.
- Unrelated notes do not rerender when another note changes.

Browser smoke tests must run on the latest supported Chrome and Firefox versions at a minimum viewport of `1024 × 768`.

## Acceptance Criteria

**Given** an active drag or resize  
**When** `pointermove` occurs  
**Then** no React or Zustand state update is triggered.

**Given** an interaction completes  
**When** `pointerup` occurs  
**Then** the final state is committed once.

**Given** invalid geometry or an interrupted interaction  
**When** the operation cannot complete normally  
**Then** the application preserves the last valid persisted state.

**Given** the automated test suite  
**When** it runs  
**Then** core geometry, state operations, interaction behavior, and supported-browser smoke tests pass.