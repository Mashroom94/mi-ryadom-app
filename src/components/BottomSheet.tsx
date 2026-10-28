import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function BottomSheet({ open, title, closeLabel, onClose, children }: { open: boolean; title: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="bottom-sheet__handle" />
        <header>
          <h2 id="sheet-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label={closeLabel}><X /></button>
        </header>
        {children}
      </section>
    </div>
  )
}

