import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AddBookModal from '../components/AddBookModal.jsx'
import { fetchBooks } from '../api/books.js'
import { GROUP_BY_OPTIONS, buildShelfRows, loadGroupBy, saveGroupBy } from '../lib/shelves.js'

const GROUP_BY_SUBTITLE = { year: 'by year', category: 'by category' }

function FilterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="2" fill="#fdfcfa" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="12" r="2" fill="#fdfcfa" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="17" r="2" fill="#fdfcfa" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

// 螢光筆刷背景：疊 4 條粗橫筆畫 + feTurbulence/feDisplacementMap 做出毛邊墨感，純 SVG，不用外部圖檔
function BrushHighlight() {
  return (
    <svg className="bookshelf-title-brush" viewBox="0 0 140 50" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <filter id="brush-rough" x="-30%" y="-60%" width="160%" height="220%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85 0.4" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#brush-rough)">
        <path d="M6,12 Q45,4 82,10 T134,8" stroke="#F5C842" strokeWidth="22" strokeLinecap="round" fill="none" opacity="0.4" />
        <path d="M10,22 Q50,15 88,20 T130,19" stroke="#F5C842" strokeWidth="19" strokeLinecap="round" fill="none" opacity="0.32" />
        <path d="M4,32 Q46,25 84,30 T132,29" stroke="#F5C842" strokeWidth="24" strokeLinecap="round" fill="none" opacity="0.42" />
        <path d="M12,41 Q52,36 90,39 T126,38" stroke="#F5C842" strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.3" />
      </g>
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
  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [groupBy, setGroupBy] = useState(loadGroupBy)
  const [filterOpen, setFilterOpen] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
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

  function handleGroupByChange(value) {
    setGroupBy(value)
    saveGroupBy(value)
    setFilterOpen(false)
  }

  function handleCreated(book) {
    setBooks((prev) => [book, ...prev])
    setShowAddModal(false)
  }

  const rows = buildShelfRows(books, groupBy)

  return (
    <div className="bookshelf-page">
      <header className="bookshelf-header">
        <div className="bookshelf-header-titles">
          <p className="bookshelf-eyebrow">Marginalia</p>
          <div className="bookshelf-title-wrap">
            <BrushHighlight />
            <h1 className="bookshelf-title">Books</h1>
          </div>
          {GROUP_BY_SUBTITLE[groupBy] && (
            <p className="bookshelf-eyebrow bookshelf-groupby">{GROUP_BY_SUBTITLE[groupBy]}</p>
          )}
        </div>
        <button
          type="button"
          className="bookshelf-filter-btn"
          onClick={() => setFilterOpen(true)}
          aria-label="Group by"
        >
          <FilterIcon />
        </button>
      </header>

      {status === 'loading' && <p className="bookshelf-status">載入中…</p>}
      {status === 'error' && <p className="bookshelf-status form-error">載入失敗：{error}</p>}

      {status === 'ready' && books.length === 0 && (
        <p className="bookshelf-status empty-hint">書庫還是空的，點擊下方「Add Book」開始紀錄你的閱讀吧！</p>
      )}

      {status === 'ready' && books.length > 0 && (
        <div className="shelf-rows">
          {rows.map((row) => (
            <ShelfRow key={row.key} label={row.label} href={`/shelf/${groupBy}/${row.slug}`} books={row.books} />
          ))}
        </div>
      )}

      <div className={`bottom-scrim ${scrimVisible ? 'is-visible' : ''}`} aria-hidden="true" />
      <button type="button" className="add-book-btn" onClick={() => setShowAddModal(true)}>
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
