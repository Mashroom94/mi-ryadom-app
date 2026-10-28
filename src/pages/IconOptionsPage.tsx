import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandMark, type BrandMarkVariant } from '../components/BrandMark'

const options: Array<{ variant: BrandMarkVariant; name: string; note: string; primary?: boolean }> = [
  { variant: 'together', name: 'Руки-сердце', note: 'Две руки складываются в сердце', primary: true },
  { variant: 'embrace', name: 'Объятие', note: 'Более мягкий и эмоциональный' },
  { variant: 'pulse', name: 'Пульс', note: 'Современнее и динамичнее' },
]

export function IconOptionsPage() {
  return (
    <main className="icon-options-page">
      <header className="icon-options-page__header">
        <Link to="/" aria-label="Вернуться на главную"><ArrowLeft aria-hidden="true" /></Link>
        <div>
          <h1>Иконка «Мы рядом»</h1>
          <p>Три направления одной тёплой айдентики</p>
        </div>
      </header>
      <section className="icon-options-grid" aria-label="Варианты иконки приложения">
        {options.map((option) => (
          <article className={option.primary ? 'icon-option is-primary' : 'icon-option'} key={option.variant}>
            <BrandMark variant={option.variant} title={`Вариант «${option.name}»`} />
            <div className="icon-option__copy">
              <div>
                <h2>{option.name}</h2>
                {option.primary && <span>Основной</span>}
              </div>
              <p>{option.note}</p>
            </div>
            <div className="icon-option__sizes" aria-label="Проверка в малых размерах">
              <BrandMark variant={option.variant} />
              <BrandMark variant={option.variant} />
            </div>
          </article>
        ))}
      </section>
      <p className="icon-options-page__hint">Основной вариант уже используется на экране загрузки и как иконка PWA.</p>
    </main>
  )
}
