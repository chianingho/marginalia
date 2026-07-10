import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AddBookModal from '../components/AddBookModal.jsx'
import { fetchBooks } from '../api/books.js'
import { GROUP_BY_OPTIONS, buildShelfRows, loadGroupBy, saveGroupBy } from '../lib/shelves.js'

const GROUP_BY_SUBTITLE = { year: 'year', category: 'category' }

// 螢光黃纖維筆刷束（True Marker 回合做的質感，保留原封不動）：
// 3 條粗筆畫底色 + 12 條纖維細線 + 3 條細筆畫(一條斷筆) + 4 塊沒水乾段 patch，
// 整組包在 multiply 群組內，畫在文字「之後」（DOM 順序在後 = 疊在文字上面），黑字才透得出來。
// 座標沿用 True Marker 回合校準好的比例，只是現在整顆 SVG 改成置中掛在恢復後的置中標題下面。
const THICK_STROKES = [
  { points: '52,128 110,123 180,126 250,124 328,127 328,137 250,140 180,136 110,139 52,134' },
  { points: '50,146 120,142 200,145 270,143 330,147 330,154 270,158 200,153 120,156 50,151' },
  { points: '56,164 130,159 210,162 280,160 322,164 322,172 280,176 210,171 130,174 56,169' },
]

const FIBER_LINES = [
  { x1: 60, y1: 126, x2: 200, y2: 129, opacity: 0.8, width: 1.5 },
  { x1: 150, y1: 131, x2: 320, y2: 127, opacity: 0.6, width: 1 },
  { x1: 90, y1: 134, x2: 260, y2: 132, opacity: 0.9, width: 1.5 },
  { x1: 200, y1: 124, x2: 330, y2: 130, opacity: 0.55, width: 1 },
  { x1: 70, y1: 148, x2: 220, y2: 145, opacity: 0.85, width: 1.5 },
  { x1: 180, y1: 152, x2: 325, y2: 149, opacity: 0.65, width: 1 },
  { x1: 100, y1: 143, x2: 280, y2: 147, opacity: 0.95, width: 1.5 },
  { x1: 50, y1: 150, x2: 160, y2: 153, opacity: 0.6, width: 1 },
  { x1: 65, y1: 166, x2: 210, y2: 163, opacity: 0.75, width: 1.5 },
  { x1: 150, y1: 170, x2: 310, y2: 167, opacity: 0.6, width: 1 },
  { x1: 90, y1: 161, x2: 240, y2: 165, opacity: 0.9, width: 2 },
  { x1: 200, y1: 168, x2: 320, y2: 171, opacity: 0.55, width: 1 },
]

const THIN_STROKES = [
  // 斷筆：中間空 18px（194→212）
  { x1: 62, y1: 140, x2: 194, y2: 139, opacity: 0.68, width: 2.5 },
  { x1: 212, y1: 140, x2: 324, y2: 141, opacity: 0.68, width: 2.5 },
  { x1: 58, y1: 157, x2: 326, y2: 158, opacity: 0.6, width: 2 },
]

const DRY_PATCHES = [
  { x: 140, y: 122, width: 104, height: 16, opacity: 0.45 },
  { x: 244, y: 142, width: 62, height: 12, opacity: 0.5 },
  { x: 70, y: 159, width: 52, height: 13, opacity: 0.4 },
  { x: 292, y: 122, width: 36, height: 50, opacity: 0.3 }, // 右端收筆漸乾
]

function TitleBrush() {
  return (
    <svg className="bookshelf-title-brush" viewBox="0 0 380 190" aria-hidden="true">
      <defs>
        <filter id="marker-wobble" x="-10%" y="-30%" width="120%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.35" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="marker-dry" x="-10%" y="-30%" width="120%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.5" numOctaves="3" seed="17" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g style={{ mixBlendMode: 'multiply' }}>
        <g filter="url(#marker-wobble)">
          {THICK_STROKES.map((s, i) => (
            <polygon key={`thick-${i}`} points={s.points} fill="#F2FF00" opacity="0.5" />
          ))}
          {FIBER_LINES.map((l, i) => (
            <line
              key={`fiber-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="#F2FF00"
              strokeWidth={l.width}
              strokeLinecap="round"
              opacity={l.opacity}
            />
          ))}
          {THIN_STROKES.map((l, i) => (
            <line
              key={`thin-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="#F2FF00"
              strokeWidth={l.width}
              strokeLinecap="round"
              opacity={l.opacity}
            />
          ))}
        </g>
        <g filter="url(#marker-dry)">
          {DRY_PATCHES.map((p, i) => (
            <rect key={`dry-${i}`} x={p.x} y={p.y} width={p.width} height={p.height} fill="#FDFCFA" opacity={p.opacity} />
          ))}
        </g>
      </g>
    </svg>
  )
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
          <p className="bookshelf-eyebrow">Marginalia</p>
          <div className="bookshelf-title-wrap">
            <TitleBrush />
            <h1 className="bookshelf-title">Books</h1>
          </div>
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
