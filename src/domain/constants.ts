import type { Dimensions } from './geometry'

export const NOTE_SIZE_PRESETS = {
  S: [160, 160],
  M: [220, 220],
  L: [300, 300],
  XL: [380, 380],
} as const satisfies Record<string, Dimensions>

export type NoteSizePreset = keyof typeof NOTE_SIZE_PRESETS

export const MIN_NOTE_SIZE = [160, 160] as const satisfies Dimensions

export const NOTE_BACKGROUNDS = ['yellow', 'green', 'red'] as const

export type NoteBackground = (typeof NOTE_BACKGROUNDS)[number]

export const DEFAULT_NOTE_SIZE_PRESET: NoteSizePreset = 'S'
export const DEFAULT_NOTE_BACKGROUND: NoteBackground = 'yellow'
export const DEFAULT_NOTE_CONTENT = ''
export const MAX_NOTE_CONTENT_LENGTH = 2_000
export const NOTE_CREATION_CASCADE_OFFSET = 24

export const DELETE_UNDO_WINDOW_MS = 5_000
export const DELETE_ZONE_OCCUPANCY_THRESHOLD = 0.75
