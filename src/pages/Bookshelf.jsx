import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import autoAnimate from '@formkit/auto-animate'
import AddBookModal from '../components/AddBookModal.jsx'
import BrandBanner from '../components/BrandBanner.jsx'
import AvatarMenu from '../components/AvatarMenu.jsx'
import { fetchBooks } from '../api/books.js'
import { buildShelfRows } from '../lib/shelves.js'
import { useOnboarding } from '../onboarding/useOnboarding.js'
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient.js'
import { useAuthSession } from '../lib/useAuthSession.js'
import { isGuestMode } from '../lib/guestMode.js'
import { useLocale } from '../i18n/i18n'

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

// 換行書架，沿用跟首頁橫向排一樣的墨綠 3D 層板元件，不拆不簡化；
// 最後一層不足額時 grid 自然靠左，層板照樣 left:0/right:0 滿寬。
// 書櫃頁預設狀態修正：不管有沒有作用中的篩選都走這個元件——沒有篩選＝
// 「All」，顯示全館書；有篩選（例如透過「篩選」面板加選 Reading）就顯示
// 該分類的書，一律平鋪、一列固定 4 本，不再有分組橫滑書架（.shelf-row，
// 已整組移除）跟這個換行書架並存的兩套邏輯。
// 修正批次（切換篩選重排動畫）：.wrap-shelf-track 是書卡（.wrap-shelf-book）
// 的直接父層，用 autoAnimate 掛上去——每列的欄數是固定的，切換 status/
// 年/月篩選時實際變動的是「這個位置的列裡有哪些書」，讓 auto-animate 觀察
// 這一層的子節點增減/搬動，書卡才會平滑補位而不是硬切。用 ref callback
// 直接呼叫 vanilla autoAnimate()（不是 useAutoAnimate() hook）是因為列數
// 會隨篩選結果動態增減，不是單一固定容器，hook 版本只設計給單一容器用。
// prefers-reduced-motion：auto-animate 預設就會偵測並自動停用動畫，這裡
// 沒有傳 disrespectUserMotionPreference，維持預設行為，不用另外處理。
function WrapShelf({ books }) {
  const { t } = useLocale()
  const rowsOf4 = chunk(books, 4)
  return (
    <div className="wrap-shelf" aria-label={t('shelf.booksAria')}>
      <div className="wrap-shelf-rows">
        {rowsOf4.map((group, index) => (
          <div className="wrap-shelf-row" key={index}>
            <div className="wrap-shelf-track" ref={(el) => el && autoAnimate(el)}>
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
  const { t } = useLocale()
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
              onClick={() => onToggleValue(facet, row.slug, row.label, row.key)}
            >
              {facet === 'status' ? t(`status.${row.key}`) : row.label}
              {isActive(facet, row.slug) && <span className="action-sheet-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// 修正批次（加入月份自動記錄）：Status/Category 維持原本可複選；Year/Month
// 改單選（multi:false）——選同一個 facet 裡的新值會直接取代舊值，不是疊加。
const FACETS = [
  { facet: 'status', multi: true },
  { facet: 'category', multi: true },
  { facet: 'year', multi: false },
  { facet: 'month', multi: false },
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
  const { session } = useAuthSession()
  const { t } = useLocale()
  const filterBtnRef = useRef(null)

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

  function toggleFilter(facet, slug, label, key) {
    setActiveFilters((prev) => {
      const exists = prev.some((f) => f.facet === facet && f.slug === slug)
      return exists ? prev.filter((f) => !(f.facet === facet && f.slug === slug)) : [...prev, { facet, slug, label, key }]
    })
  }

  // Year/Month 單選：選新值會先清掉這個 facet 原本選的值再放新的；再點一次
  // 目前已選中的值＝取消選取，這個 facet 回到「不限制」（清除選取後回到全部）。
  function toggleSingleFilter(facet, slug, label, key) {
    setActiveFilters((prev) => {
      const withoutFacet = prev.filter((f) => f.facet !== facet)
      const alreadySelected = prev.some((f) => f.facet === facet && f.slug === slug)
      return alreadySelected ? withoutFacet : [...withoutFacet, { facet, slug, label, key }]
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

  // 訪客模式下的登入入口（3-3）：跟登入頁同一顆 Google OAuth 觸發，走一般流程。
  async function handleGuestSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const searchFilteredBooks = useMemo(
    () => books.filter((book) => matchesQuery(book, query)),
    [books, query],
  )

  const selectedSlugsByFacet = useMemo(() => {
    const map = { status: new Set(), category: new Set(), year: new Set(), month: new Set() }
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

  // 書架資料載入完成（status 變 'ready'）後才可能觸發導覽，避免在空畫面/
  // loading 狀態就搶跑；DOM 目標是否真的存在由 useOnboarding 內部輪詢確認。
  useOnboarding(status === 'ready')

  return (
    <div className="bookshelf-page">
      <header className="bookshelf-header">
        <BrandBanner
          actions={
            <div className="bookshelf-filterrow-icons" data-tour="search-tools">
              <button
                type="button"
                className="pill-btn"
                onClick={toggleSearch}
                aria-label={searchOpen ? t('shelf.searchClose') : t('shelf.searchOpen')}
                aria-expanded={searchOpen}
              >
                <SearchIcon />
              </button>
              <button
                type="button"
                className="pill-btn"
                ref={filterBtnRef}
                onClick={() => setFilterOpen(true)}
                aria-label={t('shelf.filterAria')}
              >
                <FilterIcon />
              </button>
              {hasSupabaseConfig && session && <AvatarMenu session={session} sizeRefTarget={filterBtnRef} />}
              {hasSupabaseConfig && !session && isGuestMode() && (
                <button type="button" className="guest-signin-btn" onClick={handleGuestSignIn}>
                  {t('common.signIn')}
                </button>
              )}
            </div>
          }
        />

        <div className="bookshelf-filterrow">
          <p className="bookshelf-count">{t('shelf.count', { n: visibleBooks.length })}</p>
          {activeFilters.length > 0 && (
            <div className="filter-pills-row">
              {activeFilters.map((f) => (
                <button
                  key={`${f.facet}:${f.slug}`}
                  type="button"
                  className="filter-pill"
                  onClick={() => toggleFilter(f.facet, f.slug, f.label, f.key)}
                >
                  {f.facet === 'status' ? t(`status.${f.key}`) : f.label}
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
              placeholder={t('shelf.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ fontSize: '16px' }}
            />
          </div>
        )}
      </header>

      {status === 'loading' && <p className="bookshelf-status">{t('common.loading')}</p>}
      {status === 'error' && <p className="bookshelf-status form-error">{t('common.loadError', { error })}</p>}

      {status === 'ready' && books.length === 0 && (
        <p className="bookshelf-status empty-hint meta-text">{t('shelf.emptyAll')}</p>
      )}

      {status === 'ready' && books.length > 0 && activeFilters.length > 0 && visibleBooks.length === 0 && (
        <p className="bookshelf-status empty-hint">{t('shelf.emptyFiltered')}</p>
      )}

      {status === 'ready' && visibleBooks.length > 0 && (
        <div className="shelf-rows">
          <WrapShelf books={visibleBooks} />
        </div>
      )}

      <button
        type="button"
        className="add-book-btn btn-frosted"
        data-tour="add-book"
        onClick={() => setShowAddModal(true)}
      >
        <span className="add-book-btn-icon">＋</span>
        {t('shelf.addBook')}
      </button>

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />}

      {filterOpen && (
        <div className="action-sheet-backdrop" onClick={closeFilterSheet}>
          <div className="action-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="action-sheet-title">{t('shelf.filterTitle')}</p>
            {FACETS.map(({ facet, multi }) => (
              <FilterGroup
                key={facet}
                facet={facet}
                label={t(`facet.${facet}`)}
                rows={buildShelfRows(books, facet)}
                expanded={expandedFacets.has(facet)}
                onToggleExpand={() => toggleFacetExpanded(facet)}
                isActive={isFilterActive}
                onToggleValue={multi ? toggleFilter : toggleSingleFilter}
              />
            ))}
            <button type="button" className="action-sheet-cancel" onClick={closeFilterSheet}>
              {t('common.done')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
