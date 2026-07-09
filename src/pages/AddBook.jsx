import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchBooks } from '../api/googleBooks.js'
import { createBook } from '../api/books.js'

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

export default function AddBook() {
  const navigate = useNavigate()
  const [state, setState] = useState(initialState)

  const update = (patch) => setState((s) => ({ ...s, ...patch }))

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
      await createBook({
        title,
        author: state.manualAuthor.trim(),
        coverFile: state.coverFile,
        coverUrl: state.selected?.thumbnail,
        googleBooksId: state.selected?.id,
        status: state.manualStatus,
        category: category || null,
      })
      navigate('/')
    } catch (err) {
      update({ submitStatus: 'idle', formError: err.message })
    }
  }

  return (
    <div className="add-page">
      <header className="add-page-header">
        <button type="button" className="add-page-back" onClick={() => navigate('/')} aria-label="Back">
          ‹
        </button>
        <h1 className="add-page-title">Add Book</h1>
      </header>

      <div className="add-page-body">
        <div className="add-page-search">
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

        <form onSubmit={handleSubmit} className="add-page-form">
          <h2 className="add-page-section-title">Details</h2>

          <label className="add-page-label">
            Title
            <input
              type="text"
              value={state.manualTitle}
              onChange={(e) => update({ manualTitle: e.target.value })}
              style={{ fontSize: '16px' }}
              required
            />
          </label>

          <label className="add-page-label">
            Author (optional)
            <input
              type="text"
              value={state.manualAuthor}
              onChange={(e) => update({ manualAuthor: e.target.value })}
              style={{ fontSize: '16px' }}
            />
          </label>

          <label className="add-page-label">
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

          <label className="add-page-label">
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

          <div className="add-page-field">
            <label htmlFor="add-page-file-input" className="add-page-label-text">
              Upload cover (optional, replaces search result)
            </label>
            <div className="add-page-file-row">
              <label htmlFor="add-page-file-input" className="add-page-file-btn">
                Choose file
              </label>
              <span className="add-page-file-name">
                {state.coverFile ? state.coverFile.name : 'No file chosen'}
              </span>
            </div>
            <input
              id="add-page-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="add-page-file-input"
            />
          </div>

          {state.formError && <p className="form-error">{state.formError}</p>}

          <div className="add-page-actions">
            <button type="button" className="add-page-btn add-page-btn-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button
              type="submit"
              className="add-page-btn add-page-btn-primary"
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
