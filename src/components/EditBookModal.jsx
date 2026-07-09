import { useState } from 'react'
import { updateBook, deleteBook } from '../api/books.js'
import { resolveShelfKey } from '../lib/shelves.js'

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
      update({ formError: 'Please enter a title' })
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
    if (!confirm('Delete this book? This cannot be undone.')) return
    try {
      await deleteBook(book.id)
      onDeleted()
    } catch (err) {
      update({ formError: err.message })
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Book</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-modal-form">
          <label className="edit-modal-label">
            Title
            <input
              type="text"
              value={state.title}
              onChange={(e) => update({ title: e.target.value })}
              style={{ fontSize: '16px' }}
              required
            />
          </label>

          <label className="edit-modal-label">
            Author (optional)
            <input
              type="text"
              value={state.author}
              onChange={(e) => update({ author: e.target.value })}
              style={{ fontSize: '16px' }}
            />
          </label>

          <label className="edit-modal-label">
            Status
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

          <label className="edit-modal-label">
            Category (optional)
            <select value={state.category} onChange={handleCategoryChange} style={{ fontSize: '16px' }}>
              <option value="">None</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={CUSTOM_CATEGORY_VALUE}>Custom…</option>
            </select>
            {state.category === CUSTOM_CATEGORY_VALUE && (
              <input
                type="text"
                placeholder="Enter a category"
                value={state.customCategory}
                onChange={(e) => update({ customCategory: e.target.value })}
                style={{ fontSize: '16px' }}
              />
            )}
          </label>

          <div className="edit-modal-field">
            <label htmlFor="edit-modal-file-input" className="edit-modal-label-text">
              Upload cover (optional, replaces current cover)
            </label>
            <div className="edit-modal-file-row">
              <label htmlFor="edit-modal-file-input" className="edit-modal-file-btn">
                Choose file
              </label>
              <span className="edit-modal-file-name">
                {state.coverFile ? state.coverFile.name : 'No file chosen'}
              </span>
            </div>
            <input
              id="edit-modal-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="edit-modal-file-input"
            />
          </div>

          {state.formError && <p className="form-error">{state.formError}</p>}

          <div className="modal-actions">
            <button type="button" className="add-page-btn add-page-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="add-page-btn add-page-btn-primary"
              disabled={state.submitStatus === 'submitting'}
            >
              {state.submitStatus === 'submitting' ? 'Saving…' : 'Save'}
            </button>
          </div>

          <button type="button" className="edit-modal-delete" onClick={handleDelete}>
            Delete this book
          </button>
        </form>
      </div>
    </div>
  )
}
