import type { PointerEvent, RefObject } from 'react'
import { act, renderHook } from '@testing-library/react'
import type { Dimensions, Point } from '../../../domain'
import { useResize } from './useResize'

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

function setupResize({
  initialDimensions = [160, 160],
  notePosition = [100, 100],
}: {
  initialDimensions?: Dimensions
  notePosition?: Point
} = {}) {
  const canvas = document.createElement('section')
  const note = document.createElement('article')
  const resizeHandle = document.createElement('div')
  const onResizeEnd = vi.fn()
  const setPointerCapture = vi.fn()
  const releasePointerCapture = vi.fn()

  canvas.className = 'note-canvas'
  canvas.append(note)
  note.append(resizeHandle)
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(
    createBounds({ left: 20, top: 30, width: 600, height: 400 }),
  )
  resizeHandle.setPointerCapture = setPointerCapture
  resizeHandle.releasePointerCapture = releasePointerCapture

  const noteRef: RefObject<HTMLElement | null> = { current: note }
  const hook = renderHook(() =>
    useResize({
      noteRef,
      initialDimensions,
      notePosition,
      onResizeEnd,
    }),
  )

  return {
    ...hook,
    canvas,
    note,
    resizeHandle,
    onResizeEnd,
    setPointerCapture,
    releasePointerCapture,
  }
}

function createPointerDownEvent(
  resizeHandle: HTMLElement,
  pointerId = 7,
): PointerEvent<HTMLElement> {
  return {
    button: 0,
    pointerId,
    clientX: 200,
    clientY: 200,
    currentTarget: resizeHandle,
    preventDefault: vi.fn(),
  } as unknown as PointerEvent<HTMLElement>
}

describe('useResize', () => {
  it('captures the pointer and caches resize geometry once', () => {
    const { result, canvas, resizeHandle, setPointerCapture } = setupResize()
    const event = createPointerDownEvent(resizeHandle)

    act(() => result.current.handlePointerDown(event))

    expect(setPointerCapture).toHaveBeenCalledOnce()
    expect(setPointerCapture).toHaveBeenCalledWith(7)
    expect(canvas.getBoundingClientRect).toHaveBeenCalledOnce()
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(result.current.sessionRef.current).toEqual({
      pointerId: 7,
      initialPointerPosition: [200, 200],
      initialDimensions: [160, 160],
      notePosition: [100, 100],
      currentDimensions: [160, 160],
      canvasBounds: { x: 20, y: 30, width: 600, height: 400 },
    })
  })

  it('mutates dimensions within minimum and canvas constraints', () => {
    const { result, note, resizeHandle, canvas, onResizeEnd } = setupResize()

    act(() => {
      result.current.handlePointerDown(createPointerDownEvent(resizeHandle))
      result.current.handlePointerMove({
        pointerId: 7,
        clientX: 0,
        clientY: 0,
      } as PointerEvent<HTMLElement>)
    })

    expect(note.style.width).toBe('120px')
    expect(note.style.height).toBe('120px')

    act(() => {
      result.current.handlePointerMove({
        pointerId: 7,
        clientX: 1_000,
        clientY: 1_000,
      } as PointerEvent<HTMLElement>)
    })

    expect(note.style.width).toBe('500px')
    expect(note.style.height).toBe('300px')
    expect(result.current.sessionRef.current?.currentDimensions).toEqual([
      500, 300,
    ])
    expect(canvas.getBoundingClientRect).toHaveBeenCalledOnce()
    expect(onResizeEnd).not.toHaveBeenCalled()
  })

  it('commits final dimensions once and cleans up on pointer release', () => {
    const { result, note, resizeHandle, onResizeEnd, releasePointerCapture } =
      setupResize()

    act(() => {
      result.current.handlePointerDown(createPointerDownEvent(resizeHandle))
      result.current.handlePointerMove({
        pointerId: 7,
        clientX: 250,
        clientY: 230,
      } as PointerEvent<HTMLElement>)
      result.current.handlePointerUp({
        pointerId: 7,
        currentTarget: resizeHandle,
      } as unknown as PointerEvent<HTMLElement>)
    })

    expect(onResizeEnd).toHaveBeenCalledOnce()
    expect(onResizeEnd).toHaveBeenCalledWith([210, 190])
    expect(releasePointerCapture).toHaveBeenCalledWith(7)
    expect(result.current.sessionRef.current).toBeNull()
    expect(note.style.width).toBe('')
    expect(note.style.height).toBe('')

    act(() => {
      result.current.handlePointerUp({
        pointerId: 7,
        currentTarget: resizeHandle,
      } as unknown as PointerEvent<HTMLElement>)
    })

    expect(onResizeEnd).toHaveBeenCalledOnce()
  })

  it('rolls back and permits a new interaction after pointer cancellation', () => {
    const {
      result,
      note,
      resizeHandle,
      onResizeEnd,
      setPointerCapture,
      releasePointerCapture,
    } = setupResize()

    act(() => {
      result.current.handlePointerDown(createPointerDownEvent(resizeHandle))
      result.current.handlePointerMove({
        pointerId: 7,
        clientX: 250,
        clientY: 230,
      } as PointerEvent<HTMLElement>)
      result.current.handlePointerCancel({
        pointerId: 7,
        currentTarget: resizeHandle,
      } as unknown as PointerEvent<HTMLElement>)
    })

    expect(onResizeEnd).not.toHaveBeenCalled()
    expect(releasePointerCapture).toHaveBeenCalledWith(7)
    expect(result.current.sessionRef.current).toBeNull()
    expect(note.style.width).toBe('')
    expect(note.style.height).toBe('')

    act(() => {
      result.current.handlePointerDown(createPointerDownEvent(resizeHandle, 8))
    })

    expect(setPointerCapture).toHaveBeenLastCalledWith(8)
    expect(result.current.sessionRef.current?.pointerId).toBe(8)
  })

  it('clears temporary dimensions when pointer capture is lost', () => {
    const { result, note, resizeHandle } = setupResize()

    act(() => {
      result.current.handlePointerDown(createPointerDownEvent(resizeHandle))
      result.current.handlePointerMove({
        pointerId: 7,
        clientX: 250,
        clientY: 230,
      } as PointerEvent<HTMLElement>)
      result.current.handleLostPointerCapture({
        pointerId: 7,
      } as PointerEvent<HTMLElement>)
    })

    expect(result.current.sessionRef.current).toBeNull()
    expect(note.style.width).toBe('')
    expect(note.style.height).toBe('')
  })
})
