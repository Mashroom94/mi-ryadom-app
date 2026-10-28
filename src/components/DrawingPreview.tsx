import type { DrawingStroke } from '../models/types'

export function DrawingPreview({ strokes, className, label }: { strokes: DrawingStroke[]; className?: string; label: string }) {
  return <svg className={className} viewBox="0 0 1000 600" role="img" aria-label={label}>
    <rect width="1000" height="600" fill="#fffdf9" />
    {strokes.map((stroke) => <polyline key={stroke.id} points={stroke.points.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>
}
