import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AddBookModal from '../components/AddBookModal.jsx'
import BrandBanner from '../components/BrandBanner.jsx'
import { fetchBooks } from '../api/books.js'

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

// v6 改版：無封面書籍改用手繪線稿書佔位，取代原本的字母縮寫方塊。
function CoverPlaceholder() {
  return (
    <svg
      className="bookshelf-cover-placeholder-icon"
      viewBox="0 0 80 120"
      width="100%"
      height="100%"
      fill="none"
      stroke="var(--color-ink)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 12c17-3 35-3 52 0 .8 32 .8 64 0 96-17-3-35-3-52 0-.8-32-.8-64 0-96z" />
      <path d="M24 42h32M24 56h32M24 70h20" />
    </svg>
  )
}

function caption(book) {
  return book.author ? `${book.title} · ${book.author}` : book.title
}

// v6 改版：分組（Status/Year/Category）、橫向 3D 書架、chips、Group by 動作選單
// 整組移除，改成攤平的 2 欄靜態書櫃格（見 marginalia-redesign-spec.md 第 6 節）。
// 搜尋沿用原本的 toggleSearch/query/matchesQuery，功能不變。
export default function Bookshelf() {
  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
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

  return (
    <div className="bookshelf-page">
      <header className="bookshelf-header">
        <BrandBanner />
      </header>

      <div className="bookshelf-filterrow">
        <p className="bookshelf-count">{filteredBooks.length} books</p>
        <button
          type="button"
          className="pill-btn"
          onClick={toggleSearch}
          aria-label={searchOpen ? '關閉搜尋' : '搜尋書櫃'}
          aria-expanded={searchOpen}
        >
          <SearchIcon />
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

      {status === 'loading' && <p className="bookshelf-status">載入中…</p>}
      {status === 'error' && <p className="bookshelf-status form-error">載入失敗：{error}</p>}

      {status === 'ready' && books.length === 0 && (
        <p className="bookshelf-status empty-hint">書庫還是空的，點擊下方「Add Book」開始紀錄你的閱讀吧！</p>
      )}

      {status === 'ready' && books.length > 0 && filteredBooks.length === 0 && (
        <p className="bookshelf-status empty-hint">找不到符合的書。</p>
      )}

      {status === 'ready' && filteredBooks.length > 0 && (
        <div className="bookshelf-grid-frame">
          <div className="bookshelf-grid">
            {filteredBooks.map((book) => (
              <Link to={`/book/${book.id}`} className="bookshelf-cell" key={book.id}>
                <span className="bookshelf-cover">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} loading="lazy" />
                  ) : (
                    <CoverPlaceholder />
                  )}
                </span>
                <p className="bookshelf-caption">{caption(book)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="add-book-btn btn-frosted" onClick={() => setShowAddModal(true)}>
        <span className="add-book-btn-icon">＋</span>
        Add Book
      </button>

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}
    </div>
  )
}
