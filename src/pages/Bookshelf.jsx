import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AddBookModal from '../components/AddBookModal.jsx'
import { fetchBooks } from '../api/books.js'
import { GROUP_BY_OPTIONS, buildShelfRows, loadGroupBy, saveGroupBy } from '../lib/shelves.js'

const GROUP_BY_SUBTITLE = { year: 'year', category: 'category' }

function matchesQuery(book, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    book.title.toLowerCase().includes(q) ||
    (book.author || '').toLowerCase().includes(q)
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="12" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="17" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function ShelfRow({ label, href, books }) {
  return (
    <div className="shelf-row">
      <div className="shelf-row-header">
        <span className="shelf-row-label">{label}</span>
        <Link to={href} className="shelf-row-see-all">
          See all ›
        </Link>
      </div>
      <div className="shelf-scroll">
        <div className="shelf-track">
          {books.map((book, index) => (
            <Link
              to={`/book/${book.id}`}
              className="shelf-book"
              key={book.id}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="shelf-book-cover">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} loading="lazy" />
                ) : (
                  <span className="shelf-book-placeholder">{book.title.slice(0, 1)}</span>
                )}
              </span>
            </Link>
          ))}
          <div className="shelf-plank" aria-hidden="true">
            <div className="shelf-plank-top" />
            <div className="shelf-plank-front" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Bookshelf() {
  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [groupBy, setGroupBy] = useState(loadGroupBy)
  const [filterOpen, setFilterOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setStatus('loading')
    try {
      const data = await fetchBooks()
      setBooks(data)
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  function handleGroupByChange(value) {
    setGroupBy(value)
    saveGroupBy(value)
    setFilterOpen(false)
  }

  function handleCreated(book) {
    setBooks((prev) => [book, ...prev])
    setShowAddModal(false)
  }

  function toggleSearch() {
    setSearchOpen((open) => {
      if (open) setQuery('')
      return !open
    })
  }

  const filteredBooks = useMemo(
    () => books.filter((book) => matchesQuery(book, query)),
    [books, query],
  )
  const rows = buildShelfRows(filteredBooks, groupBy)

  return (
    <div className="bookshelf-page">
      <header className="bookshelf-header">
        <div className="bookshelf-header-titles">
          <img
            src="/lockup.png"
            width="150"
            height="52"
            alt="Marginalia · Books"
            className="bookshelf-lockup"
          />
          {GROUP_BY_SUBTITLE[groupBy] && (
            <p className="bookshelf-eyebrow bookshelf-groupby">{GROUP_BY_SUBTITLE[groupBy]}</p>
          )}
        </div>

        <div className="bookshelf-header-icons">
          <button
            type="button"
            className="bookshelf-search-btn"
            onClick={toggleSearch}
            aria-label={searchOpen ? '關閉搜尋' : '搜尋書櫃'}
            aria-expanded={searchOpen}
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            className="bookshelf-filter-btn"
            onClick={() => setFilterOpen(true)}
            aria-label="Group by"
          >
            <FilterIcon />
          </button>
        </div>

        {searchOpen && (
          <div className="bookshelf-search-row">
            <input
              type="text"
              autoFocus
              placeholder="搜尋書名或作者"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ fontSize: '16px' }}
            />
          </div>
        )}
      </header>

      {status === 'loading' && <p className="bookshelf-status">載入中…</p>}
      {status === 'error' && <p className="bookshelf-status form-error">載入失敗：{error}</p>}

      {status === 'ready' && books.length === 0 && (
        <p className="bookshelf-status empty-hint">書庫還是空的，點擊下方「Add Book」開始紀錄你的閱讀吧！</p>
      )}

      {status === 'ready' && books.length > 0 && (
        <div className="shelf-rows">
          {rows.map((row) => (
            <ShelfRow
              key={row.key}
              label={row.label}
              href={`/shelf/${groupBy}/${encodeURIComponent(row.slug)}`}
              books={row.books}
            />
          ))}
        </div>
      )}

      <button type="button" className="add-book-btn add-book-btn--frosted" onClick={() => setShowAddModal(true)}>
        <span className="add-book-btn-icon">＋</span>
        Add Book
      </button>

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}

      {filterOpen && (
        <div className="action-sheet-backdrop" onClick={() => setFilterOpen(false)}>
          <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="action-sheet-title">Group by</p>
            {GROUP_BY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="action-sheet-option"
                onClick={() => handleGroupByChange(option.value)}
              >
                {option.label}
                {groupBy === option.value && <span className="action-sheet-check">✓</span>}
              </button>
            ))}
            <button type="button" className="action-sheet-cancel" onClick={() => setFilterOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
