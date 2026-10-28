export type MonthGridDay = {
  iso: string
  day: number
  inMonth: boolean
}

export const initialPlansCalendarExpanded = false

function toIso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)
}

export function buildMonthGrid(year: number, month: number): MonthGridDay[] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const mondayOffset = (firstWeekday + 6) % 7

  return Array.from({ length: 42 }, (_, index) => {
    const iso = toIso(year, month, index - mondayOffset + 1)
    const date = new Date(`${iso}T00:00:00Z`)
    return { iso, day: date.getUTCDate(), inMonth: date.getUTCFullYear() === year && date.getUTCMonth() === month }
  })
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month + delta, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}
