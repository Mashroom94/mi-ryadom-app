export type NotesTab = 'together' | 'play' | 'money'

const order: NotesTab[] = ['together', 'play', 'money']

export function notesTabAfterSwipe(current: NotesTab, deltaX: number, threshold = 54): NotesTab {
  if (Math.abs(deltaX) < threshold) return current
  const index = order.indexOf(current)
  const nextIndex = deltaX < 0 ? Math.min(order.length - 1, index + 1) : Math.max(0, index - 1)
  return order[nextIndex]
}
