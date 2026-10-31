import type { MoneyEnvelope, SharedBoard, SharedDrawing, SharedMoneyLedger } from '../models/types'

const timestamp = (value?: string) => value ? new Date(value).getTime() || 0 : 0

export function latestSharedBoard(own: SharedBoard, partner?: SharedBoard) {
  const selected = partner && timestamp(partner.updatedAt) > timestamp(own.updatedAt) ? partner : own
  return { ...selected, savedDrawings: Array.isArray(selected.savedDrawings) ? selected.savedDrawings : [] }
}

export function archiveDrawing(board: SharedBoard, id: string, createdAt = new Date().toISOString()): SharedBoard {
  const snapshot = { id, strokes: board.strokes.map((stroke) => ({ ...stroke, points: stroke.points.map((point) => ({ ...point })) })), createdAt }
  return { ...board, savedDrawings: [snapshot, ...(board.savedDrawings ?? []).filter((drawing) => drawing.id !== id)].slice(0, 12), updatedAt: createdAt }
}

const drawingSignature = (drawing: Pick<SharedDrawing, 'strokes'>) => JSON.stringify(drawing.strokes.map((stroke) => ({
  color: stroke.color,
  width: stroke.width,
  points: stroke.points,
})))

export function archiveDrawingOnce(board: SharedBoard, id: string, createdAt = new Date().toISOString()) {
  const signature = drawingSignature(board)
  const existing = (board.savedDrawings ?? []).find((drawing) => drawingSignature(drawing) === signature)
  if (existing) return { board: { ...board, updatedAt: createdAt }, drawingId: existing.id, added: false }
  return { board: archiveDrawing(board, id, createdAt), drawingId: id, added: true }
}

export function ticTacToeEventPayload(before: SharedBoard, after: SharedBoard) {
  const winner = ticTacToeWinner(after.ticTacToe)
  if (winner) {
    const movedMark = after.ticTacToe.find((cell, index) => cell && cell !== before.ticTacToe[index])
    return movedMark === winner ? 'tic-result-loss' : 'tic-result-win'
  }
  if (after.ticTacToe.every(Boolean)) return 'tic-result-draw'
  return before.ticTacToe.every((cell) => !cell) ? 'tic-invite' : 'tic-turn'
}

export function removeArchivedDrawing(board: SharedBoard, id: string, updatedAt = new Date().toISOString()): SharedBoard {
  return { ...board, savedDrawings: (board.savedDrawings ?? []).filter((drawing) => drawing.id !== id), updatedAt }
}

export function prepareDrawingReply(board: SharedBoard, drawing: SharedDrawing, updatedAt = new Date().toISOString()): SharedBoard {
  return {
    ...board,
    mode: 'draw',
    strokes: drawing.strokes.map((stroke) => ({ ...stroke, points: stroke.points.map((point) => ({ ...point })) })),
    updatedAt,
  }
}

export function applyTicTacToeMove(board: SharedBoard, index: number): SharedBoard {
  if (index < 0 || index > 8 || board.ticTacToe[index] || ticTacToeWinner(board.ticTacToe)) return board
  const ticTacToe = [...board.ticTacToe]
  ticTacToe[index] = ticTacToe.filter(Boolean).length % 2 === 0 ? 'x' : 'o'
  return { ...board, mode: 'tic-tac-toe', ticTacToe, updatedAt: new Date().toISOString() }
}

export function ticTacToeWinner(cells: SharedBoard['ticTacToe']) {
  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
  for (const [a, b, c] of lines) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return cells[a]
  }
  return null
}

export function latestSharedMoneyLedger(own: SharedMoneyLedger, partner?: SharedMoneyLedger) {
  return normalizeMoneyLedger(partner && timestamp(partner.updatedAt) > timestamp(own.updatedAt) ? partner : own)
}

export function moneySummary(ledger: SharedMoneyLedger) {
  const entries = [...(ledger.entries ?? []), ...(ledger.envelopes ?? []).flatMap((envelope) => envelope.entries)]
  const income = entries.filter((entry) => entry.kind === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const expenses = entries.filter((entry) => entry.kind === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
  return { income, expenses, balance: income - expenses }
}

export function envelopeSummary(envelope: MoneyEnvelope) {
  const income = envelope.entries.filter((entry) => entry.kind === 'income').reduce((sum, entry) => sum + entry.amount, 0)
  const expenses = envelope.entries.filter((entry) => entry.kind === 'expense').reduce((sum, entry) => sum + entry.amount, 0)
  const balance = income - expenses
  const remaining = Math.max(0, envelope.targetAmount - income)
  const progress = envelope.targetAmount > 0 ? Math.max(0, Math.min(100, Math.round(income / envelope.targetAmount * 100))) : 0
  return { income, expenses, balance, remaining, progress }
}

export function canSpendFromEnvelope(envelope: MoneyEnvelope) {
  return envelopeSummary(envelope).income >= envelope.targetAmount
}

export function normalizeMoneyLedger(ledger: SharedMoneyLedger): SharedMoneyLedger {
  const entries = Array.isArray(ledger.entries) ? ledger.entries : []
  const envelopes = Array.isArray(ledger.envelopes) ? ledger.envelopes : []
  if (!envelopes.length && entries.length) {
    return {
      entries: [],
      envelopes: [{ id: 'legacy-shared', title: 'Общие расходы', targetAmount: 0, entries, createdAt: ledger.updatedAt || new Date().toISOString() }],
      updatedAt: ledger.updatedAt,
    }
  }
  return { ...ledger, entries, envelopes }
}
