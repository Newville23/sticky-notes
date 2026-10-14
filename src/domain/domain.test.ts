import {
  DEFAULT_NOTE_BACKGROUND,
  DEFAULT_NOTE_SIZE_PRESET,
  DELETE_UNDO_WINDOW_MS,
  MAX_NOTE_CONTENT_LENGTH,
  MIN_NOTE_SIZE,
  NOTE_BACKGROUNDS,
  NOTE_SIZE_PRESETS,
  createNoteId,
  isValidNoteContent,
} from '.'

describe('note domain', () => {
  it('defines supported size presets at or above the minimum dimensions', () => {
    const [minimumWidth, minimumHeight] = MIN_NOTE_SIZE

    expect(MIN_NOTE_SIZE).toEqual([160, 160])

    for (const [width, height] of Object.values(NOTE_SIZE_PRESETS)) {
      expect(width).toBeGreaterThanOrEqual(minimumWidth)
      expect(height).toBeGreaterThanOrEqual(minimumHeight)
    }
  })

  it('uses a supported size and background as defaults', () => {
    expect(NOTE_SIZE_PRESETS).toHaveProperty(DEFAULT_NOTE_SIZE_PRESET)
    expect(NOTE_BACKGROUNDS).toContain(DEFAULT_NOTE_BACKGROUND)
  })

  it('defines a five-second delete recovery window', () => {
    expect(DELETE_UNDO_WINDOW_MS).toBe(5_000)
  })

  it('accepts bounded plain text and rejects invalid note content', () => {
    expect(isValidNoteContent('')).toBe(true)
    expect(isValidNoteContent('a'.repeat(MAX_NOTE_CONTENT_LENGTH))).toBe(true)
    expect(isValidNoteContent('<strong>literal text</strong>')).toBe(true)
    expect(isValidNoteContent('a'.repeat(MAX_NOTE_CONTENT_LENGTH + 1))).toBe(
      false,
    )
    expect(isValidNoteContent('invalid\0content')).toBe(false)
    expect(isValidNoteContent(null)).toBe(false)
  })

  it('creates unique UUID note identifiers', () => {
    const firstId = createNoteId()
    const secondId = createNoteId()

    expect(firstId).not.toBe(secondId)
    expect(firstId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  })
})
