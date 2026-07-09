import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchBooks } from '../api/books.js'
import { SHELF_DEFS, resolveShelfKey } from '../lib/shelves.js'

function groupByShelf(books) {
  const groups = { to_read: [], reading: [], finished: [] }
  for (const book of books) {
    groups[resolveShelfKey(book)].push(book)
  }
  return groups
}

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

function ShelfRow({ label, slug, books }) {
  return (
    <div className="shelf-row">
      <div className="shelf-row-header">
        <span className="shelf-row-label">{label}</span>
        <Link to={`/shelf/${slug}`} className="shelf-row-see-all">
          See all ›
        </Link>
      </div>
      <div className="shelf-scroll">
        <div className="shelf-track">
          {books.map((book, index) => (
            <Link
              to={`/books/${book.id}`}
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
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [scrimVisible, setScrimVisible] = useState(false)
  const scrimTimer = useRef(null)

  useEffect(() => {
    load()
  }, [])

  // 滾動時淡入 scrim，停止滾動 600ms 後淡出；已到頁面最底部時保持隱藏
  useEffect(() => {
    function handleScroll() {
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 8
      setScrimVisible(!atBottom)
      clearTimeout(scrimTimer.current)
      scrimTimer.current = setTimeout(() => setScrimVisible(false), 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrimTimer.current)
    }
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
  const groups = useMemo(() => groupByShelf(filteredBooks), [filteredBooks])

  return (
    <div className="bookshelf-page">
      <header className="bookshelf-header">
        <div className="bookshelf-header-titles">
          <p className="bookshelf-eyebrow">Marginalia</p>
          <h1 className="bookshelf-title">Books</h1>
        </div>
        <button
          type="button"
          className="bookshelf-search-btn"
          onClick={toggleSearch}
          aria-label={searchOpen ? '關閉搜尋' : '搜尋書櫃'}
          aria-expanded={searchOpen}
        >
          <SearchIcon />
        </button>
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
          {SHELF_DEFS.map((def) => (
            <ShelfRow key={def.key} label={def.label} slug={def.slug} books={groups[def.key]} />
          ))}
        </div>
      )}

      <div className={`bottom-scrim ${scrimVisible ? 'is-visible' : ''}`} aria-hidden="true" />
      <button type="button" className="add-book-btn" onClick={() => navigate('/add')}>
        <span className="add-book-btn-icon">＋</span>
        Add Book
      </button>
    </div>
  )
}
