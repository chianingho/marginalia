import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AddBookModal from '../components/AddBookModal.jsx'
import { fetchBooks } from '../api/books.js'
import { GROUP_BY_OPTIONS, buildShelfRows, loadGroupBy, saveGroupBy } from '../lib/shelves.js'

const GROUP_BY_SUBTITLE = { year: 'year', category: 'category' }

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

// 螢光筆刷背景：貫穿全頁的長 S/Z 型 —— 上半段（右上斜切過 Books 標題、彎向左掃過第一排書架）
// 維持不動，下半段接長：沿左緣往下 → 在第二排書架區域向右彎、斜切穿過 → 經過 Add Book 按鈕右側 → 收出右下角。
//
// 質感：6 條獨立 stroke 沿同一條主曲線做法線方向偏移，粗細（30–70px）、長短（有的只覆蓋一段）、
// opacity（各自 0.25–0.4，刻意不在外層統一設定，靠疊加處自然變濃做出層次）都不同；
// 每條各用不同 seed 的 feTurbulence + feDisplacementMap 讓邊緣毛糙不規則。
// mix-blend-mode: multiply 設在最外層 svg，讓黃色只染白底、黑字保持銳利。
function BooksBrushS() {
  const filters = [
    { id: 'brush-rough-1', freq: '0.025 0.045', seed: 11, scale: 18 },
    { id: 'brush-rough-2', freq: '0.03 0.02', seed: 23, scale: 22 },
    { id: 'brush-rough-3', freq: '0.02 0.05', seed: 37, scale: 20 },
    { id: 'brush-rough-4', freq: '0.035 0.025', seed: 47, scale: 16 },
    { id: 'brush-rough-5', freq: '0.045 0.03', seed: 59, scale: 24 },
    { id: 'brush-rough-6', freq: '0.028 0.048', seed: 61, scale: 19 },
  ]

  const strokes = [
    // 全長（上半段起點到右下角出口），偏移 (0,0)
    {
      filter: 'brush-rough-1',
      width: 62,
      opacity: 0.35,
      d: 'M 510,-30 C 445,206 111,81 40,320 C 5,420 60,460 90,520 C 160,600 280,560 340,660 C 400,730 430,760 520,860',
    },
    // 全長，偏移 (-18,+8)
    {
      filter: 'brush-rough-2',
      width: 48,
      opacity: 0.3,
      d: 'M 492,-22 C 427,214 93,89 22,328 C -13,428 42,468 72,528 C 142,608 262,568 322,668 C 382,738 412,768 502,868',
    },
    // 只覆蓋上半段（起點到第二排書架起點），偏移 (+14,-16)
    {
      filter: 'brush-rough-3',
      width: 68,
      opacity: 0.32,
      d: 'M 524,-46 C 459,190 125,65 54,304 C 19,404 74,444 104,504',
    },
    // 只覆蓋下半段（第二排書架起點到出口），偏移 (-10,+18)
    {
      filter: 'brush-rough-4',
      width: 40,
      opacity: 0.28,
      d: 'M 80,538 C 150,618 270,578 330,678 C 390,748 420,778 510,878',
    },
    // 短筆觸，只在標題附近起筆，偏移 (+20,+6)
    {
      filter: 'brush-rough-5',
      width: 34,
      opacity: 0.26,
      d: 'M 530,-24 C 465,212 131,87 60,326',
    },
    // 短筆觸，只在出口附近收筆，偏移 (-14,-10)
    {
      filter: 'brush-rough-6',
      width: 36,
      opacity: 0.27,
      d: 'M 326,650 C 386,720 416,750 506,850',
    },
  ]

  return (
    <svg className="bookshelf-brush-s" viewBox="0 0 620 920" aria-hidden="true">
      <defs>
        {filters.map((f) => (
          <filter key={f.id} id={f.id} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency={f.freq} numOctaves="3" seed={f.seed} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={f.scale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </defs>
      {strokes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          stroke="#FAFF00"
          strokeWidth={s.width}
          strokeLinecap="round"
          fill="none"
          opacity={s.opacity}
          filter={`url(#${s.filter})`}
        />
      ))}
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
      <BooksBrushS />

      <header className="bookshelf-header">
        <div className="bookshelf-header-titles">
          <p className="bookshelf-eyebrow">Marginalia</p>
          <h1 className="bookshelf-title">Books</h1>
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
