import { Check, CirclePlus, Pencil, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { PageIntro } from '../components/PageIntro'
import { useApp } from '../context/AppContext'
import type { WishCategory, WishlistItem } from '../models/types'

const blankForm = { title: '', description: '', category: 'gift' as WishCategory }

export function WishlistPage() {
  const { state, t, addWish, updateWish, deleteWish, toggleWish } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<WishlistItem | null>(null)
  const [form, setForm] = useState(blankForm)
  const partnerWishlist = state.partnerShared?.wishlist ?? []

  const openEdit = (wish: WishlistItem) => { setEditing(wish); setForm({ title: wish.title, description: wish.description, category: wish.category }); setShowForm(true) }
  const close = () => { setShowForm(false); setEditing(null); setForm(blankForm) }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) return
    if (editing) updateWish({ ...editing, ...form })
    else addWish(form)
    close()
  }

  return (
    <div className="page-wrap">
      <PageIntro title={t('wishlistTitle')} description={t('wishlistDescription')} action={<button className="compact-action" type="button" onClick={() => setShowForm(true)}><CirclePlus />{t('addWish')}</button>} />
      <section className="shared-list-section">
        <h2>{t('partnerWishlist')}</h2>
        {partnerWishlist.length ? <ul className="wish-list wish-list--partner">{partnerWishlist.map((wish) => <li key={`partner-${wish.id}`} className={wish.completed ? 'is-completed' : ''}><span className="wish-check read-only">{wish.completed && <Check />}</span><div className="wish-copy"><div><span className="category-label">{t(wish.category)}</span><h2>{wish.title}</h2></div>{wish.description && <p>{wish.description}</p>}</div></li>)}</ul> : <p className="shared-list-empty">{t('partnerWishlistEmpty')}</p>}
      </section>
      <h2 className="own-list-title">{t('yourWishlistForPartner')}</h2>
      {showForm && (
        <form className="wish-form" onSubmit={submit}>
          <label><span>{t('wishTitle')}</span><input autoFocus value={form.title} maxLength={60} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label><span>{t('wishDescription')}</span><textarea value={form.description} maxLength={180} rows={3} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label><span>{t('wishCategory')}</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as WishCategory })}><option value="gift">{t('gift')}</option><option value="experience">{t('experience')}</option><option value="care">{t('care')}</option></select></label>
          <div className="form-actions"><button type="button" className="text-button" onClick={close}>{t('cancel')}</button><button type="submit" className="primary-small">{t('save')}</button></div>
        </form>
      )}

      {state.wishlist.length === 0 ? (
        <div className="empty-state empty-state--plain"><h2>{t('noWishes')}</h2><p>{t('noWishesHint')}</p></div>
      ) : (
        <ul className="wish-list">
          {state.wishlist.map((wish) => (
            <li key={wish.id} className={wish.completed ? 'is-completed' : ''}>
              <button className="wish-check" type="button" aria-label={wish.completed ? t('completed') : t('markCompleted')} onClick={() => toggleWish(wish.id)}>{wish.completed && <Check />}</button>
              <div className="wish-copy"><div><span className="category-label">{t(wish.category)}</span><h2>{wish.title}</h2></div>{wish.description && <p>{wish.description}</p>}</div>
              <div className="wish-actions"><button type="button" aria-label={t('editWish')} onClick={() => openEdit(wish)}><Pencil /></button><button type="button" aria-label={t('deleteWish')} onClick={() => deleteWish(wish.id)}><Trash2 /></button></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

