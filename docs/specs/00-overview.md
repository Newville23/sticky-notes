# Sticky Notes - Overview

## Objective 
Build a minimal single page application sticky notes web application where users can create, move, edit, resize and delete notes inside a bounded canvas.

The application must prioritize, simplicity, predictability, small bundle size and high runtime performance.

## Scope
The application must support:
- creating a note at a time inside the canvas.
- selecting a note size from S, M, L or XL.
- selecting a note color background from yellow, green and red.
- default node configuration: S size and yellow background.
- editing note color and size.
- moving notes through drag interactions.
- resizing notes through drag interactions.
- deleting notes by dragging them into a visible delete zone.
- undoing a deletion for up to 5 seconds.

Out of scoope:
- persistence between sessions with local storage.
- entering/editing note text.
- multi selection.
- undo/redo history.
- zooming or panning.
- mobile interactions

## Technology:
- React
- Typescript
- Vite
- Zustand
- Vanilla CSS

The application should not use external libraries or stock components.

## Domain Model
Note is the primary domain entity.
```
type NoteId = string;

type Point = [ x: number, y: number];
type Dimensions = [width: number, height: number];

interface Note {
  id: NoteId;
  content: string;
  position: Point;
  dimensions: Dimensions;
  background: string;
}
```
In the system Coordinates and diemensions must always contain valid numeric values. Values like `null` and `undefined` must not represent valid geometry.

## State Model
The application must use a persisted state described by the following interface:

```
interface NoteState {
  notesById: Record<NoteId, Note>;
  noteIds: NoteId[];
}
```
The canvas component should subscribe primarilly to the noteIds slice. In the other hand Notes will be individually subscribe only to their own state using the ID as key. Lastly ephemeral interactions such as active pointer position, cached geometry, and drag coordinates must remain out of the global state.

## interactions Rules
For the core interactions such as dragging and resizing application must use pointer events.

During a pointer event the application:
- not update the react state.
- not update the zustand staet.
- store current cccoordinates in refs.
- visual movements are applied directly to the DOM.
- use CSS transform for note movement.
- geometry reads such as getBoundingClientRect() must not occur repeatedly.

The lifecycle interactions are described as follow:
```
pointerdown
1 cache geometry
2 capture pointer
3 initialize interaction

pointermove
1 calculate
2 clamp
3 mutate DOM

pointerup
1 persist final state
2 release pointer
3 clear interaction

pointercancel
1 rollback
2 clear interaction
```

## Geometry Rules
Notes must remain within canvas boundaries. Position calculations must use pure TypeScript geometry utilities, and clamping must account for both canvas and note dimensions. For example:
```
x = Math.max(0, Math.min(x, canvasWidth - noteWidth));
```

## Styling Conventions

Use vanilla CSS with BEM naming conventions. Keep styles colocated with their React components.
Use semantic BEM modifiers for interaction states such as dragging or active delete zones.
Use CSS variables or direct style mutation for dynamic geometry such as position and dimensions.
Avoid deep selector nesting and utility-style visual modifier names.

## Architecture
For the architecture point of view the application should use a shallow pattern, and a feature oriented architecture for defining the layers. For example:
```
src/
├── domain/
│   └── note.ts
├── features/
│   └── notes/
│       ├── geometry.ts
│       ├── noteStore.ts
│       ├── useDrag.ts
│       ├── useResize.ts
│       ├── Note.tsx
│       └── NoteCanvas.tsx
├── components/
│   └── Toolbar.tsx
└── App.tsx
```
Custom hooks should orchestrate interactions, while calculation logic should remain independent from React event handling. In addition, module boundaries should use explicit TypeScript interfaces whenever a contract improves separation and testability. However, the architecture should avoid unnecessary layers and deep folder structures.

## Non Functional Requirements
For this application performance is high priority requirement. To remain it during an active drag action the react states must keep unmodified.
```
0 React state updates
0 Zustand writes
0 repeated layout measurements
1 geometry calculation per processed movement
1 DOM transform update
```
And only when the interaction is complete the application commit changes to global state. Finally the rendering should be scoped so updating one note does not rerender unrelated notes.

## Deletion and undo
Dropping a note inside the delete zone removes it immediately from visible state.

Deleted notes must remain recoverable for up to 5 seconds. During this period, the user must be able to undo the deletion and restore the note to its exact previous state, including its content, position, dimensions, background, and identifier with the help of its snapshot.

A note must be deleted only when the pointer is released inside the delete zone. Moving a note over the delete zone without releasing it must not delete the note.

## Reliability
The application must prevent invalid geometry from entering state. Note positions and dimensions must remain valid numeric values, and notes must remain accessible within the canvas boundaries.

Pointer cancellation must be handled gracefully. The application must release pointer capture, clear temporary interaction state, and restore the note to its pre interaction state when necessary.

Interaction calculations must be deterministic and must not produce uncaught errors. Resources created during an interaction must be cleaned up when the interaction ends, is cancelled, or fails.

Errors that cannot be safely recovered locally should be handled by an application level error boundary.

## Supported Environment
The application targets desktop browsers only. The minimum supported viewport is 1024 × 768. The application must support the latest stable versions of Google Chrome and Mozilla Firefox.

## Definition of Done
The application is complete when all feature specifications pass their acceptance criteria and the following conditions are met:

- users can create, edit, move, resize, delete, and restore notes.
- notes cannot leave the canvas or become inaccessible.
- drag interactions do not trigger global state writes until the interaction is complete.
- updating one note does not rerender unrelated notes.
- deletion undo restores the exact deleted note snapshot within the 5-second recovery period.
- the application works correctly in the supported browsers and viewport sizes.

## Testing Strategy
Testing should focus primarily on unit tests for core modules and targeted interaction tests.
Unit test geometry utilities, including clamping, resizing, boundary calculations, and invalid input handling.

Verify that pointer movement does not write to React or Zustand state until interaction completion. Verify that updating one note does not rerender unrelated notes.

Run a small browser smoke-test suite in the supported Chrome and Firefox versions at the minimum viewport size.

