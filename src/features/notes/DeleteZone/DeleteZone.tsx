import { memo, type Ref } from 'react'
import { UndoToasts } from './UndoToasts'
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
        <div className="delete-zone__surface">
          <span className="delete-zone__icon" aria-hidden="true" />
          <span className="delete-zone__label">Drop here to delete</span>
        </div>
      </div>
      <UndoToasts />
    </>
  )
})
