export type BrandMarkVariant = 'together' | 'embrace' | 'pulse'

type BrandMarkProps = {
  className?: string
  title?: string
  variant?: BrandMarkVariant
}

export function BrandMark({ className = '', title, variant = 'together' }: BrandMarkProps) {
  const labelled = Boolean(title)

  return (
    <svg
      className={`brand-mark brand-mark--${variant} ${className}`.trim()}
      viewBox="0 0 160 160"
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={title}
    >
      <rect className="brand-mark__tile" width="160" height="160" rx="39" />
      {variant === 'together' && (
        <>
          <path className="brand-mark__hand-heart" d="M80 126 50 98C34 83 31 68 38 53c8-17 28-20 42-5m0 78 30-28c16-15 19-30 12-45-8-17-28-20-42-5" />
          <path className="brand-mark__hand-heart" d="m80 48-14 15c-6 6-6 13 0 18 6 5 13 4 18-2l10-10c6-6 13-5 19 1l10 10M109 91l11 10m-22 0 11 10m-22 0 11 10" />
        </>
      )}
      {variant === 'embrace' && (
        <>
          <path className="brand-mark__person brand-mark__person--left" d="M31 83c0-34 18-56 45-56 18 0 31 9 38 25-18 7-31 26-31 48v32H68c-22 0-37-18-37-49Z" />
          <path className="brand-mark__person brand-mark__person--right" d="M129 83c0-34-18-56-45-56-18 0-31 9-38 25 18 7 31 26 31 48v32h15c22 0 37-18 37-49Z" />
          <path className="brand-mark__embrace-line" d="M45 104c12 18 26 27 42 27 12 0 23-5 32-15" />
          <path className="brand-mark__heart" d="M80 91c-14-8-21-16-21-25 0-8 6-14 14-14 3 0 6 2 7 5 2-3 4-5 8-5 8 0 14 6 14 14 0 9-7 17-22 25Z" />
        </>
      )}
      {variant === 'pulse' && (
        <>
          <path className="brand-mark__person brand-mark__person--left" d="M25 83c0-32 18-53 44-53 17 0 30 9 37 25-16 8-27 26-27 46v31H65c-24 0-40-18-40-49Z" />
          <path className="brand-mark__person brand-mark__person--right" d="M135 83c0-32-18-53-44-53-17 0-30 9-37 25 16 8 27 26 27 46v31h14c24 0 40-18 40-49Z" />
          <path className="brand-mark__pulse-line" d="M38 88h25l8-15 12 31 10-20 7 4h22" />
          <path className="brand-mark__heart brand-mark__heart--small" d="M80 66c-10-6-15-11-15-18 0-6 4-10 10-10 2 0 4 1 5 4 1-3 3-4 6-4 6 0 10 4 10 10 0 7-5 12-16 18Z" />
        </>
      )}
    </svg>
  )
}
