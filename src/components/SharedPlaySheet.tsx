import { Download, Eraser, Palette, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { DrawingStroke, SharedBoard, SharedDrawing } from '../models/types'
import { applyTicTacToeMove, archiveDrawingOnce, latestSharedBoard, removeArchivedDrawing, ticTacToeEventPayload, ticTacToeWinner } from '../services/sharedTools'
import { DrawingPreview } from './DrawingPreview'

const colors = ['#6475dc', '#ec8dbd', '#52a98d', '#26334f']
const widths = [5, 10, 18]
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

function TicMark({ value, index }: { value: 'x' | 'o'; index: number }) {
  return <svg className={`tic-mark tic-mark--${value}`} style={{ '--mark-tilt': `${(index % 3 - 1) * 2.5}deg` } as React.CSSProperties} viewBox="0 0 64 64" aria-hidden="true">
    {value === 'x' ? <><path d="M15 13 C25 24 39 42 50 52" /><path d="M50 14 C39 25 27 40 15 51" /></> : <path d="M34 12 C49 12 55 22 53 35 C51 49 42 54 29 52 C17 51 11 43 12 31 C13 19 21 12 34 12 Z" />}
  </svg>
}

function downloadDrawing(drawing: SharedDrawing) {
  const lines = drawing.strokes.map((stroke) => `<polyline points="${stroke.points.map(({ x, y }) => `${x},${y}`).join(' ')}" fill="none" stroke="${stroke.color}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')
  const blob = new Blob([`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600"><rect width="1000" height="600" fill="#fffdf9"/>${lines}</svg>`], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `my-ryadom-drawing-${drawing.createdAt.slice(0, 10)}.svg`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function SharedPlaySheet() {
  const { state, updateSharedBoard } = useApp()
  const language = state.profile.language
  const effective = useMemo(() => latestSharedBoard(state.sharedBoard, state.partnerShared?.sharedBoard), [state.sharedBoard, state.partnerShared?.sharedBoard])
  const [draft, setDraft] = useState<DrawingStroke | null>(null)
  const [color, setColor] = useState(colors[0])
  const [width, setWidth] = useState(widths[1])
  const [eraser, setEraser] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const activeBoard: SharedBoard = draft ? { ...effective, strokes: [...effective.strokes, draft] } : effective
  const winner = ticTacToeWinner(effective.ticTacToe)
  const isDraw = !winner && effective.ticTacToe.every(Boolean)

  const point = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return { x: Math.max(0, Math.min(1000, (event.clientX - rect.left) / rect.width * 1000)), y: Math.max(0, Math.min(600, (event.clientY - rect.top) / rect.height * 600)) }
  }
  const begin = (event: React.PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraft({ id: newId(), color: eraser ? '#fffdf9' : color, width: eraser ? width * 2.2 : width, points: [point(event)] })
  }
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!draft) return
    const next = point(event)
    setDraft((current) => current ? { ...current, points: [...current.points, next] } : null)
  }
  const finish = () => {
    if (!draft) return
    updateSharedBoard({ ...effective, mode: 'draw', strokes: [...effective.strokes, draft], updatedAt: new Date().toISOString() }, undefined, false)
    setDraft(null)
  }
  const sendDrawing = () => {
    if (!effective.strokes.length) return
    const archived = archiveDrawingOnce({ ...effective, updatedAt: new Date().toISOString() }, newId())
    updateSharedBoard(archived.board, `drawing:${archived.drawingId}`)
  }
  const makeMove = (index: number) => {
    const next = applyTicTacToeMove(effective, index)
    if (next !== effective) {
      updateSharedBoard(next, ticTacToeEventPayload(effective, next))
    }
  }

  return <section className="shared-play" aria-labelledby="shared-play-title">
    <div className="shared-play__heading">
      <div><h2 id="shared-play-title">{language === 'ru' ? 'Развлечения для двоих' : 'Fun for two'}</h2><p>{language === 'ru' ? 'Нарисуйте что-нибудь для партнёра или сыграйте вместе.' : 'Draw something for your partner or play together.'}</p></div>
    </div>

    <>
      <div className="drawing-tools" aria-label={language === 'ru' ? 'Инструменты рисования' : 'Drawing tools'}>
        <div className="drawing-colors">{colors.map((item) => <button key={item} type="button" className={!eraser && color === item ? 'is-active' : ''} style={{ '--tool-color': item } as React.CSSProperties} aria-label={item} onClick={() => { setColor(item); setEraser(false) }} />)}<label className="drawing-color-picker" aria-label={language === 'ru' ? 'Выбрать любой цвет' : 'Choose any color'}><input type="color" value={color} onChange={(event) => { setColor(event.target.value); setEraser(false) }} /><Palette aria-hidden="true" /></label></div>
        <div className="drawing-widths">{widths.map((item) => <button key={item} type="button" className={width === item ? 'is-active' : ''} aria-label={`${item}`} onClick={() => setWidth(item)}><i style={{ width: item }} /></button>)}</div>
        <button type="button" className={`drawing-tool-icon ${eraser ? 'is-active' : ''}`} aria-label={language === 'ru' ? 'Ластик' : 'Eraser'} onClick={() => setEraser((value) => !value)}><Eraser /></button>
        <button type="button" className="drawing-tool-icon" aria-label={language === 'ru' ? 'Отменить последнее действие' : 'Undo last action'} disabled={!effective.strokes.length} onClick={() => updateSharedBoard({ ...effective, strokes: effective.strokes.slice(0, -1), updatedAt: new Date().toISOString() }, undefined, false)}><RotateCcw /></button>
      </div>
      <div className="shared-paper" data-no-notes-swipe>
        <svg ref={svgRef} viewBox="0 0 1000 600" role="img" aria-label={language === 'ru' ? 'Общий лист для рисунка' : 'Shared drawing sheet'} onPointerDown={begin} onPointerMove={move} onPointerUp={finish} onPointerCancel={() => setDraft(null)}>
          {activeBoard.strokes.map((stroke) => <polyline key={stroke.id} points={stroke.points.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" />)}
        </svg>
      </div>
      <div className="drawing-send"><p>{language === 'ru' ? 'Рисунок сохранится здесь и останется на экране партнёра, пока он его не закроет.' : 'The drawing stays here and remains on your partner’s screen until they close it.'}</p><button type="button" disabled={!effective.strokes.length} onClick={sendDrawing}>{language === 'ru' ? 'Отправить партнёру' : 'Send to partner'}</button></div>
      {effective.savedDrawings.length > 0 && <section className="drawing-memory" aria-labelledby="drawing-memory-title"><h3 id="drawing-memory-title">{language === 'ru' ? 'Рисунки на память' : 'Saved drawings'}</h3><div>{effective.savedDrawings.map((drawing) => <article key={drawing.id}><DrawingPreview strokes={drawing.strokes} label={language === 'ru' ? 'Сохранённый рисунок' : 'Saved drawing'} /><span>{new Date(drawing.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}</span><button type="button" onClick={() => downloadDrawing(drawing)} aria-label={language === 'ru' ? 'Скачать рисунок' : 'Download drawing'}><Download /></button><button type="button" className="drawing-memory__delete" onClick={() => updateSharedBoard(removeArchivedDrawing(effective, drawing.id), undefined, false)} aria-label={language === 'ru' ? 'Удалить рисунок' : 'Delete drawing'}><Trash2 /></button></article>)}</div></section>}
    </>
    <section className="tic-game" aria-labelledby="tic-game-title">
      <div className="tic-game__heading"><div><h3 id="tic-game-title">{language === 'ru' ? 'Крестики-нолики' : 'Tic-tac-toe'}</h3><p>{winner ? (language === 'ru' ? 'Победа! Поздравляем!' : 'Victory! Congratulations!') : isDraw ? (language === 'ru' ? 'Ничья — сыграйте ещё раз.' : 'A draw — play again.') : (language === 'ru' ? 'Ходите по очереди.' : 'Take turns.')}</p></div><Sparkles aria-hidden="true" /></div>
      <div className="tic-game-board">
        {winner && <div className="tic-celebration" aria-hidden="true">{Array.from({ length: 42 }, (_, index) => {
          const burst = index % 3
          const angle = index / 42 * Math.PI * 6
          const distance = 70 + index % 7 * 8
          return <i key={index} style={{ '--piece': index, '--origin-x': `${[18, 50, 82][burst]}%`, '--origin-y': `${[36, 20, 40][burst]}%`, '--travel-x': `${Math.cos(angle) * distance}px`, '--travel-y': `${Math.sin(angle) * distance - 35}px` } as React.CSSProperties} />
        })}</div>}
        <div className="tic-tac-toe" role="grid">{effective.ticTacToe.map((value, index) => <button key={index} type="button" role="gridcell" aria-label={`${index + 1}${value ? `: ${value.toUpperCase()}` : ''}`} disabled={Boolean(winner)} onClick={() => makeMove(index)}>{value && <TicMark value={value} index={index} />}</button>)}</div>
        <button type="button" className="paper-reset" onClick={() => updateSharedBoard({ ...effective, ticTacToe: Array(9).fill(null), updatedAt: new Date().toISOString() })}><RotateCcw />{language === 'ru' ? 'Новая партия' : 'New game'}</button>
      </div>
    </section>
  </section>
}
