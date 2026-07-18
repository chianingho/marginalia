import { useEffect, useState } from 'react'
import { searchBooks } from '../api/googleBooks.js'
import { createBook } from '../api/books.js'
import { useScrollLock } from '../lib/scrollLock.js'

const CUSTOM_CATEGORY_VALUE = '__custom__'

// 這幾個選項值刻意維持中文：它們是使用者資料層（存進 category 欄位），不是介面文案
const CATEGORY_OPTIONS = ['小說', '散文', '心理', '設計', '商業', '歷史', '其他']

const initialState = {
  query: '',
  results: [],
  searching: false,
  hasSearched: false,
  selected: null,
  manualTitle: '',
  manualAuthor: '',
  manualStatus: 'to_read',
  manualCategory: '',
  manualCustomCategory: '',
  coverFile: null,
  submitStatus: 'idle', // idle | submitting
  formError: '',
}

export default function AddBookModal({ onClose, onCreated }) {
  const [state, setState] = useState(initialState)

  const update = (patch) => setState((s) => ({ ...s, ...patch }))

  useScrollLock()

  useEffect(() => {
    const query = state.query.trim()
    if (!query) {
      update({ results: [], searching: false, hasSearched: false })
      return
    }

    update({ searching: true })
    const timer = setTimeout(async () => {
      const results = await searchBooks(query)
      update({ results, searching: false, hasSearched: true })
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.query])

  function selectResult(result) {
    update({
      selected: result,
      manualTitle: result.title,
      manualAuthor: result.authors === '作者不詳' ? '' : result.authors,
      coverFile: null,
    })
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null
    update({ coverFile: file })
  }

  function handleCategoryChange(e) {
    const value = e.target.value
    update({
      manualCategory: value,
      manualCustomCategory: value === CUSTOM_CATEGORY_VALUE ? state.manualCustomCategory : '',
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const title = state.manualTitle.trim()
    if (!title) {
      update({ formError: 'Please enter a title' })
      return
    }

    const category =
      state.manualCategory === CUSTOM_CATEGORY_VALUE
        ? state.manualCustomCategory.trim()
        : state.manualCategory

    update({ submitStatus: 'submitting', formError: '' })
    try {
      const book = await createBook({
        title,
        author: state.manualAuthor.trim(),
        coverFile: state.coverFile,
        coverUrl: state.selected?.thumbnail,
        googleBooksId: state.selected?.id,
        status: state.manualStatus,
        category: category || null,
      })
      onCreated(book)
    } catch (err) {
      update({ submitStatus: 'idle', formError: err.message })
    }
  }

  return (
    <div className="add-modal-backdrop" onClick={onClose}>
      <div className="add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="add-modal-title">Add Book</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="add-modal-search">
          <input
            type="text"
            placeholder="Search by title…"
            value={state.query}
            onChange={(e) => update({ query: e.target.value })}
            style={{ fontSize: '16px' }}
          />
        </div>

        {state.searching && <p className="form-error">Searching…</p>}
        {!state.searching && state.hasSearched && state.results.length === 0 && (
          <p className="form-error">No books found</p>
        )}

        {state.results.length > 0 && (
          <ul className="search-results">
            {state.results.map((result) => (
              <li
                key={result.id}
                className={`search-result ${state.selected?.id === result.id ? 'selected' : ''}`}
                onClick={() => selectResult(result)}
              >
                {result.thumbnail ? (
                  <img src={result.thumbnail} alt={result.title} />
                ) : (
                  <div className="search-result-noimg">{result.title.slice(0, 1)}</div>
                )}
                <div>
                  <p className="search-result-title">{result.title}</p>
                  <p className="search-result-author">{result.authors}</p>
                  {result.publishedDate && <p className="search-result-date">{result.publishedDate}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="add-modal-form">
          <h3 className="add-modal-section-title">Details</h3>

          <label className="add-modal-label">
            Title
            <input
              type="text"
              value={state.manualTitle}
              onChange={(e) => update({ manualTitle: e.target.value })}
              style={{ fontSize: '16px' }}
              required
            />
          </label>

          <label className="add-modal-label">
            Author (optional)
            <input
              type="text"
              value={state.manualAuthor}
              onChange={(e) => update({ manualAuthor: e.target.value })}
              style={{ fontSize: '16px' }}
            />
          </label>

          <label className="add-modal-label">
            Status
            <select
              value={state.manualStatus}
              onChange={(e) => update({ manualStatus: e.target.value })}
              style={{ fontSize: '16px' }}
              required
            >
              <option value="to_read">To Read</option>
              <option value="reading">Reading</option>
              <option value="finished">Finished</option>
            </select>
          </label>

          <label className="add-modal-label">
            Category (optional)
            <select value={state.manualCategory} onChange={handleCategoryChange} style={{ fontSize: '16px' }}>
              <option value="">None</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={CUSTOM_CATEGORY_VALUE}>Custom…</option>
            </select>
            {state.manualCategory === CUSTOM_CATEGORY_VALUE && (
              <input
                type="text"
                placeholder="Enter a category"
                value={state.manualCustomCategory}
                onChange={(e) => update({ manualCustomCategory: e.target.value })}
                style={{ fontSize: '16px' }}
              />
            )}
          </label>

          <div className="add-modal-field">
            <label htmlFor="add-modal-file-input" className="add-modal-label-text">
              Upload cover (optional, replaces search result)
            </label>
            <div className="add-modal-file-row">
              <label htmlFor="add-modal-file-input" className="add-modal-file-btn">
                Choose file
              </label>
              <span className="add-modal-file-name">
                {state.coverFile ? state.coverFile.name : 'No file chosen'}
              </span>
            </div>
            <input
              id="add-modal-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="add-modal-file-input"
            />
          </div>

          {state.formError && <p className="form-error">{state.formError}</p>}

          <div className="modal-actions">
            <button type="button" className="add-page-btn add-page-btn-secondary--green" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="add-page-btn btn-frosted"
              disabled={state.submitStatus === 'submitting'}
            >
              {state.submitStatus === 'submitting' ? 'Adding…' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
