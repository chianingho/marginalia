import { useState } from 'react'
import { searchGoogleBooks } from '../api/googleBooks.js'
import { createBook } from '../api/books.js'

const initialState = {
  query: '',
  results: [],
  selected: null,
  manualTitle: '',
  manualAuthor: '',
  coverFile: null,
  status: 'idle', // idle | searching | submitting
  searchError: '',
  formError: '',
}

export default function AddBookModal({ onClose, onCreated }) {
  const [state, setState] = useState(initialState)

  const update = (patch) => setState((s) => ({ ...s, ...patch }))

  async function handleSearch(e) {
    e.preventDefault()
    if (!state.query.trim()) return

    update({ status: 'searching', searchError: '', results: [], selected: null })
    try {
      const results = await searchGoogleBooks(state.query)
      update({
        status: 'idle',
        results,
        manualTitle: state.query,
        searchError: results.length === 0 ? '找不到符合的書籍，可以手動輸入資訊與上傳封面' : '',
      })
    } catch (err) {
      update({ status: 'idle', searchError: err.message })
    }
  }

  function selectResult(result) {
    update({ selected: result, manualTitle: result.title, manualAuthor: result.author, coverFile: null })
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null
    update({ coverFile: file })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const title = state.manualTitle.trim()
    if (!title) {
      update({ formError: '請輸入書名' })
      return
    }

    update({ status: 'submitting', formError: '' })
    try {
      const book = await createBook({
        title,
        author: state.manualAuthor.trim(),
        coverFile: state.coverFile,
        coverUrl: state.selected?.coverUrl,
        googleBooksId: state.selected?.googleBooksId,
      })
      onCreated(book)
    } catch (err) {
      update({ status: 'idle', formError: err.message })
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>新增書籍</h2>
          <button className="icon-btn" onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="輸入書名搜尋封面與資訊"
            value={state.query}
            onChange={(e) => update({ query: e.target.value })}
          />
          <button type="submit" disabled={state.status === 'searching'}>
            {state.status === 'searching' ? '搜尋中…' : '搜尋'}
          </button>
        </form>

        {state.searchError && <p className="form-error">{state.searchError}</p>}

        {state.results.length > 0 && (
          <ul className="search-results">
            {state.results.map((result) => (
              <li
                key={result.googleBooksId}
                className={`search-result ${state.selected?.googleBooksId === result.googleBooksId ? 'selected' : ''}`}
                onClick={() => selectResult(result)}
              >
                {result.coverUrl ? (
                  <img src={result.coverUrl} alt={result.title} />
                ) : (
                  <div className="search-result-noimg">無封面</div>
                )}
                <div>
                  <p className="search-result-title">{result.title}</p>
                  {result.author && <p className="search-result-author">{result.author}</p>}
                  {result.publishedDate && <p className="search-result-date">{result.publishedDate}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="manual-form">
          <h3>確認 / 手動填寫資訊</h3>
          <label>
            書名
            <input
              type="text"
              value={state.manualTitle}
              onChange={(e) => update({ manualTitle: e.target.value })}
              required
            />
          </label>
          <label>
            作者（選填）
            <input
              type="text"
              value={state.manualAuthor}
              onChange={(e) => update({ manualAuthor: e.target.value })}
            />
          </label>
          <label>
            手動上傳封面（選填，會覆蓋搜尋到的封面）
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          {state.formError && <p className="form-error">{state.formError}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" disabled={state.status === 'submitting'}>
              {state.status === 'submitting' ? '新增中…' : '新增書籍'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
