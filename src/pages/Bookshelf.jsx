import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AddBookModal from '../components/AddBookModal.jsx'
import BrandBanner from '../components/BrandBanner.jsx'
import { fetchBooks } from '../api/books.js'
import { buildShelfRows } from '../lib/shelves.js'

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

function matchesQuery(book, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    book.title.toLowerCase().includes(q) ||
    (book.author || '').toLowerCase().includes(q)
  )
}

// Patch 03：facet 比對直接複用 buildShelfRows 的分組結果——某個 slug 被選中時，
// 該 row 的 books 就是「符合這個值」的書，多個選中值取聯集（組內 OR）；
// 不用另外寫 resolveYear/category 比對邏輯，跟首頁分組永遠是同一套規則。
function facetAllowedIds(books, facet, selectedSlugs) {
  if (selectedSlugs.size === 0) return null // null = 這組沒篩選，不限制
  const rows = buildShelfRows(books, facet)
  const ids = new Set()
  for (const row of rows) {
    if (selectedSlugs.has(row.slug)) row.books.forEach((b) => ids.add(b.id))
  }
  return ids
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

// v2-E：isHero = Reading 排主角化，書封放大 1.25×、層板跟著等比調整。
// B-4：「各組一排橫滑」視圖已從 Year/Category 移除（改全館換行書架），
// ShelfRow 現在只服務預設（無篩選）狀態。
// Patch 02 P2-3：「See all ›」拿掉，右側改純本數數字。
function ShelfRow({ label, books, isHero = false }) {
  return (
    <div className={`shelf-row ${isHero ? 'shelf-row--hero' : ''}`}>
      <div className="shelf-row-header">
        <span className="shelf-row-label">{label}</span>
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

// 增補項 8-2/8-7：換行書架，沿用跟首頁橫向排一樣的墨綠 3D 層板元件，不拆不簡化；
// 最後一層不足額時 grid 自然靠左，層板照樣 left:0/right:0 滿寬。
// Patch 03：現在只服務「有篩選條件」時的攤平結果，書量已經搬到篩選列左側
// 顯示，這裡不再需要自己的標頭/count，簽名跟著簡化成只吃 books。
function WrapShelf({ books }) {
  const rowsOf3 = chunk(books, 3)
  return (
    <div className="wrap-shelf" aria-label="Filtered results">
      <div className="wrap-shelf-rows">
        {rowsOf3.map((group, index) => (
          <div className="wrap-shelf-row" key={index}>
            <div className="wrap-shelf-track">
              {group.map((book) => (
                <Link to={`/book/${book.id}`} className="wrap-shelf-book" key={book.id}>
                  <span className="wrap-shelf-book-cover">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} loading="lazy" />
                    ) : (
                      <span className="wrap-shelf-book-placeholder">{book.title.slice(0, 1)}</span>
                    )}
                  </span>
                </Link>
              ))}
              <div className="wrap-shelf-plank" aria-hidden="true">
                <div className="shelf-plank-top" />
                <div className="shelf-plank-front" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Patch 03 P3-2：Status/Category/Year 三組篩選外觀跟互動完全統一，都是這個元件——
// 一顆展開/收合按鈕 + 展開後的可複選子清單，沿用 Patch 02 已經建好的
// .action-sheet-sublist/.action-sheet-suboption，只是從「只有 Category 用」
// 變成三組共用。
function FilterGroup({ facet, label, rows, expanded, onToggleExpand, isActive, onToggleValue }) {
  return (
    <div className="action-sheet-group">
      <button type="button" className="action-sheet-option" onClick={onToggleExpand} aria-expanded={expanded}>
        {label}
        <span aria-hidden="true">{expanded ? '−' : '＋'}</span>
      </button>
      {expanded && (
        <div className="action-sheet-sublist">
          {rows.map((row) => (
            <button
              key={row.slug}
              type="button"
              className="action-sheet-suboption"
              onClick={() => onToggleValue(facet, row.slug, row.label)}
            >
              {row.label}
              {isActive(facet, row.slug) && <span className="action-sheet-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const FACETS = [
  { facet: 'status', label: 'Status' },
  { facet: 'category', label: 'Category' },
  { facet: 'year', label: 'Year' },
]

export default function Bookshelf() {
  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [activeFilters, setActiveFilters] = useState([]) // [{facet, slug, label}]，依選取先後排列
  const [expandedFacets, setExpandedFacets] = useState(() => new Set())
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

  function toggleFilter(facet, slug, label) {
    setActiveFilters((prev) => {
      const exists = prev.some((f) => f.facet === facet && f.slug === slug)
      return exists ? prev.filter((f) => !(f.facet === facet && f.slug === slug)) : [...prev, { facet, slug, label }]
    })
  }

  function isFilterActive(facet, slug) {
    return activeFilters.some((f) => f.facet === facet && f.slug === slug)
  }

  function toggleFacetExpanded(facet) {
    setExpandedFacets((prev) => {
      const next = new Set(prev)
      next.has(facet) ? next.delete(facet) : next.add(facet)
      return next
    })
  }

  function closeFilterSheet() {
    setFilterOpen(false)
    setExpandedFacets(new Set())
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

  const searchFilteredBooks = useMemo(
    () => books.filter((book) => matchesQuery(book, query)),
    [books, query],
  )

  const selectedSlugsByFacet = useMemo(() => {
    const map = { status: new Set(), category: new Set(), year: new Set() }
    for (const f of activeFilters) map[f.facet].add(f.slug)
    return map
  }, [activeFilters])

  const visibleBooks = useMemo(() => {
    if (activeFilters.length === 0) return searchFilteredBooks
    const allowedByFacet = FACETS.map(({ facet }) =>
      facetAllowedIds(searchFilteredBooks, facet, selectedSlugsByFacet[facet]),
    )
    return searchFilteredBooks.filter((book) => allowedByFacet.every((ids) => ids === null || ids.has(book.id)))
  }, [searchFilteredBooks, activeFilters, selectedSlugsByFacet])

  const statusRows = useMemo(() => buildShelfRows(searchFilteredBooks, 'status'), [searchFilteredBooks])

  return (
    <div className="bookshelf-page">
      <header className="bookshelf-header">
        <BrandBanner
          actions={
            <div className="bookshelf-filterrow-icons">
              <button
                type="button"
                className="pill-btn"
                onClick={toggleSearch}
                aria-label={searchOpen ? '關閉搜尋' : '搜尋書櫃'}
                aria-expanded={searchOpen}
              >
                <SearchIcon />
              </button>
              <button type="button" className="pill-btn" onClick={() => setFilterOpen(true)} aria-label="篩選">
                <FilterIcon />
              </button>
            </div>
          }
        />

        <div className="bookshelf-filterrow">
          <p className="bookshelf-count">{visibleBooks.length} books</p>
          {activeFilters.length > 0 && (
            <div className="filter-pills-row">
              {activeFilters.map((f) => (
                <button
                  key={`${f.facet}:${f.slug}`}
                  type="button"
                  className="filter-pill"
                  onClick={() => toggleFilter(f.facet, f.slug, f.label)}
                >
                  {f.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}
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

      {status === 'ready' && books.length > 0 && activeFilters.length > 0 && visibleBooks.length === 0 && (
        <p className="bookshelf-status empty-hint">沒有符合篩選條件的書。</p>
      )}

      {status === 'ready' && activeFilters.length > 0 && visibleBooks.length > 0 && (
        <div className="shelf-rows">
          <WrapShelf books={visibleBooks} />
        </div>
      )}

      {status === 'ready' && books.length > 0 && activeFilters.length === 0 && (
        <div className="shelf-rows">
          {statusRows.map((row) => (
            <ShelfRow key={row.key} label={row.label} books={row.books} isHero={row.key === 'reading'} />
          ))}
        </div>
      )}

      <button type="button" className="add-book-btn btn-frosted" onClick={() => setShowAddModal(true)}>
        <span className="add-book-btn-icon">＋</span>
        Add Book
      </button>

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}

      {filterOpen && (
        <div className="action-sheet-backdrop" onClick={closeFilterSheet}>
          <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="action-sheet-title">Filter</p>
            {FACETS.map(({ facet, label }) => (
              <FilterGroup
                key={facet}
                facet={facet}
                label={label}
                rows={buildShelfRows(books, facet)}
                expanded={expandedFacets.has(facet)}
                onToggleExpand={() => toggleFacetExpanded(facet)}
                isActive={isFilterActive}
                onToggleValue={toggleFilter}
              />
            ))}
            <button type="button" className="action-sheet-cancel" onClick={closeFilterSheet}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
