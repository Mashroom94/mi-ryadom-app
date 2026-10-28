import { describe, expect, it } from 'vitest'
import type { MoneyEnvelope, SharedBoard, SharedMoneyLedger } from '../models/types'
import { applyTicTacToeMove, archiveDrawing, archiveDrawingOnce, canSpendFromEnvelope, envelopeSummary, latestSharedBoard, latestSharedMoneyLedger, moneySummary, normalizeMoneyLedger, prepareDrawingReply, removeArchivedDrawing, ticTacToeEventPayload, ticTacToeWinner } from './sharedTools'

const board = (updatedAt: string): SharedBoard => ({ mode: 'draw', strokes: [], ticTacToe: Array(9).fill(null), savedDrawings: [], updatedAt })

describe('shared tools', () => {
  it('uses the most recently edited shared sheet', () => {
    expect(latestSharedBoard(board('2026-10-25T10:00:00Z'), board('2026-10-25T11:00:00Z')).updatedAt).toBe('2026-10-25T11:00:00Z')
  })

  it('does not overwrite an occupied tic-tac-toe cell', () => {
    const current = { ...board('2026-10-25T10:00:00Z'), ticTacToe: ['x', null, null, null, null, null, null, null, null] as SharedBoard['ticTacToe'] }
    expect(applyTicTacToeMove(current, 0)).toEqual(current)
    expect(applyTicTacToeMove(current, 1).ticTacToe[1]).toBe('o')
  })

  it('detects a winner and prevents moves after the game is over', () => {
    const cells = ['x', 'x', 'x', 'o', 'o', null, null, null, null] as SharedBoard['ticTacToe']
    const finished = { ...board('2026-10-25T10:00:00Z'), ticTacToe: cells }
    expect(ticTacToeWinner(cells)).toBe('x')
    expect(applyTicTacToeMove(finished, 8)).toBe(finished)
  })

  it('selects the latest ledger and calculates totals', () => {
    const older: SharedMoneyLedger = { updatedAt: '2026-10-25T10:00:00Z', entries: [], envelopes: [] }
    const newer: SharedMoneyLedger = { updatedAt: '2026-10-25T11:00:00Z', envelopes: [], entries: [
      { id: '1', title: 'Продукты', amount: 1200, kind: 'expense', paidBy: 'shared', createdAt: '2026-10-25T11:00:00Z' },
      { id: '2', title: 'Возврат', amount: 300, kind: 'income', paidBy: 'partner', createdAt: '2026-10-25T11:02:00Z' },
    ] }
    expect(latestSharedMoneyLedger(older, newer).updatedAt).toBe(newer.updatedAt)
    expect(moneySummary(newer)).toEqual({ income: 300, expenses: 1200, balance: -900 })
  })

  it('calculates the balance and remaining target for an envelope', () => {
    const envelope: MoneyEnvelope = {
      id: 'trip', title: 'Отпуск', targetAmount: 50_000, createdAt: '2026-10-25T10:00:00Z', entries: [
        { id: '1', title: 'От Марии', source: 'Мария', amount: 18_000, kind: 'income', paidBy: 'me', createdAt: '2026-10-25T11:00:00Z' },
        { id: '2', title: 'Билеты', amount: 3_000, kind: 'expense', paidBy: 'shared', createdAt: '2026-10-25T12:00:00Z' },
      ],
    }
    expect(envelopeSummary(envelope)).toEqual({ income: 18_000, expenses: 3_000, balance: 15_000, remaining: 32_000, progress: 36 })
    expect(canSpendFromEnvelope(envelope)).toBe(false)
  })

  it('unlocks expenses after contributions reach the envelope goal', () => {
    const envelope: MoneyEnvelope = {
      id: 'gift', title: 'Подарок', targetAmount: 10_000, targetDate: '2026-12-31', createdAt: '2026-10-25T10:00:00Z', entries: [
        { id: '1', title: 'Мария', amount: 10_000, kind: 'income', paidBy: 'shared', createdAt: '2026-10-25T11:00:00Z' },
        { id: '2', title: 'Упаковка', amount: 500, kind: 'expense', paidBy: 'shared', createdAt: '2026-10-25T12:00:00Z' },
      ],
    }
    expect(canSpendFromEnvelope(envelope)).toBe(true)
    expect(envelopeSummary(envelope).balance).toBe(9_500)
  })

  it('archives a drawing snapshot and keeps the latest twelve', () => {
    const current = { ...board('2026-10-25T10:00:00Z'), strokes: [{ id: 's1', color: '#000', width: 5, points: [{ x: 1, y: 2 }] }], savedDrawings: Array.from({ length: 12 }, (_, index) => ({ id: `old-${index}`, strokes: [], createdAt: `2026-10-${index + 1}` })) }
    const next = archiveDrawing(current, 'new-drawing', '2026-10-27T10:00:00Z')
    expect(next.savedDrawings).toHaveLength(12)
    expect(next.savedDrawings[0].id).toBe('new-drawing')
    expect(next.savedDrawings[0].strokes[0].id).toBe('s1')
  })

  it('reuses an identical saved drawing instead of creating a duplicate', () => {
    const strokes = [{ id: 'new-stroke', color: '#000', width: 5, points: [{ x: 1, y: 2 }] }]
    const current = { ...board('2026-10-25T10:00:00Z'), strokes, savedDrawings: [{ id: 'saved', strokes: [{ ...strokes[0], id: 'old-stroke' }], createdAt: '2026-10-25T10:00:00Z' }] }
    const result = archiveDrawingOnce(current, 'duplicate')
    expect(result.drawingId).toBe('saved')
    expect(result.added).toBe(false)
    expect(result.board.savedDrawings).toHaveLength(1)
  })

  it('uses an invitation for the first tic-tac-toe move and a turn message afterwards', () => {
    const empty = board('2026-10-25T10:00:00Z')
    const first = applyTicTacToeMove(empty, 0)
    const second = applyTicTacToeMove(first, 1)
    expect(ticTacToeEventPayload(empty, first)).toBe('tic-invite')
    expect(ticTacToeEventPayload(first, second)).toBe('tic-turn')
  })

  it('removes only the chosen saved drawing', () => {
    const current = { ...board('2026-10-25T10:00:00Z'), savedDrawings: [
      { id: 'keep', strokes: [], createdAt: '2026-10-25T10:00:00Z' },
      { id: 'remove', strokes: [], createdAt: '2026-10-25T11:00:00Z' },
    ] }
    expect(removeArchivedDrawing(current, 'remove', '2026-10-27T10:00:00Z').savedDrawings.map(({ id }) => id)).toEqual(['keep'])
  })

  it('opens an incoming drawing as an editable reply without mutating the archive', () => {
    const incoming = { id: 'incoming', strokes: [{ id: 'line', color: '#6475dc', width: 10, points: [{ x: 8, y: 9 }] }], createdAt: '2026-10-27T10:00:00Z' }
    const current = { ...board('2026-10-25T10:00:00Z'), savedDrawings: [incoming] }
    const reply = prepareDrawingReply(current, incoming, '2026-10-27T11:00:00Z')
    reply.strokes[0].points[0].x = 99
    expect(reply.mode).toBe('draw')
    expect(current.savedDrawings[0].strokes[0].points[0].x).toBe(8)
  })

  it('moves legacy entries into a shared envelope', () => {
    const legacy = { updatedAt: '2026-10-25T11:00:00Z', entries: [
      { id: '1', title: 'Продукты', amount: 1200, kind: 'expense' as const, paidBy: 'shared' as const, createdAt: '2026-10-25T11:00:00Z' },
    ] } as SharedMoneyLedger
    const normalized = normalizeMoneyLedger(legacy)
    expect(normalized.envelopes).toHaveLength(1)
    expect(normalized.envelopes[0].entries[0].title).toBe('Продукты')
  })
})
