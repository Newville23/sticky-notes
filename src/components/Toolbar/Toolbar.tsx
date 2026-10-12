import type { ReactNode } from 'react'
import './Toolbar.css'

export interface ToolbarProps {
  readonly ariaLabel: string
  readonly children: ReactNode
}

export function Toolbar({ ariaLabel, children }: ToolbarProps) {
  return (
    <aside className="toolbar" aria-label={ariaLabel}>
      {children}
    </aside>
  )
}
