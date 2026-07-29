import { useState } from 'react'
import { updateBook, deleteBook } from '../api/books.js'
import { resolveShelfKey } from '../lib/shelves.js'
import { useLocale } from '../i18n/i18n'

const CUSTOM_CATEGORY_VALUE = '__custom__'

// 這幾個選項值刻意維持中文：它們是使用者資料層（存進 category 欄位），不是介面文案
const CATEGORY_OPTIONS = ['小說', '散文', '心理', '設計', '商業', '歷史', '其他']

function buildInitialState(book) {
  const isPresetCategory = CATEGORY_OPTIONS.includes(book.category)
  return {
    title: book.title || '',
    author: book.author || '',
    // 用跟首頁分排一致的 resolveShelfKey，避免舊資料沒有 status 欄位時，
    // 表單預選跟書實際顯示的排（例如 Reading）對不上
    status: resolveShelfKey(book),
    category: book.category ? (isPresetCategory ? book.category : CUSTOM_CATEGORY_VALUE) : '',
    customCategory: book.category && !isPresetCategory ? book.category : '',
    coverFile: null,
    submitStatus: 'idle', // idle | submitting
    formError: '',
  }
}

export default function EditBookModal({ book, onClose, onSaved, onDeleted }) {
  const { t } = useLocale()
  const [state, setState] = useState(() => buildInitialState(book))

  const update = (patch) => setState((s) => ({ ...s, ...patch }))

  function handleCategoryChange(e) {
    const value = e.target.value
    update({
      category: value,
      customCategory: value === CUSTOM_CATEGORY_VALUE ? state.customCategory : '',
    })
  }

  function handleFileChange(e) {
    update({ coverFile: e.target.files?.[0] || null })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const title = state.title.trim()
    if (!title) {
      update({ formError: t('error.enterTitle') })
      return
    }

    const category = state.category === CUSTOM_CATEGORY_VALUE ? state.customCategory.trim() : state.category

    update({ submitStatus: 'submitting', formError: '' })
    try {
      const updated = await updateBook(book.id, {
        title,
        author: state.author.trim(),
        status: state.status,
        category: category || null,
        coverFile: state.coverFile,
      })
      onSaved(updated)
    } catch (err) {
      update({ submitStatus: 'idle', formError: err.message })
    }
  }

  async function handleDelete() {
    if (!confirm(t('confirm.deleteBook'))) return
    try {
      await deleteBook(book.id)
      onDeleted()
    } catch (err) {
      update({ formError: err.message })
    }
  }

  return (
    <div className="add-modal-backdrop" onClick={onClose}>
      <div className="add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('editBook.title')}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-modal-form">
          <label className="add-modal-label">
            {t('field.title')}
            <input
              type="text"
              value={state.title}
              onChange={(e) => update({ title: e.target.value })}
              style={{ fontSize: '16px' }}
              required
            />
          </label>

          <label className="add-modal-label">
            {t('field.authorOptional')}
            <input
              type="text"
              value={state.author}
              onChange={(e) => update({ author: e.target.value })}
              style={{ fontSize: '16px' }}
            />
          </label>

          <label className="add-modal-label">
            {t('field.status')}
            <select
              value={state.status}
              onChange={(e) => update({ status: e.target.value })}
              style={{ fontSize: '16px' }}
              required
            >
              <option value="to_read">To Read</option>
              <option value="reading">Reading</option>
              <option value="finished">Finished</option>
            </select>
          </label>

          <label className="add-modal-label">
            {t('field.categoryOptional')}
            <select value={state.category} onChange={handleCategoryChange} style={{ fontSize: '16px' }}>
              <option value="">{t('category.none')}</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={CUSTOM_CATEGORY_VALUE}>{t('category.custom')}</option>
            </select>
            {state.category === CUSTOM_CATEGORY_VALUE && (
              <input
                type="text"
                placeholder={t('category.customPlaceholder')}
                value={state.customCategory}
                onChange={(e) => update({ customCategory: e.target.value })}
                style={{ fontSize: '16px' }}
              />
            )}
          </label>

          <div className="add-modal-field">
            <label htmlFor="edit-modal-file-input" className="add-modal-label-text">
              {t('field.uploadCoverOptional')}
            </label>
            <div className="add-modal-file-row">
              <label htmlFor="edit-modal-file-input" className="add-modal-file-btn">
                {t('field.chooseFile')}
              </label>
              <span className="add-modal-file-name">
                {state.coverFile ? state.coverFile.name : t('field.noFile')}
              </span>
            </div>
            <input
              id="edit-modal-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="add-modal-file-input"
            />
          </div>

          {state.formError && <p className="form-error">{state.formError}</p>}

          <div className="modal-actions">
            <button type="button" className="add-page-btn add-page-btn-secondary--green" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="add-page-btn btn-frosted"
              disabled={state.submitStatus === 'submitting'}
            >
              {state.submitStatus === 'submitting' ? t('common.saving') : t('common.save')}
            </button>
          </div>

          <button type="button" className="edit-modal-delete" onClick={handleDelete}>
            {t('editBook.delete')}
          </button>
        </form>
      </div>
    </div>
  )
}
