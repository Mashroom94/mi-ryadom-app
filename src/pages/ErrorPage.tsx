import { CloudOff, Home, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'

type ErrorKind = 'not-found' | 'offline' | 'unexpected'

const errorContent: Record<ErrorKind, { code: string; title: string; text: string }> = {
  'not-found': {
    code: '404',
    title: 'Кажется, мы разминулись',
    text: 'Такой страницы нет или она переехала. Вернёмся туда, где вы рядом.',
  },
  offline: {
    code: 'Без сети',
    title: 'Связь ненадолго пропала',
    text: 'Ваши сохранённые моменты на месте. Проверьте интернет и попробуйте снова.',
  },
  unexpected: {
    code: 'Ошибка',
    title: 'Что-то пошло не так',
    text: 'Мы уже остановились и пробуем ещё раз. Если не поможет — вернитесь на главную.',
  },
}

type ErrorPageProps = { kind?: ErrorKind }

export function ErrorPage({ kind }: ErrorPageProps) {
  const params = useParams()
  const resolvedKind: ErrorKind = kind ?? (params.kind === 'offline' || params.kind === 'unexpected' ? params.kind : 'not-found')
  const content = errorContent[resolvedKind]

  return (
    <main className={`error-page error-page--${resolvedKind}`}>
      <div className="error-page__content">
        <div className="error-page__visual" aria-hidden="true">
          <BrandMark variant={resolvedKind === 'offline' ? 'pulse' : 'together'} />
          {resolvedKind === 'offline' && <CloudOff className="error-page__status-icon" />}
          <span className="error-page__code">{content.code}</span>
        </div>
        <h1>{content.title}</h1>
        <p>{content.text}</p>
        <div className="error-page__actions">
          <Link className="error-page__primary" to="/">
            <Home aria-hidden="true" />
            На главную
          </Link>
          {resolvedKind !== 'not-found' && (
            <button className="error-page__secondary" type="button" onClick={() => window.location.reload()}>
              <RefreshCw aria-hidden="true" />
              Попробовать снова
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
