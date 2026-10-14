import {
  MIN_NOTE_SIZE,
  NOTE_CREATION_CASCADE_OFFSET,
  type Dimensions,
  type Point,
  type Rect,
} from '../../domain'

export interface ResizeConstraints {
  readonly minimum: Dimensions
  readonly maximum: Dimensions
}

export interface CalculateDragPositionParams {
  readonly initialPosition: Point
  readonly initialPointerPosition: Point
  readonly currentPointerPosition: Point
  readonly noteDimensions: Dimensions
  readonly canvasDimensions: Dimensions
}

export interface CalculateResizeDimensionsParams {
  readonly initialDimensions: Dimensions
  readonly initialPointerPosition: Point
  readonly currentPointerPosition: Point
  readonly notePosition: Point
  readonly canvasDimensions: Dimensions
  readonly minimumDimensions?: Dimensions
}

export interface CalculateNoteCreationPositionParams {
  readonly noteDimensions: Dimensions
  readonly canvasDimensions: Dimensions
  readonly strategy: NoteCreationPositionStrategy
}

export type NoteCreationPositionStrategy =
  | {
      readonly type: 'cascade'
      readonly previousPosition?: Point
      readonly offset?: number
    }
  | {
      readonly type: 'direct'
      readonly center: Point
    }

export function isFinitePoint(value: unknown): value is Point {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  )
}

export function isValidDimensions(value: unknown): value is Dimensions {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    value[0] >= 0 &&
    Number.isFinite(value[1]) &&
    value[1] >= 0
  )
}

export function calculateRectIntersection(first: Rect, second: Rect): Rect {
  assertRect(first, 'First rectangle')
  assertRect(second, 'Second rectangle')

  const x = Math.max(first.x, second.x)
  const y = Math.max(first.y, second.y)
  const right = Math.min(first.x + first.width, second.x + second.width)
  const bottom = Math.min(first.y + first.height, second.y + second.height)

  return {
    x,
    y,
    width: Math.max(0, right - x),
    height: Math.max(0, bottom - y),
  }
}

export function calculateDeleteZoneOccupancy(
  noteRect: Rect,
  deleteZoneRect: Rect,
): number {
  assertRect(noteRect, 'Note rectangle')
  assertRect(deleteZoneRect, 'Delete-zone rectangle')

  const deleteZoneArea = deleteZoneRect.width * deleteZoneRect.height

  if (deleteZoneArea === 0) {
    return 0
  }

  const intersection = calculateRectIntersection(noteRect, deleteZoneRect)

  return (intersection.width * intersection.height) / deleteZoneArea
}

export function clamp(value: number, minimum: number, maximum: number): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(minimum) ||
    !Number.isFinite(maximum)
  ) {
    throw new RangeError('Clamp values must be finite numbers')
  }

  if (minimum > maximum) {
    throw new RangeError('Clamp minimum cannot exceed maximum')
  }

  return Math.min(Math.max(value, minimum), maximum)
}

export function clampPosition(
  position: Point,
  noteDimensions: Dimensions,
  canvasDimensions: Dimensions,
): Point {
  assertPoint(position, 'Position')
  assertDimensions(noteDimensions, 'Note dimensions')
  assertDimensions(canvasDimensions, 'Canvas dimensions')

  const [x, y] = position
  const [noteWidth, noteHeight] = noteDimensions
  const [canvasWidth, canvasHeight] = canvasDimensions
  const maximumX = Math.max(0, canvasWidth - noteWidth)
  const maximumY = Math.max(0, canvasHeight - noteHeight)

  return [clamp(x, 0, maximumX), clamp(y, 0, maximumY)]
}

export function calculateNoteCreationPosition({
  noteDimensions,
  canvasDimensions,
  strategy,
}: CalculateNoteCreationPositionParams): Point {
  assertDimensions(noteDimensions, 'Note dimensions')
  assertDimensions(canvasDimensions, 'Canvas dimensions')

  const [noteWidth, noteHeight] = noteDimensions
  const [canvasWidth, canvasHeight] = canvasDimensions
  const centeredPosition: Point = [
    (canvasWidth - noteWidth) / 2,
    (canvasHeight - noteHeight) / 2,
  ]
  let position: Point

  if (strategy.type === 'direct') {
    assertPoint(strategy.center, 'Direct-placement center')
    position = [
      strategy.center[0] - noteWidth / 2,
      strategy.center[1] - noteHeight / 2,
    ]
  } else {
    const offset = strategy.offset ?? NOTE_CREATION_CASCADE_OFFSET

    if (strategy.previousPosition) {
      assertPoint(strategy.previousPosition, 'Previous position')
    }

    if (!Number.isFinite(offset) || offset < 0) {
      throw new RangeError(
        'Cascade offset must be a finite, non-negative number',
      )
    }

    position = strategy.previousPosition
      ? [
          strategy.previousPosition[0] + offset,
          strategy.previousPosition[1] + offset,
        ]
      : centeredPosition
  }

  return clampPosition(position, noteDimensions, canvasDimensions)
}

export function calculateDragPosition({
  initialPosition,
  initialPointerPosition,
  currentPointerPosition,
  noteDimensions,
  canvasDimensions,
}: CalculateDragPositionParams): Point {
  assertPoint(initialPosition, 'Initial position')
  assertPoint(initialPointerPosition, 'Initial pointer position')
  assertPoint(currentPointerPosition, 'Current pointer position')

  const [initialX, initialY] = initialPosition
  const [pointerStartX, pointerStartY] = initialPointerPosition
  const [pointerX, pointerY] = currentPointerPosition

  return clampPosition(
    [initialX + pointerX - pointerStartX, initialY + pointerY - pointerStartY],
    noteDimensions,
    canvasDimensions,
  )
}

export function getResizeConstraints(
  position: Point,
  canvasDimensions: Dimensions,
  minimumDimensions: Dimensions = MIN_NOTE_SIZE,
): ResizeConstraints {
  assertPoint(position, 'Position')
  assertDimensions(canvasDimensions, 'Canvas dimensions')
  assertDimensions(minimumDimensions, 'Minimum dimensions')

  const [x, y] = position
  const [canvasWidth, canvasHeight] = canvasDimensions
  const [minimumWidth, minimumHeight] = minimumDimensions
  const maximumWidth = Math.max(0, canvasWidth - Math.max(0, x))
  const maximumHeight = Math.max(0, canvasHeight - Math.max(0, y))

  return {
    minimum: [
      Math.min(minimumWidth, maximumWidth),
      Math.min(minimumHeight, maximumHeight),
    ],
    maximum: [maximumWidth, maximumHeight],
  }
}

export function calculateResizeDimensions({
  initialDimensions,
  initialPointerPosition,
  currentPointerPosition,
  notePosition,
  canvasDimensions,
  minimumDimensions = MIN_NOTE_SIZE,
}: CalculateResizeDimensionsParams): Dimensions {
  assertDimensions(initialDimensions, 'Initial dimensions')
  assertPoint(initialPointerPosition, 'Initial pointer position')
  assertPoint(currentPointerPosition, 'Current pointer position')

  const { minimum, maximum } = getResizeConstraints(
    notePosition,
    canvasDimensions,
    minimumDimensions,
  )
  const [initialWidth, initialHeight] = initialDimensions
  const [pointerStartX, pointerStartY] = initialPointerPosition
  const [pointerX, pointerY] = currentPointerPosition

  return [
    clamp(initialWidth + pointerX - pointerStartX, minimum[0], maximum[0]),
    clamp(initialHeight + pointerY - pointerStartY, minimum[1], maximum[1]),
  ]
}

function assertPoint(value: Point, label: string): void {
  if (!isFinitePoint(value)) {
    throw new RangeError(`${label} must contain two finite coordinates`)
  }
}

function assertDimensions(value: Dimensions, label: string): void {
  if (!isValidDimensions(value)) {
    throw new RangeError(
      `${label} must contain two finite, non-negative dimensions`,
    )
  }
}

function assertRect(value: Rect, label: string): void {
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.width) ||
    value.width < 0 ||
    !Number.isFinite(value.height) ||
    value.height < 0
  ) {
    throw new RangeError(
      `${label} must contain finite coordinates and non-negative dimensions`,
    )
  }
}
