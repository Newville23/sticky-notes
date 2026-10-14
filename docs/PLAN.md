# Sticky Notes — Implementation Plan

## 1. Foundation
- Configure Prettier and bind it to EsLint.
- Configure vitest, jsdom and react testing library for test strategy.
- Configure Zustand, and vanilla CSS with BEM pattern.
- Define domain types, size presets, IDs, geometry contracts, and shared constants with Typescript.
  ```
    const NOTE_SIZE_PRESETS = {
    S: [160, 160],
    M: [220, 220],
    L: [300, 300],
    XL: [380, 380],
  } as const;

  const MIN_NOTE_SIZE = [120, 120] as const;
  ```
- Add the application error boundary.

## 2. State and Geometry

- Implement `notesById` and `noteIds`.
- Add create, update, delete, and restore actions.
- Implement pure geometry utilities for positioning, clamping, movement, and resize constraints.

## 3. Note Creation

- Build canvas and toolbar components.
- Support default `S` / yellow configuration.
- Create notes with `Add Note` btn and clamp them inside the canvas.

## 4. Note Movement

- Start dragging only from the draggable note surface; pointer activity inside the content editor must not initiate a drag.
- Implement pointer capture and cache the initial pointer position, note position, note bounds, and canvas bounds in drag session refs.
- Mutate `transform` directly during movement.
- Keep React state and Zustand unchanged during `pointermove`.
- Clamp movement so the complete note remains inside the canvas.
- Commit the final position exactly once on `pointerup` and release pointer capture.
- Handle rollback, pointer-capture release, and interaction cleanup on `pointercancel`.

## 5. Note Resize

- Add resize handle interaction.
- Mutate dimensions directly during movement.
- Enforce minimum size and canvas boundaries.
- Commit dimensions on completion.

## 6. Delete and Undo

- Add the delete zone during dragging.
- Delete on drop inside the zone.
- Store deleted snapshots temporarily.
- Support undo for 5 seconds.

## 7. Validation

- Add unit tests for geometry, creation placement and cascading, store behavior, resize constraints, deletion snapshots, and undo timing.
- Verify toolbar creation with the active configuration, centered and clamped placement, mixed-size cascading, and no creation from single empty-canvas clicks.
- Verify that newly created note editors receive focus and that editor pointer activity does not initiate dragging.
- Verify plain-text content validation, the 2,000-character limit, null-character rejection, and literal rendering of HTML-like content without `innerHTML` or `dangerouslySetInnerHTML`.
- Verify that typing causes zero Zustand writes and that blur commits valid content exactly once without rerendering unrelated notes.
- Add interaction tests for pointer capture, drag, resize, delete, undo, and `pointercancel` rollback and cleanup.
- Verify zero React state updates, zero Zustand writes, and no repeated layout measurements during `pointermove`.
- Verify a single global-state commit on interaction completion and narrow rerenders so updating one note does not rerender unrelated notes.
- Run smoke tests in the latest stable Chrome and Firefox at the minimum supported viewport of `1024 × 768`.

## 8. Delete-Zone Occupancy Refinement

- Increase the minimum note dimensions from `120 × 120` to `160 × 160` pixels.
- Add pure geometry utilities for rectangle intersection and delete-zone occupancy.
- Replace pointer-based deletion detection with note-rectangle occupancy using a `5%` threshold.
- Cache the delete-zone bounds at drag start and derive the moving note rectangle without layout reads during `pointermove`.
- Activate the delete zone when the threshold is reached, but delete only on `pointerup`.
- Commit movement normally below the threshold and preserve cancellation rollback and pointer-capture cleanup.
- Store the pre-drag persisted note snapshot for undo.
- Add geometry and interaction tests for threshold boundaries, minimum-size feasibility, deletion, non-deletion, cancellation, and undo restoration.

## 9. Canvas Double-Click Creation Refinement

- Add pure geometry for cursor-centered note placement with canvas-boundary clamping.
- Add an explicit creation-position strategy so direct placement remains independent from toolbar cascading.
- Create one note on a primary-button double-click directly on the empty canvas.
- Use the active toolbar size and color and focus the new note editor immediately.
- Ignore double-clicks from notes, editors, resize handles, toolbar controls, the delete zone, or active pointer interactions.
- Keep single empty-canvas clicks inactive and allow direct placement to overlap existing notes.
- Add geometry and interaction tests for centered placement, edge clamping, selected attributes, event scoping, cascade independence, focus, and exactly-one-note creation.

## 10. Individual Undo Toasts

- Extend each undo-buffer entry with a stable, monotonically increasing session deletion number.
- Replace the single latest-deletion undo button with one `Undo delete (N)` toast per recoverable deletion.
- Render toasts in a predictable stack and associate each action with its exact deleted-note snapshot.
- Restore only the selected toast's note and remove only that undo-buffer entry.
- Expire and clean up each toast and snapshot independently after 5 seconds.
- Announce new undo notifications through a polite live region without moving keyboard focus.
- Add store, timer, interaction, ordering, accessibility, and cleanup tests for multiple simultaneous undo toasts.
