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

- Implement pointer capture and drag session refs.
- Mutate `transform` directly during movement.
- Commit the final position on `pointerup`.
- Handle rollback on `pointercancel`.

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

- Add unit tests for geometry and store behavior.
- Add interaction tests for create, drag, resize, delete, undo, and cancellation.
- Verify narrow rerenders and no state writes during `pointermove`.
- Run smoke tests in supported Chrome and Firefox environments.