import type { PointerEvent, RefObject } from 'react'
import { act, renderHook } from '@testing-library/react'
import { useDrag } from './useDrag'

function createBounds({
  left,
  top,
  width,
  height,
}: {
  left: number
  top: number
  width: number
  height: number
}): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  }
}

describe('useDrag', () => {
  it('captures the pointer and caches drag geometry once', () => {
    const canvas = document.createElement('section')
    const note = document.createElement('article')
    const dragSurface = document.createElement('div')
    const noteBounds = createBounds({
      left: 140,
      top: 90,
      width: 160,
      height: 160,
    })
    const canvasBounds = createBounds({
      left: 20,
      top: 30,
      width: 800,
      height: 600,
    })
    const setPointerCapture = vi.fn()
    const preventDefault = vi.fn()

    canvas.className = 'note-canvas'
    canvas.append(note)
    note.append(dragSurface)
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue(noteBounds)
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(canvasBounds)
    dragSurface.setPointerCapture = setPointerCapture

    const noteRef: RefObject<HTMLElement | null> = { current: note }
    const { result } = renderHook(() =>
      useDrag({
        noteRef,
        initialNotePosition: [120, 60],
        onDragEnd: vi.fn(),
      }),
    )

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 7,
        clientX: 180,
        clientY: 130,
        currentTarget: dragSurface,
        preventDefault,
      } as unknown as PointerEvent<HTMLElement>)
    })

    expect(setPointerCapture).toHaveBeenCalledOnce()
    expect(setPointerCapture).toHaveBeenCalledWith(7)
    expect(note.getBoundingClientRect).toHaveBeenCalledOnce()
    expect(canvas.getBoundingClientRect).toHaveBeenCalledOnce()
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(result.current.sessionRef.current).toEqual({
      pointerId: 7,
      initialPointerPosition: [180, 130],
      initialNotePosition: [120, 60],
      currentPosition: [120, 60],
      noteBounds: { x: 140, y: 90, width: 160, height: 160 },
      canvasBounds: { x: 20, y: 30, width: 800, height: 600 },
    })
  })

  it('mutates transform from cached geometry without rerendering', () => {
    const canvas = document.createElement('section')
    const note = document.createElement('article')
    const dragSurface = document.createElement('div')
    let renderCount = 0

    canvas.className = 'note-canvas'
    canvas.append(note)
    note.append(dragSurface)
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 140, top: 90, width: 160, height: 160 }),
    )
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 20, top: 30, width: 800, height: 600 }),
    )
    dragSurface.setPointerCapture = vi.fn()

    const noteRef: RefObject<HTMLElement | null> = { current: note }
    const { result } = renderHook(() => {
      renderCount += 1
      return useDrag({
        noteRef,
        initialNotePosition: [120, 60],
        onDragEnd: vi.fn(),
      })
    })

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 7,
        clientX: 180,
        clientY: 130,
        currentTarget: dragSurface,
        preventDefault: vi.fn(),
      } as unknown as PointerEvent<HTMLElement>)
    })
    act(() => {
      result.current.handlePointerMove({
        pointerId: 7,
        clientX: 300,
        clientY: 250,
      } as PointerEvent<HTMLElement>)
    })

    expect(note.style.transform).toBe('translate3d(240px, 180px, 0)')
    expect(result.current.sessionRef.current?.currentPosition).toEqual([
      240, 180,
    ])
    expect(note.getBoundingClientRect).toHaveBeenCalledOnce()
    expect(canvas.getBoundingClientRect).toHaveBeenCalledOnce()
    expect(renderCount).toBe(1)
  })

  it('ignores pointer movement outside the active session', () => {
    const note = document.createElement('article')
    const noteRef: RefObject<HTMLElement | null> = { current: note }
    const { result } = renderHook(() =>
      useDrag({
        noteRef,
        initialNotePosition: [0, 0],
        onDragEnd: vi.fn(),
      }),
    )

    act(() => {
      result.current.handlePointerMove({
        pointerId: 10,
        clientX: 100,
        clientY: 100,
      } as PointerEvent<HTMLElement>)
    })

    expect(note.style.transform).toBe('')
  })

  it('ignores non-primary buttons and overlapping drag sessions', () => {
    const canvas = document.createElement('section')
    const note = document.createElement('article')
    const dragSurface = document.createElement('div')
    const setPointerCapture = vi.fn()

    canvas.className = 'note-canvas'
    canvas.append(note)
    note.append(dragSurface)
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 0, top: 0, width: 160, height: 160 }),
    )
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 0, top: 0, width: 800, height: 600 }),
    )
    dragSurface.setPointerCapture = setPointerCapture

    const noteRef: RefObject<HTMLElement | null> = { current: note }
    const { result } = renderHook(() =>
      useDrag({
        noteRef,
        initialNotePosition: [0, 0],
        onDragEnd: vi.fn(),
      }),
    )
    const createEvent = (button: number, pointerId: number) =>
      ({
        button,
        pointerId,
        clientX: 10,
        clientY: 10,
        currentTarget: dragSurface,
        preventDefault: vi.fn(),
      }) as unknown as PointerEvent<HTMLElement>

    act(() => result.current.handlePointerDown(createEvent(1, 1)))
    act(() => result.current.handlePointerDown(createEvent(0, 2)))
    act(() => result.current.handlePointerDown(createEvent(0, 3)))

    expect(setPointerCapture).toHaveBeenCalledTimes(1)
    expect(setPointerCapture).toHaveBeenCalledWith(2)
    expect(result.current.sessionRef.current?.pointerId).toBe(2)
  })

  it('clears only the session matching lost pointer capture', () => {
    const canvas = document.createElement('section')
    const note = document.createElement('article')
    const dragSurface = document.createElement('div')

    canvas.className = 'note-canvas'
    canvas.append(note)
    note.append(dragSurface)
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 0, top: 0, width: 160, height: 160 }),
    )
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 0, top: 0, width: 800, height: 600 }),
    )
    dragSurface.setPointerCapture = vi.fn()

    const noteRef: RefObject<HTMLElement | null> = { current: note }
    const { result } = renderHook(() =>
      useDrag({
        noteRef,
        initialNotePosition: [0, 0],
        onDragEnd: vi.fn(),
      }),
    )

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 4,
        clientX: 10,
        clientY: 10,
        currentTarget: dragSurface,
        preventDefault: vi.fn(),
      } as unknown as PointerEvent<HTMLElement>)
    })
    act(() => {
      result.current.handleLostPointerCapture({
        pointerId: 9,
      } as PointerEvent<HTMLElement>)
    })

    expect(result.current.sessionRef.current?.pointerId).toBe(4)

    act(() => {
      result.current.handleLostPointerCapture({
        pointerId: 4,
      } as PointerEvent<HTMLElement>)
    })

    expect(result.current.sessionRef.current).toBeNull()
  })

  it('commits the final position once and releases pointer capture', () => {
    const canvas = document.createElement('section')
    const note = document.createElement('article')
    const dragSurface = document.createElement('div')
    const onDragEnd = vi.fn()
    const releasePointerCapture = vi.fn()

    canvas.className = 'note-canvas'
    canvas.append(note)
    note.append(dragSurface)
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 140, top: 90, width: 160, height: 160 }),
    )
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 20, top: 30, width: 800, height: 600 }),
    )
    dragSurface.setPointerCapture = vi.fn()
    dragSurface.releasePointerCapture = releasePointerCapture

    const noteRef: RefObject<HTMLElement | null> = { current: note }
    const { result } = renderHook(() =>
      useDrag({
        noteRef,
        initialNotePosition: [120, 60],
        onDragEnd,
      }),
    )

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 7,
        clientX: 180,
        clientY: 130,
        currentTarget: dragSurface,
        preventDefault: vi.fn(),
      } as unknown as PointerEvent<HTMLElement>)
      result.current.handlePointerMove({
        pointerId: 7,
        clientX: 300,
        clientY: 250,
      } as PointerEvent<HTMLElement>)
      result.current.handlePointerUp({
        pointerId: 7,
        currentTarget: dragSurface,
      } as unknown as PointerEvent<HTMLElement>)
    })

    expect(onDragEnd).toHaveBeenCalledOnce()
    expect(onDragEnd).toHaveBeenCalledWith([240, 180])
    expect(releasePointerCapture).toHaveBeenCalledOnce()
    expect(releasePointerCapture).toHaveBeenCalledWith(7)
    expect(result.current.sessionRef.current).toBeNull()
    expect(note.style.transform).toBe('')

    act(() => {
      result.current.handlePointerUp({
        pointerId: 7,
        currentTarget: dragSurface,
      } as unknown as PointerEvent<HTMLElement>)
    })

    expect(onDragEnd).toHaveBeenCalledOnce()
  })

  it('rolls back and cleans up the interaction on pointer cancellation', () => {
    const canvas = document.createElement('section')
    const note = document.createElement('article')
    const dragSurface = document.createElement('div')
    const onDragEnd = vi.fn()
    const releasePointerCapture = vi.fn()

    canvas.className = 'note-canvas'
    canvas.append(note)
    note.append(dragSurface)
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 140, top: 90, width: 160, height: 160 }),
    )
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 20, top: 30, width: 800, height: 600 }),
    )
    dragSurface.setPointerCapture = vi.fn()
    dragSurface.releasePointerCapture = releasePointerCapture

    const noteRef: RefObject<HTMLElement | null> = { current: note }
    const { result } = renderHook(() =>
      useDrag({
        noteRef,
        initialNotePosition: [120, 60],
        onDragEnd,
      }),
    )

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 7,
        clientX: 180,
        clientY: 130,
        currentTarget: dragSurface,
        preventDefault: vi.fn(),
      } as unknown as PointerEvent<HTMLElement>)
      result.current.handlePointerMove({
        pointerId: 7,
        clientX: 300,
        clientY: 250,
      } as PointerEvent<HTMLElement>)
    })

    expect(note.style.transform).toBe('translate3d(240px, 180px, 0)')

    act(() => {
      result.current.handlePointerCancel({
        pointerId: 7,
        currentTarget: dragSurface,
      } as unknown as PointerEvent<HTMLElement>)
    })

    expect(onDragEnd).not.toHaveBeenCalled()
    expect(releasePointerCapture).toHaveBeenCalledOnce()
    expect(releasePointerCapture).toHaveBeenCalledWith(7)
    expect(result.current.sessionRef.current).toBeNull()
    expect(note.style.transform).toBe('')
  })

  it('does not commit movement when the drop is handled', () => {
    const canvas = document.createElement('section')
    const note = document.createElement('article')
    const dragSurface = document.createElement('div')
    const onDragEnd = vi.fn()
    const onDrop = vi.fn(() => true)

    canvas.className = 'note-canvas'
    canvas.append(note)
    note.append(dragSurface)
    vi.spyOn(note, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 100, top: 100, width: 160, height: 160 }),
    )
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
      createBounds({ left: 0, top: 0, width: 600, height: 400 }),
    )
    dragSurface.setPointerCapture = vi.fn()
    dragSurface.releasePointerCapture = vi.fn()

    const noteRef: RefObject<HTMLElement | null> = { current: note }
    const { result } = renderHook(() =>
      useDrag({
        noteRef,
        initialNotePosition: [100, 100],
        onDragEnd,
        onDrop,
      }),
    )

    act(() => {
      result.current.handlePointerDown({
        button: 0,
        pointerId: 7,
        clientX: 120,
        clientY: 120,
        currentTarget: dragSurface,
        preventDefault: vi.fn(),
      } as unknown as PointerEvent<HTMLElement>)
      result.current.handlePointerMove({
        pointerId: 7,
        clientX: 250,
        clientY: 320,
      } as PointerEvent<HTMLElement>)
      result.current.handlePointerUp({
        pointerId: 7,
        clientX: 250,
        clientY: 320,
        currentTarget: dragSurface,
      } as unknown as PointerEvent<HTMLElement>)
    })

    expect(onDrop).toHaveBeenCalledOnce()
    expect(onDrop).toHaveBeenCalledWith([250, 320])
    expect(onDragEnd).not.toHaveBeenCalled()
  })
})
