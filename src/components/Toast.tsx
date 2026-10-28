import { Check } from 'lucide-react'

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={`toast${visible ? ' is-visible' : ''}`} role="status" aria-live="polite">
      <Check aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

