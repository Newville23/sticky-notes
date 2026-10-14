const activeInteractions = new WeakMap<HTMLElement, Set<HTMLElement>>()
const interactionCanvases = new WeakMap<HTMLElement, HTMLElement>()

export function beginPointerInteraction(
  canvas: HTMLElement,
  interactionTarget: HTMLElement,
): void {
  const interactions = activeInteractions.get(canvas) ?? new Set<HTMLElement>()

  interactions.add(interactionTarget)
  activeInteractions.set(canvas, interactions)
  interactionCanvases.set(interactionTarget, canvas)
}

export function endPointerInteraction(interactionTarget: HTMLElement): void {
  const canvas = interactionCanvases.get(interactionTarget)

  if (!canvas) {
    return
  }

  const interactions = activeInteractions.get(canvas)
  interactions?.delete(interactionTarget)
  interactionCanvases.delete(interactionTarget)

  if (interactions?.size === 0) {
    activeInteractions.delete(canvas)
  }
}

export function hasActivePointerInteraction(canvas: HTMLElement): boolean {
  return (activeInteractions.get(canvas)?.size ?? 0) > 0
}
