export type Point = readonly [x: number, y: number]

export type Dimensions = readonly [width: number, height: number]

export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface Geometry {
  readonly position: Point
  readonly dimensions: Dimensions
}
