import { useEffect, useState } from 'react'
import { searchBooks } from '../api/googleBooks.js'
import { createBook } from '../api/books.js'

const CUSTOM_CATEGORY_VALUE = '__custom__'

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
  status: 'idle', // idle | submitting
  formError: '',
}

export default function AddBookModal({ onClose, onCreated }) {
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

  async function handleSubmit(e) {
    e.preventDefault()
    const title = state.manualTitle.trim()
    if (!title) {
      update({ formError: '請輸入書名' })
      return
    }

    const category =
      state.manualCategory === CUSTOM_CATEGORY_VALUE
        ? state.manualCustomCategory.trim()
        : state.manualCategory

    update({ status: 'submitting', formError: '' })
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
      update({ status: 'idle', formError: err.message })
    }
  }

  function handleCategoryChange(e) {
    const value = e.target.value
    update({
      manualCategory: value,
      manualCustomCategory: value === CUSTOM_CATEGORY_VALUE ? state.manualCustomCategory : '',
    })
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

        <div className="search-form">
          <input
            type="text"
            placeholder="輸入書名搜尋封面與資訊"
            value={state.query}
            onChange={(e) => update({ query: e.target.value })}
            style={{ fontSize: '16px' }}
          />
        </div>

        {state.searching && <p className="form-error">搜尋中…</p>}
        {!state.searching && state.hasSearched && state.results.length === 0 && (
          <p className="form-error">找不到相關書籍</p>
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

        <form onSubmit={handleSubmit} className="manual-form">
          <h3>確認 / 手動填寫資訊</h3>
          <label>
            書名
            <input
              type="text"
              value={state.manualTitle}
              onChange={(e) => update({ manualTitle: e.target.value })}
              style={{ fontSize: '16px' }}
              required
            />
          </label>
          <label>
            作者（選填）
            <input
              type="text"
              value={state.manualAuthor}
              onChange={(e) => update({ manualAuthor: e.target.value })}
              style={{ fontSize: '16px' }}
            />
          </label>
          <label>
            狀態
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
          <label>
            類別（選填）
            <select value={state.manualCategory} onChange={handleCategoryChange} style={{ fontSize: '16px' }}>
              <option value="">不指定</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value={CUSTOM_CATEGORY_VALUE}>自訂...</option>
            </select>
            {state.manualCategory === CUSTOM_CATEGORY_VALUE && (
              <input
                type="text"
                placeholder="輸入自訂類別"
                value={state.manualCustomCategory}
                onChange={(e) => update({ manualCustomCategory: e.target.value })}
                style={{ fontSize: '16px' }}
              />
            )}
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
