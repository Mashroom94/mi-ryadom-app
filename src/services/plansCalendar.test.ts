import { describe, expect, it } from 'vitest'
import { buildMonthGrid, initialPlansCalendarExpanded, shiftMonth } from './plansCalendar'

describe('plans calendar', () => {
  it('starts collapsed so the page stays compact', () => {
    expect(initialPlansCalendarExpanded).toBe(false)
  })

  it('builds a Monday-first grid with stable ISO dates', () => {
    const days = buildMonthGrid(2026, 9)

    expect(days).toHaveLength(42)
    expect(days[0]).toMatchObject({ iso: '2026-09-28', inMonth: false })
    expect(days[3]).toMatchObject({ iso: '2026-10-01', day: 1, inMonth: true })
    expect(days[41]).toMatchObject({ iso: '2026-11-08', inMonth: false })
  })

  it('moves between months without retaining an invalid day', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 })
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 })
  })
})
