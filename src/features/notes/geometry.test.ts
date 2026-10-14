import {
  calculateDragPosition,
  calculateNoteCreationPosition,
  calculateResizeDimensions,
  clamp,
  clampPosition,
  getResizeConstraints,
  isFinitePoint,
  isValidDimensions,
  rectTouch,
} from './geometry'

describe('geometry', () => {
  describe('clamp', () => {
    it('keeps values inside the range and clamps values outside it', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('rejects invalid ranges and non-finite values', () => {
      expect(() => clamp(5, 10, 0)).toThrow(RangeError)
      expect(() => clamp(Number.NaN, 0, 10)).toThrow(RangeError)
    })
  })

  describe('geometry validation', () => {
    it('accepts finite points and non-negative dimensions', () => {
      expect(isFinitePoint([-10, 20])).toBe(true)
      expect(isValidDimensions([0, 120])).toBe(true)
    })

    it('rejects malformed or non-finite geometry', () => {
      expect(isFinitePoint([Number.NaN, 20])).toBe(false)
      expect(isFinitePoint([10])).toBe(false)
      expect(isFinitePoint(new Array(2))).toBe(false)
      expect(isValidDimensions([-1, 120])).toBe(false)
      expect(isValidDimensions([120, Number.POSITIVE_INFINITY])).toBe(false)
    })
  })

  describe('rectangle contact', () => {
    const deleteZone = { x: 200, y: 300, width: 200, height: 60 }

    it('detects overlapping rectangles', () => {
      expect(
        rectTouch({ x: 230, y: 300, width: 160, height: 160 }, deleteZone),
      ).toBe(true)
    })

    it('counts exact edge and corner contact as touching', () => {
      expect(
        rectTouch({ x: 40, y: 300, width: 160, height: 160 }, deleteZone),
      ).toBe(true)
      expect(
        rectTouch({ x: 40, y: 140, width: 160, height: 160 }, deleteZone),
      ).toBe(true)
    })

    it('rejects rectangles separated by one pixel', () => {
      expect(
        rectTouch({ x: 39, y: 300, width: 160, height: 160 }, deleteZone),
      ).toBe(false)
      expect(
        rectTouch({ x: 40, y: 139, width: 160, height: 160 }, deleteZone),
      ).toBe(false)
    })

    it('rejects invalid rectangles', () => {
      expect(() =>
        rectTouch({ x: 0, y: 0, width: -1, height: 160 }, deleteZone),
      ).toThrow(RangeError)
    })
  })

  describe('clampPosition', () => {
    it('keeps the complete note inside the canvas', () => {
      expect(clampPosition([-20, 500], [160, 160], [600, 400])).toEqual([
        0, 240,
      ])
    })

    it('anchors an oversized note to the canvas origin', () => {
      expect(clampPosition([50, 50], [700, 500], [600, 400])).toEqual([0, 0])
    })

    it('rejects invalid geometry', () => {
      expect(() =>
        clampPosition([Number.NaN, 0], [160, 160], [600, 400]),
      ).toThrow(RangeError)
    })
  })

  describe('calculateDragPosition', () => {
    it('applies the pointer delta to the initial note position', () => {
      expect(
        calculateDragPosition({
          initialPosition: [100, 100],
          initialPointerPosition: [150, 150],
          currentPointerPosition: [210, 180],
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
        }),
      ).toEqual([160, 130])
    })

    it('clamps the moved note at the canvas boundaries', () => {
      expect(
        calculateDragPosition({
          initialPosition: [100, 100],
          initialPointerPosition: [100, 100],
          currentPointerPosition: [1_000, 1_000],
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
        }),
      ).toEqual([440, 240])
    })
  })

  describe('calculateNoteCreationPosition', () => {
    it('centers the first note inside the canvas', () => {
      expect(
        calculateNoteCreationPosition({
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
          strategy: { type: 'cascade' },
        }),
      ).toEqual([220, 120])
    })

    it('cascades from the previous creation position', () => {
      expect(
        calculateNoteCreationPosition({
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
          strategy: { type: 'cascade', previousPosition: [220, 120] },
        }),
      ).toEqual([244, 144])
    })

    it('preserves the cascade direction when the note size increases', () => {
      expect(
        calculateNoteCreationPosition({
          noteDimensions: [380, 380],
          canvasDimensions: [1_024, 768],
          strategy: { type: 'cascade', previousPosition: [432, 304] },
        }),
      ).toEqual([456, 328])
    })

    it('supports an explicit cascade offset', () => {
      expect(
        calculateNoteCreationPosition({
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
          strategy: {
            type: 'cascade',
            previousPosition: [220, 120],
            offset: 10,
          },
        }),
      ).toEqual([230, 130])
    })

    it('clamps a cascaded note at the canvas boundaries', () => {
      expect(
        calculateNoteCreationPosition({
          noteDimensions: [380, 380],
          canvasDimensions: [400, 400],
          strategy: { type: 'cascade', previousPosition: [100, 100] },
        }),
      ).toEqual([20, 20])
    })

    it('anchors an oversized note to the canvas origin', () => {
      expect(
        calculateNoteCreationPosition({
          noteDimensions: [700, 500],
          canvasDimensions: [600, 400],
          strategy: { type: 'cascade', previousPosition: [100, 100] },
        }),
      ).toEqual([0, 0])
    })

    it('rejects invalid cascade inputs', () => {
      expect(() =>
        calculateNoteCreationPosition({
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
          strategy: {
            type: 'cascade',
            previousPosition: [Number.NaN, 0],
          },
        }),
      ).toThrow(RangeError)

      expect(() =>
        calculateNoteCreationPosition({
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
          strategy: { type: 'cascade', offset: Number.NaN },
        }),
      ).toThrow(RangeError)
    })

    it('centers direct placement on the cursor position', () => {
      expect(
        calculateNoteCreationPosition({
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
          strategy: { type: 'direct', center: [300, 200] },
        }),
      ).toEqual([220, 120])
    })

    it('clamps direct placement at every canvas edge', () => {
      expect(
        calculateNoteCreationPosition({
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
          strategy: { type: 'direct', center: [10, 10] },
        }),
      ).toEqual([0, 0])
      expect(
        calculateNoteCreationPosition({
          noteDimensions: [160, 160],
          canvasDimensions: [600, 400],
          strategy: { type: 'direct', center: [590, 390] },
        }),
      ).toEqual([440, 240])
    })
  })

  describe('resize geometry', () => {
    it('calculates minimum and maximum dimensions at a position', () => {
      expect(getResizeConstraints([400, 250], [600, 400])).toEqual({
        minimum: [160, 150],
        maximum: [200, 150],
      })
    })

    it('reduces the effective minimum when the canvas has less space', () => {
      expect(getResizeConstraints([550, 350], [600, 400])).toEqual({
        minimum: [50, 50],
        maximum: [50, 50],
      })
    })

    it('applies pointer movement within resize constraints', () => {
      expect(
        calculateResizeDimensions({
          initialDimensions: [160, 160],
          initialPointerPosition: [200, 200],
          currentPointerPosition: [250, 230],
          notePosition: [100, 100],
          canvasDimensions: [600, 400],
        }),
      ).toEqual([210, 190])
    })

    it('clamps resized dimensions to the minimum size', () => {
      expect(
        calculateResizeDimensions({
          initialDimensions: [160, 160],
          initialPointerPosition: [200, 200],
          currentPointerPosition: [0, 0],
          notePosition: [100, 100],
          canvasDimensions: [600, 400],
        }),
      ).toEqual([160, 160])
    })

    it('clamps resized dimensions to the remaining canvas space', () => {
      expect(
        calculateResizeDimensions({
          initialDimensions: [160, 160],
          initialPointerPosition: [200, 200],
          currentPointerPosition: [1_000, 1_000],
          notePosition: [400, 250],
          canvasDimensions: [600, 400],
        }),
      ).toEqual([200, 150])
    })
  })
})
