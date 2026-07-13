import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import AddBookModal from '../components/AddBookModal.jsx'
import BrandBanner from '../components/BrandBanner.jsx'
import { fetchBooks } from '../api/books.js'
import { GROUP_BY_OPTIONS, buildShelfRows, loadGroupBy, saveGroupBy } from '../lib/shelves.js'

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

// 增補項 8：這個元件掛在 4 個路由（/、/shelf/all、/shelf/year/:slug、
// /shelf/category/:slug），只有真的用不同 URL「重新進站」（深連結、分享網址）
// 才需要從網址還原初始狀態；同個 session 內點 chip 用 history.replaceState
// 同步網址，不會觸發重新掛載，所以這個初始化只在 mount 當下跑一次即可。
function initialGroupByAndChip(pathname, slug) {
  if (pathname === '/shelf/all') return { groupBy: 'all', chip: null }
  if (pathname.startsWith('/shelf/year/')) return { groupBy: 'year', chip: slug ?? null }
  if (pathname.startsWith('/shelf/category/')) return { groupBy: 'category', chip: slug ?? null }
  return { groupBy: loadGroupBy(), chip: null }
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
      <circle cx="9" cy="7" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="12" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="17" r="2" fill="var(--color-bg)" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

// v2-E：isHero = Reading 排主角化，書封放大 1.25×、層板跟著等比調整。
// B-4：「各組一排橫滑」視圖已從 Year/Category 移除（改全館換行書架），
// ShelfRow 現在只服務 Status 模式，排標題與 See all 固定顯示，不再需要
// showLabel 開關。
function ShelfRow({ label, href, books, isHero = false }) {
  return (
    <div className={`shelf-row ${isHero ? 'shelf-row--hero' : ''}`}>
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

// 增補項 8-2/8-7：換行書架，chip 選中單一組、或「所有書籍」模式共用同一份
// 實作（不另外寫一份）。每層 3 本，沿用跟首頁橫向排一樣的墨綠 3D 層板元件，
// 不拆不簡化；最後一層不足額時 grid 自然靠左、層板照樣 left:0/right:0 滿寬。
// H-1-6：組名文字移除（label 只留給 aria-label 用），{n} books 保留。
function WrapShelf({ label, count, books }) {
  const rowsOf3 = chunk(books, 3)
  return (
    <div className="wrap-shelf" aria-label={label}>
      <div className="wrap-shelf-header">
        <span className="wrap-shelf-count meta-text">{count} books</span>
      </div>
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

export default function Bookshelf() {
  const location = useLocation()
  const { slug: urlSlug } = useParams()

  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [groupByState, setGroupByState] = useState(
    () => initialGroupByAndChip(location.pathname, urlSlug).groupBy,
  )
  const [selectedChip, setSelectedChip] = useState(
    () => initialGroupByAndChip(location.pathname, urlSlug).chip,
  )
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
    setGroupByState(value)
    setSelectedChip(null)
    saveGroupBy(value)
    setFilterOpen(false)
  }

  // 增補項 8-7：Cancel 固定回 Status 預設三排（跟原本「只關掉選單」的行為不同，
  // 因為 Status 這次拿掉了明列選項，Cancel 是唯一能回到預設三排視圖的入口）。
  function handleFilterCancel() {
    setFilterOpen(false)
    setGroupByState('status')
    setSelectedChip(null)
    saveGroupBy('status')
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
  const isGrouped = groupByState === 'year' || groupByState === 'category'
  const rows = isGrouped || groupByState === 'status' ? buildShelfRows(filteredBooks, groupByState) : []
  const selectedRow = isGrouped && selectedChip ? rows.find((row) => row.slug === selectedChip) : null

  // 增補項 8-4：URL 同步，不疊瀏覽歷史（history.replaceState，不是 push）。
  // 等 rows 算出來（status === 'ready'）才同步，避免載入中那瞬間先寫一次錯的網址。
  useEffect(() => {
    if (status !== 'ready') return
    let url = '/'
    if (groupByState === 'all') {
      url = '/shelf/all'
    } else if (isGrouped) {
      url = selectedChip ? `/shelf/${groupByState}/${encodeURIComponent(selectedChip)}` : '/'
    }
    if (window.location.pathname !== url) {
      window.history.replaceState(null, '', url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupByState, selectedChip, status])

  return (
    <div className="bookshelf-page">
      <header className="bookshelf-header">
        <BrandBanner>
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
        </BrandBanner>

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

      {/* 增補項 8-1：chips 只在 Year/Category 顯示，位置在橫幅下方一列，
          第一顆固定 All。組數只有 1 個也照樣顯示（All + 該組）。 */}
      {isGrouped && rows.length > 0 && (
        <div className="chip-row">
          <button
            type="button"
            className={`chip ${!selectedChip ? 'selected' : ''}`}
            onClick={() => setSelectedChip(null)}
          >
            All
          </button>
          {rows.map((row) => (
            <button
              key={row.slug}
              type="button"
              className={`chip ${selectedChip === row.slug ? 'selected' : ''}`}
              onClick={() => setSelectedChip(selectedChip === row.slug ? null : row.slug)}
            >
              {row.label}
            </button>
          ))}
        </div>
      )}

      {status === 'loading' && <p className="bookshelf-status">載入中…</p>}
      {status === 'error' && <p className="bookshelf-status form-error">載入失敗：{error}</p>}

      {status === 'ready' && books.length === 0 && (
        <p className="bookshelf-status empty-hint">書庫還是空的，點擊下方「Add Book」開始紀錄你的閱讀吧！</p>
      )}

      {/* B-4：Year/Category 模式下，All chip（或還沒選任何 chip）＝全館換行
          書架，跟 8-7「所有書籍」重用同一個 WrapShelf，不另寫一份。
          「各組一排橫滑」視圖從 Year/Category 移除，只剩 Status 模式保留。 */}
      {status === 'ready' && books.length > 0 && (groupByState === 'all' || (isGrouped && !selectedRow)) && (
        <div className="shelf-rows">
          <WrapShelf label="All Books" count={filteredBooks.length} books={filteredBooks} />
        </div>
      )}

      {status === 'ready' && books.length > 0 && isGrouped && selectedRow && (
        <div className="shelf-rows">
          <WrapShelf label={selectedRow.label} count={selectedRow.books.length} books={selectedRow.books} />
        </div>
      )}

      {status === 'ready' && books.length > 0 && groupByState === 'status' && (
        <div className="shelf-rows">
          {rows.map((row) => (
            <ShelfRow
              key={row.key}
              label={row.label}
              href={`/shelf/${groupByState}/${encodeURIComponent(row.slug)}`}
              books={row.books}
              isHero={row.key === 'reading'}
            />
          ))}
        </div>
      )}

      <button type="button" className="add-book-btn btn-frosted" onClick={() => setShowAddModal(true)}>
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
                {groupByState === option.value && <span className="action-sheet-check">✓</span>}
              </button>
            ))}
            <button type="button" className="action-sheet-cancel" onClick={handleFilterCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
