import { ChevronDown, Plus, Trash2, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { MoneyEntry } from '../models/types'
import { envelopeSummary, latestSharedMoneyLedger, moneySummary } from '../services/sharedTools'

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

export function SharedEnvelopeMoney() {
  const { state, updateMoneyLedger } = useApp()
  const language = state.profile.language
  const ledger = useMemo(() => latestSharedMoneyLedger(state.moneyLedger, state.partnerShared?.moneyLedger), [state.moneyLedger, state.partnerShared?.moneyLedger])
  const summary = moneySummary(ledger)
  const [envelopeTitle, setEnvelopeTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [activeEnvelopeId, setActiveEnvelopeId] = useState<string | null>(ledger.envelopes[0]?.id ?? null)
  const [entryTitle, setEntryTitle] = useState('')
  const [entrySource, setEntrySource] = useState('')
  const [entryAmount, setEntryAmount] = useState('')
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const format = (value: number) => new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 2 }).format(value)
  const parseAmount = (value: string) => Number(value.replace(',', '.'))
  const saveLedger = (envelopes: typeof ledger.envelopes) => updateMoneyLedger({ ...ledger, entries: [], envelopes, updatedAt: new Date().toISOString() })

  const createEnvelope = (event: React.FormEvent) => {
    event.preventDefault()
    const target = parseAmount(targetAmount)
    if (!envelopeTitle.trim() || !Number.isFinite(target) || target <= 0) return
    const id = newId()
    saveLedger([{ id, title: envelopeTitle.trim(), targetAmount: target, entries: [], createdAt: new Date().toISOString() }, ...ledger.envelopes])
    setEnvelopeTitle(''); setTargetAmount(''); setActiveEnvelopeId(id)
  }
  const addEntry = (event: React.FormEvent, envelopeId: string) => {
    event.preventDefault()
    const amount = parseAmount(entryAmount)
    const title = kind === 'income' ? entrySource.trim() : entryTitle.trim()
    if (!title || !Number.isFinite(amount) || amount <= 0) return
    const entry: MoneyEntry = { id: newId(), title, source: kind === 'income' ? entrySource.trim() : undefined, amount, kind, paidBy: 'shared', createdAt: new Date().toISOString() }
    saveLedger(ledger.envelopes.map((envelope) => envelope.id === envelopeId ? { ...envelope, entries: [entry, ...envelope.entries] } : envelope))
    setEntryTitle(''); setEntrySource(''); setEntryAmount('')
  }

  return <section className="shared-money" aria-labelledby="shared-money-title">
    <div className="shared-money__heading"><span><WalletCards /></span><div><h2 id="shared-money-title">{language === 'ru' ? 'Финансы по конвертам' : 'Envelope budgeting'}</h2><p>{language === 'ru' ? 'Копите на цели и ведите общие поступления и расходы.' : 'Save for goals and track shared income and expenses.'}</p></div></div>
    <div className="money-summary">
      <div><small>{language === 'ru' ? 'Общий баланс' : 'Total balance'}</small><strong>{format(summary.balance)} ₽</strong></div>
      <div><small>{language === 'ru' ? 'Поступления' : 'Income'}</small><b className="is-income">+{format(summary.income)}</b></div>
      <div><small>{language === 'ru' ? 'Расходы' : 'Expenses'}</small><b className="is-expense">−{format(summary.expenses)}</b></div>
    </div>
    <form className="envelope-create" onSubmit={createEnvelope}>
      <h3>{language === 'ru' ? 'Новый конверт' : 'New envelope'}</h3>
      <label><span>{language === 'ru' ? 'Для чего' : 'Goal'}</span><input value={envelopeTitle} onChange={(event) => setEnvelopeTitle(event.target.value)} placeholder={language === 'ru' ? 'Например, отпуск' : 'For example, vacation'} /></label>
      <label><span>{language === 'ru' ? 'Сколько нужно' : 'Target amount'}</span><input inputMode="decimal" value={targetAmount} onChange={(event) => setTargetAmount(event.target.value)} placeholder="0 ₽" /></label>
      <button type="submit" className="money-add"><Plus />{language === 'ru' ? 'Создать конверт' : 'Create envelope'}</button>
    </form>
    <div className="envelope-list">{ledger.envelopes.length ? ledger.envelopes.map((envelope) => {
      const itemSummary = envelopeSummary(envelope)
      const open = activeEnvelopeId === envelope.id
      return <article className={`money-envelope ${open ? 'is-open' : ''}`} key={envelope.id}>
        <button type="button" className="money-envelope__summary" aria-expanded={open} onClick={() => setActiveEnvelopeId(open ? null : envelope.id)}>
          <span><strong>{envelope.title}</strong><small>{itemSummary.remaining > 0 ? (language === 'ru' ? `Осталось ${format(itemSummary.remaining)} ₽` : `${format(itemSummary.remaining)} ₽ left`) : (language === 'ru' ? 'Цель собрана' : 'Goal reached')}</small></span>
          <b>{format(itemSummary.balance)} / {format(envelope.targetAmount)} ₽</b><ChevronDown />
          <i><span style={{ width: `${itemSummary.progress}%` }} /></i>
        </button>
        {open && <div className="money-envelope__body">
          <form className="money-form" onSubmit={(event) => addEntry(event, envelope.id)}>
            <div className="money-kind"><button type="button" className={kind === 'expense' ? 'is-active' : ''} onClick={() => setKind('expense')}>{language === 'ru' ? 'Расход' : 'Expense'}</button><button type="button" className={kind === 'income' ? 'is-active' : ''} onClick={() => setKind('income')}>{language === 'ru' ? 'Поступление' : 'Income'}</button></div>
            <label><span>{kind === 'income' ? (language === 'ru' ? 'От кого или откуда' : 'From whom or where') : (language === 'ru' ? 'На что потратили' : 'What for')}</span><input value={kind === 'income' ? entrySource : entryTitle} onChange={(event) => kind === 'income' ? setEntrySource(event.target.value) : setEntryTitle(event.target.value)} placeholder={kind === 'income' ? (language === 'ru' ? 'Например, от Саши' : 'For example, from Alex') : (language === 'ru' ? 'Например, билеты' : 'For example, tickets')} /></label>
            <label><span>{language === 'ru' ? 'Сколько' : 'Amount'}</span><input inputMode="decimal" value={entryAmount} onChange={(event) => setEntryAmount(event.target.value)} placeholder="0 ₽" /></label>
            <button type="submit" className="money-add"><Plus />{language === 'ru' ? 'Добавить запись' : 'Add entry'}</button>
          </form>
          <div className="money-list">{envelope.entries.length ? envelope.entries.map((entry) => <div className="money-entry" key={entry.id}><span className={entry.kind === 'income' ? 'is-income' : 'is-expense'}>{entry.kind === 'income' ? '+' : '−'}</span><div><strong>{entry.title}</strong><small>{new Date(entry.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}</small></div><b>{format(entry.amount)} ₽</b><button type="button" aria-label={language === 'ru' ? 'Удалить запись' : 'Delete entry'} onClick={() => saveLedger(ledger.envelopes.map((item) => item.id === envelope.id ? { ...item, entries: item.entries.filter((candidate) => candidate.id !== entry.id) } : item))}><Trash2 /></button></div>) : <p className="money-empty">{language === 'ru' ? 'В конверте пока нет записей.' : 'No entries in this envelope yet.'}</p>}</div>
          <button type="button" className="envelope-delete" onClick={() => saveLedger(ledger.envelopes.filter((item) => item.id !== envelope.id))}><Trash2 />{language === 'ru' ? 'Удалить конверт' : 'Delete envelope'}</button>
        </div>}
      </article>
    }) : <p className="money-empty">{language === 'ru' ? 'Создайте первый конверт — например, на отпуск, ремонт или общий подарок.' : 'Create your first envelope for a vacation, renovation, or shared gift.'}</p>}</div>
  </section>
}
