import { memo, type Ref } from 'react'
import { UndoButton } from './UndoButton'
import './DeleteZone.css'

export interface DeleteZoneProps {
  readonly ref?: Ref<HTMLDivElement>
}

export const DeleteZone = memo(function DeleteZone({ ref }: DeleteZoneProps) {
  return (
    <>
      <div
        ref={ref}
        className="delete-zone"
        data-delete-zone=""
        aria-hidden="true"
      >
        <span className="delete-zone__icon" aria-hidden="true" />
        <span className="delete-zone__label">Drop here to delete</span>
      </div>
      <UndoButton />
    </>
  )
})
