import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AddBookModal from '../components/AddBookModal.jsx'
import { fetchBooks } from '../api/books.js'
import { GROUP_BY_OPTIONS, buildShelfRows, loadGroupBy, saveGroupBy } from '../lib/shelves.js'

const GROUP_BY_SUBTITLE = { year: 'year', category: 'category' }

// 一痕螢光黃筆畫，只刷「Marginalia」這一行：寬度依實際量到的文字寬度計算（不寫死），
// 左右各外擴 10–16px；只有一條，不做多筆、不做乾段。顏色跟 wobble 濾鏡參數
// 跟 ShelfDetail.jsx 的 TitleStroke 是同一套值（#F2FF00、baseFrequency 0.02 0.35、scale 3）。
function MarginaliaBrush({ textWidth, polygonRef }) {
  if (!textWidth) return null
  const overhang = 13
  const w = Math.round(textWidth + overhang * 2)
  const h = 24 // Marginalia 字高(13px)的 1.6–2 倍，把整行字包住
  const points = `1,4 ${w - 1},1 ${w - 2},${h - 2} 2,${h - 1}`

  return (
    <svg
      className="bookshelf-marginalia-brush"
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: `${w}px`, height: `${h}px` }}
      aria-hidden="true"
    >
      <defs>
        <filter id="marginalia-wobble" x="-20%" y="-40%" width="140%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.35" numOctaves="2" seed="8" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <polygon
        ref={polygonRef}
        points={points}
        fill="#F2FF00"
        opacity="0.6"
        filter="url(#marginalia-wobble)"
        style={{ mixBlendMode: 'multiply' }}
      />
    </svg>
  )
}

// 量測文字實際墨緣（而非 CSS box）：Range.getBoundingClientRect() 緊貼渲染出來的字形範圍，
// 不受 text-align:center 置中或 letter-spacing 影響——不管父層版面怎麼置中，量到的都是
// 這段文字自己實際畫出來的位置。
function measureTextRect(el) {
  const range = document.createRange()
  range.selectNodeContents(el)
  return range.getBoundingClientRect()
}

// 筆刷下緣：用 polygon 自己的 getBBox()（未受 wobble 濾鏡扭曲前的幾何範圍）四個角
// 透過 getScreenCTM() 映射到螢幕座標，取最大 y（含 CSS rotate(-2deg) 在內都會算進去），
// 避免旋轉後單純取一個角落誤判下緣位置。
function measureBrushBottom(polygonEl) {
  if (!polygonEl) return null
  const svg = polygonEl.ownerSVGElement
  const ctm = svg?.getScreenCTM()
  if (!ctm) return null
  const bbox = polygonEl.getBBox()
  let maxY = -Infinity
  for (const [x, y] of [
    [bbox.x, bbox.y],
    [bbox.x + bbox.width, bbox.y],
    [bbox.x, bbox.y + bbox.height],
    [bbox.x + bbox.width, bbox.y + bbox.height],
  ]) {
    const pt = svg.createSVGPoint()
    pt.x = x
    pt.y = y
    const screenPt = pt.matrixTransform(ctm)
    if (screenPt.y > maxY) maxY = screenPt.y
  }
  return maxY
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
  const marginaliaWrapRef = useRef(null)
  const marginaliaRef = useRef(null)
  const titleRef = useRef(null)
  const brushPolygonRef = useRef(null)
  const [marginaliaWidth, setMarginaliaWidth] = useState(0)
  const [lockupOffset, setLockupOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    load()
  }, [])

  // 筆刷寬度跟著 Marginalia 文字量：字體還沒載入完成前用 fallback 字型量到的寬度先畫一版，
  // document.fonts.ready 之後用真的字體寬度重量一次並更新 state——這會讓筆刷 SVG 用新寬度
  // 重畫，下面對齊那個 effect 才會拿到跟文字真正對得上的筆刷幾何範圍。
  useEffect(() => {
    function measureWidth() {
      if (marginaliaRef.current) {
        setMarginaliaWidth(marginaliaRef.current.getBoundingClientRect().width)
      }
    }
    measureWidth()
    document.fonts.ready.then(measureWidth)
  }, [])

  // lockup 對齊：M 墨緣對齊 B 墨緣（水平）、筆刷下緣距 Books 字頂 1px（垂直）。
  // 用量測到的實際位置回推 delta，不寫死座標；Books 本身完全不動，只移動
  // Marginalia+筆刷這個 wrapper。要等筆刷用 marginaliaWidth 畫出來之後才量得到，
  // 所以掛在 [marginaliaWidth] 這個 effect，並且等 document.fonts.ready 後再量一次
  // （字體換上後字寬／字高都可能變）。
  useEffect(() => {
    if (!marginaliaWidth) return
    let cancelled = false

    function realign() {
      if (cancelled) return
      const wrapEl = marginaliaWrapRef.current
      const marginaliaEl = marginaliaRef.current
      const titleEl = titleRef.current
      const polygonEl = brushPolygonRef.current
      if (!wrapEl || !marginaliaEl || !titleEl || !polygonEl) return

      // 量測前先把目前套用的 transform 拿掉，量到的一定是「沒有位移」的基準位置。
      // 這支 effect 可能被連續呼叫好幾次（fallback 字型一次、字體載入完一次、resize、
      // React StrictMode 開發模式下 effect 還會重跑一次）——如果直接量「目前畫面上」的
      // 位置再拿上一輪算出的 offset 去回推基準值，一旦兩次呼叫的時序交錯，回推出來的
      // 基準值就會對不上，越算越歪。量測前後都用同步的 DOM 操作（不透過 React state），
      // 才能保證每次量到的都是真正的基準位置。
      const previousTransform = wrapEl.style.transform
      wrapEl.style.transform = 'none'

      const marginaliaRect = measureTextRect(marginaliaEl)
      const titleRect = measureTextRect(titleEl)
      const brushBottom = measureBrushBottom(polygonEl)

      wrapEl.style.transform = previousTransform

      if (brushBottom == null) return

      const deltaX = titleRect.left - marginaliaRect.left
      const currentGap = titleRect.top - brushBottom
      const deltaY = currentGap - 1 // 目標：筆刷下緣距 Books 字頂 = 1px

      setLockupOffset((prev) => (prev.x === deltaX && prev.y === deltaY ? prev : { x: deltaX, y: deltaY }))
    }

    realign()
    document.fonts.ready.then(realign)
    window.addEventListener('resize', realign)
    return () => {
      cancelled = true
      window.removeEventListener('resize', realign)
    }
  }, [marginaliaWidth])

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
          <div
            ref={marginaliaWrapRef}
            className="bookshelf-marginalia-wrap"
            style={{ transform: `translate(${lockupOffset.x}px, ${lockupOffset.y}px)` }}
          >
            <MarginaliaBrush textWidth={marginaliaWidth} polygonRef={brushPolygonRef} />
            <p className="bookshelf-marginalia" ref={marginaliaRef}>
              Marginalia
            </p>
          </div>
          <h1 className="bookshelf-title" ref={titleRef}>Books</h1>
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
