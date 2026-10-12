export {
  useNoteStore,
  type CreateNoteInput,
  type DeletedNoteSnapshot,
  type NoteActions,
  type NoteChanges,
  type NoteState,
  type NoteStore,
} from './noteStore'
export {
  calculateDragPosition,
  calculateResizeDimensions,
  clamp,
  clampPosition,
  getResizeConstraints,
  isFinitePoint,
  isValidDimensions,
  type CalculateDragPositionParams,
  type CalculateResizeDimensionsParams,
  type ResizeConstraints,
} from './geometry'
