import { CalendarDays, ChevronDown, Pencil, Plus, Save, Trash2, WalletCards, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { MoneyEntry, MoneyEnvelope } from '../models/types'
import { canSpendFromEnvelope, envelopeSummary, latestSharedMoneyLedger, moneySummary } from '../services/sharedTools'

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

export function SharedEnvelopeMoneyV2() {
  const { state, updateMoneyLedger } = useApp()
  const ru = state.profile.language === 'ru'
  const ledger = useMemo(() => latestSharedMoneyLedger(state.moneyLedger, state.partnerShared?.moneyLedger), [state.moneyLedger, state.partnerShared?.moneyLedger])
  const total = moneySummary(ledger)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [openId, setOpenId] = useState<string | null>(ledger.envelopes[0]?.id ?? null)
  const [editEnvelopeId, setEditEnvelopeId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [kind, setKind] = useState<'income' | 'expense'>('income')
  const [entryLabel, setEntryLabel] = useState('')
  const [entryAmount, setEntryAmount] = useState('')
  const [entryNote, setEntryNote] = useState('')
  const [editEntryId, setEditEntryId] = useState<string | null>(null)
  const amount = (value: string) => Number(value.replace(',', '.'))
  const format = (value: number) => new Intl.NumberFormat(ru ? 'ru-RU' : 'en-US', { maximumFractionDigits: 2 }).format(value)
  const formatDate = (value?: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString(ru ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : (ru ? 'Без срока' : 'No deadline')
  const save = (envelopes: MoneyEnvelope[]) => updateMoneyLedger({ ...ledger, entries: [], envelopes, updatedAt: new Date().toISOString() })
  const resetEntry = () => { setEntryLabel(''); setEntryAmount(''); setEntryNote(''); setEditEntryId(null) }

  const createEnvelope = (event: React.FormEvent) => {
    event.preventDefault(); const sum = amount(target)
    if (!title.trim() || !date || !Number.isFinite(sum) || sum <= 0) return
    const id = newId(); save([{ id, title: title.trim(), targetAmount: sum, targetDate: date, note: note.trim() || undefined, entries: [], createdAt: new Date().toISOString() }, ...ledger.envelopes])
    setTitle(''); setTarget(''); setDate(''); setNote(''); setOpenId(id); setKind('income')
  }
  const startEnvelopeEdit = (envelope: MoneyEnvelope) => { setEditEnvelopeId(envelope.id); setEditTitle(envelope.title); setEditTarget(String(envelope.targetAmount)); setEditDate(envelope.targetDate ?? ''); setEditNote(envelope.note ?? '') }
  const saveEnvelopeEdit = (envelopeId: string) => {
    const sum = amount(editTarget)
    if (!editTitle.trim() || !editDate || !Number.isFinite(sum) || sum <= 0) return
    save(ledger.envelopes.map((item) => item.id === envelopeId ? { ...item, title: editTitle.trim(), targetAmount: sum, targetDate: editDate, note: editNote.trim() || undefined } : item)); setEditEnvelopeId(null)
  }
  const submitEntry = (event: React.FormEvent, envelope: MoneyEnvelope) => {
    event.preventDefault(); const sum = amount(entryAmount)
    if (!entryLabel.trim() || !Number.isFinite(sum) || sum <= 0 || (kind === 'expense' && !canSpendFromEnvelope(envelope) && !editEntryId)) return
    const next: MoneyEntry = editEntryId
      ? { ...(envelope.entries.find((item) => item.id === editEntryId)!), title: entryLabel.trim(), source: kind === 'income' ? entryLabel.trim() : undefined, note: entryNote.trim() || undefined, amount: sum, kind }
      : { id: newId(), title: entryLabel.trim(), source: kind === 'income' ? entryLabel.trim() : undefined, note: entryNote.trim() || undefined, amount: sum, kind, paidBy: 'shared', createdAt: new Date().toISOString() }
    save(ledger.envelopes.map((item) => item.id === envelope.id ? { ...item, entries: editEntryId ? item.entries.map((entry) => entry.id === editEntryId ? next : entry) : [next, ...item.entries] } : item)); resetEntry()
  }
  const startEntryEdit = (entry: MoneyEntry) => { setEditEntryId(entry.id); setKind(entry.kind); setEntryLabel(entry.title); setEntryAmount(String(entry.amount)); setEntryNote(entry.note ?? '') }

  return <section className="shared-money" aria-labelledby="shared-money-title">
    <div className="shared-money__heading"><span><WalletCards /></span><div><h2 id="shared-money-title">{ru ? 'Финансы по конвертам' : 'Envelope budgeting'}</h2><p>{ru ? 'Сначала поставьте цель, затем отмечайте взносы и траты.' : 'Set a goal first, then track contributions and spending.'}</p></div></div>
    <div className="money-summary"><div><small>{ru ? 'Доступно сейчас' : 'Available now'}</small><strong>{format(total.balance)} ₽</strong></div><div><small>{ru ? 'Закинули' : 'Contributed'}</small><b className="is-income">+{format(total.income)}</b></div><div><small>{ru ? 'Потратили' : 'Spent'}</small><b className="is-expense">−{format(total.expenses)}</b></div></div>
    <form className="envelope-create" onSubmit={createEnvelope}>
      <h3>{ru ? 'Новая цель' : 'New goal'}</h3>
      <label><span>{ru ? 'Для чего копим' : 'What for'}</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={ru ? 'Например, отпуск' : 'For example, vacation'} required /></label>
      <label><span>{ru ? 'Сколько нужно' : 'Amount needed'}</span><input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0 ₽" required /></label>
      <label className="envelope-date"><span>{ru ? 'Срок цели' : 'Target date'}</span><span className="money-date-input"><CalendarDays aria-hidden="true" /><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></span></label>
      <label className="money-note-field"><span>{ru ? 'Заметка (необязательно)' : 'Note (optional)'}</span><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={ru ? 'Детали, договорённости или важные уточнения' : 'Details, agreements, or important notes'} /></label>
      <button type="submit" className="money-add"><Plus />{ru ? 'Создать конверт' : 'Create envelope'}</button>
    </form>
    <div className="envelope-list">{ledger.envelopes.length ? ledger.envelopes.map((envelope) => {
      const summary = envelopeSummary(envelope); const open = openId === envelope.id; const unlocked = canSpendFromEnvelope(envelope); const editing = editEnvelopeId === envelope.id
      return <article className={`money-envelope ${open ? 'is-open' : ''}`} key={envelope.id}>
        <div className="money-envelope__header"><button type="button" className="money-envelope__summary" aria-expanded={open} onClick={() => { setOpenId(open ? null : envelope.id); resetEntry(); setKind(unlocked ? kind : 'income') }}><span><strong>{envelope.title}</strong><small>{formatDate(envelope.targetDate)}</small></span><b>{format(summary.income)} / {format(envelope.targetAmount)} ₽</b><ChevronDown /><i><span style={{ width: `${summary.progress}%` }} /></i></button><button type="button" className="money-edit-button" aria-label={ru ? 'Изменить цель' : 'Edit goal'} onClick={() => { setOpenId(envelope.id); startEnvelopeEdit(envelope) }}><Pencil /></button></div>
        {open && <div className="money-envelope__body">
          {editing && <div className="envelope-edit"><label><span>{ru ? 'Цель' : 'Goal'}</span><input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></label><label><span>{ru ? 'Сколько нужно' : 'Amount needed'}</span><input inputMode="decimal" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} /></label><label><span>{ru ? 'Срок' : 'Deadline'}</span><span className="money-date-input"><CalendarDays aria-hidden="true" /><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} /></span></label><label className="money-note-field"><span>{ru ? 'Заметка' : 'Note'}</span><textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} maxLength={500} /></label><div><button type="button" onClick={() => saveEnvelopeEdit(envelope.id)}><Save />{ru ? 'Сохранить' : 'Save'}</button><button type="button" onClick={() => setEditEnvelopeId(null)}><X />{ru ? 'Отмена' : 'Cancel'}</button></div></div>}
          {envelope.note && <p className="money-envelope__note">{envelope.note}</p>}
          <div className="envelope-stages"><span><small>{ru ? 'Цель' : 'Goal'}</small><b>{format(envelope.targetAmount)} ₽</b></span><span><small>{ru ? 'Закинули' : 'Contributed'}</small><b>{format(summary.income)} ₽</b></span><span><small>{ru ? 'Доступно' : 'Available'}</small><b>{format(summary.balance)} ₽</b></span></div>
          <form className="money-form" onSubmit={(event) => submitEntry(event, envelope)}>
            <div className="money-kind"><button type="button" className={kind === 'income' ? 'is-active' : ''} onClick={() => { setKind('income'); resetEntry() }}>{ru ? 'Закинуть' : 'Contribute'}</button><button type="button" disabled={!unlocked} className={kind === 'expense' ? 'is-active' : ''} onClick={() => { setKind('expense'); resetEntry() }}>{ru ? 'Трата' : 'Expense'}</button></div>
            {!unlocked && <p className="money-stage-hint">{ru ? 'Траты откроются, когда цель будет собрана.' : 'Expenses unlock when the goal is reached.'}</p>}
            <label><span>{kind === 'income' ? (ru ? 'От кого взнос' : 'Contribution from') : (ru ? 'На что потратили' : 'Spent on')}</span><input value={entryLabel} onChange={(e) => setEntryLabel(e.target.value)} placeholder={kind === 'income' ? (ru ? 'Например, от Маши' : 'For example, from Maria') : (ru ? 'Например, билеты' : 'For example, tickets')} /></label>
            <label><span>{ru ? 'Сколько' : 'Amount'}</span><input inputMode="decimal" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="0 ₽" /></label>
            <label className="money-note-field"><span>{ru ? 'Подробности (необязательно)' : 'Details (optional)'}</span><textarea value={entryNote} onChange={(e) => setEntryNote(e.target.value)} maxLength={500} placeholder={ru ? 'Можно дописать всё важное' : 'Add any useful details'} /></label>
            <button type="submit" className="money-add">{editEntryId ? <Save /> : <Plus />}{editEntryId ? (ru ? 'Сохранить изменения' : 'Save changes') : (kind === 'income' ? (ru ? 'Добавить взнос' : 'Add contribution') : (ru ? 'Добавить трату' : 'Add expense'))}</button>
          </form>
          <div className="money-list">{envelope.entries.length ? envelope.entries.map((entry) => <div className="money-entry" key={entry.id}><span className={entry.kind === 'income' ? 'is-income' : 'is-expense'}>{entry.kind === 'income' ? '+' : '−'}</span><div><strong>{entry.title}</strong><small>{new Date(entry.createdAt).toLocaleDateString(ru ? 'ru-RU' : 'en-US')}</small>{entry.note && <em>{entry.note}</em>}</div><b>{format(entry.amount)} ₽</b><div className="money-entry__actions"><button type="button" aria-label={ru ? 'Изменить запись' : 'Edit entry'} onClick={() => startEntryEdit(entry)}><Pencil /></button><button type="button" aria-label={ru ? 'Удалить запись' : 'Delete entry'} onClick={() => save(ledger.envelopes.map((item) => item.id === envelope.id ? { ...item, entries: item.entries.filter((candidate) => candidate.id !== entry.id) } : item))}><Trash2 /></button></div></div>) : <p className="money-empty">{ru ? 'Сначала добавьте первый взнос.' : 'Add the first contribution.'}</p>}</div>
          <button type="button" className="envelope-delete" onClick={() => save(ledger.envelopes.filter((item) => item.id !== envelope.id))}><Trash2 />{ru ? 'Удалить конверт' : 'Delete envelope'}</button>
        </div>}
      </article>
    }) : <p className="money-empty">{ru ? 'Создайте первую цель — укажите сумму и срок.' : 'Create your first goal with an amount and deadline.'}</p>}</div>
  </section>
}
