import { Plus, Trash2, WalletCards } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { latestSharedMoneyLedger, moneySummary } from '../services/sharedTools'

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

export function SharedMoney() {
  const { state, updateMoneyLedger } = useApp()
  const language = state.profile.language
  const ledger = useMemo(() => latestSharedMoneyLedger(state.moneyLedger, state.partnerShared?.moneyLedger), [state.moneyLedger, state.partnerShared?.moneyLedger])
  const summary = moneySummary(ledger)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const add = (event: React.FormEvent) => {
    event.preventDefault()
    const value = Number(amount.replace(',', '.'))
    if (!title.trim() || !Number.isFinite(value) || value <= 0) return
    updateMoneyLedger({ ...ledger, entries: [{ id: newId(), title: title.trim(), amount: value, kind, paidBy: 'shared', createdAt: new Date().toISOString() }, ...ledger.entries], updatedAt: new Date().toISOString() })
    setTitle(''); setAmount('')
  }
  const format = (value: number) => new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 2 }).format(value)

  return <section className="shared-money" aria-labelledby="shared-money-title">
    <div className="shared-money__heading"><span><WalletCards /></span><div><h2 id="shared-money-title">{language === 'ru' ? 'Общие деньги' : 'Shared money'}</h2><p>{language === 'ru' ? 'Доходы и траты, которые касаются вас двоих' : 'Income and expenses for both of you'}</p></div></div>
    <div className="money-summary">
      <div><small>{language === 'ru' ? 'Баланс' : 'Balance'}</small><strong>{format(summary.balance)} ₽</strong></div>
      <div><small>{language === 'ru' ? 'Поступления' : 'Income'}</small><b className="is-income">+{format(summary.income)}</b></div>
      <div><small>{language === 'ru' ? 'Расходы' : 'Expenses'}</small><b className="is-expense">−{format(summary.expenses)}</b></div>
    </div>
    <form className="money-form" onSubmit={add}>
      <div className="money-kind"><button type="button" className={kind === 'expense' ? 'is-active' : ''} onClick={() => setKind('expense')}>{language === 'ru' ? 'Расход' : 'Expense'}</button><button type="button" className={kind === 'income' ? 'is-active' : ''} onClick={() => setKind('income')}>{language === 'ru' ? 'Поступление' : 'Income'}</button></div>
      <label><span>{language === 'ru' ? 'На что' : 'Title'}</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={language === 'ru' ? 'Например, продукты' : 'For example, groceries'} /></label>
      <label><span>{language === 'ru' ? 'Сумма' : 'Amount'}</span><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></label>
      <button type="submit" className="money-add"><Plus />{language === 'ru' ? 'Добавить' : 'Add'}</button>
    </form>
    <div className="money-list">{ledger.entries.length ? ledger.entries.map((entry) => <div className="money-entry" key={entry.id}><span className={entry.kind === 'income' ? 'is-income' : 'is-expense'}>{entry.kind === 'income' ? '+' : '−'}</span><div><strong>{entry.title}</strong><small>{new Date(entry.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')}</small></div><b>{format(entry.amount)} ₽</b><button type="button" aria-label={language === 'ru' ? 'Удалить' : 'Delete'} onClick={() => updateMoneyLedger({ ...ledger, entries: ledger.entries.filter((item) => item.id !== entry.id), updatedAt: new Date().toISOString() })}><Trash2 /></button></div>) : <p className="money-empty">{language === 'ru' ? 'Здесь появятся общие расходы и поступления.' : 'Shared expenses and income will appear here.'}</p>}</div>
  </section>
}
