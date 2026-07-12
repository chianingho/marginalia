import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBooks } from '../api/books.js'
import { resolveShelfRow } from '../lib/shelves.js'

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

// 一痕螢光筆劃過標題文字：寬度依實際量到的文字寬度計算（不寫死），
// 左右各外擴 8–12px；只有一條，不做纖維束、不做乾段。
// 顏色用全站共用的 --color-highlight（tokens.css），wobble 濾鏡參數（scale ≤3）維持既有值。
function TitleStroke({ textWidth, titleFontSize = 22 }) {
  if (!textWidth) return null
  const overhang = 10
  const w = Math.round(textWidth + overhang * 2)
  const h = Math.round(titleFontSize * 0.7) // 標題字高的 0.6–0.8 倍
  const points = `1,3 ${w - 1},1 ${w - 2},${h - 2} 2,${h - 1}`

  return (
    <svg
      className="shelf-detail-title-brush"
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: `${w}px`, height: `${h}px` }}
      aria-hidden="true"
    >
      <defs>
        <filter id="shelf-title-wobble" x="-20%" y="-40%" width="140%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.35" numOctaves="2" seed="6" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <polygon
        points={points}
        fill="var(--color-highlight)"
        opacity="0.55"
        filter="url(#shelf-title-wobble)"
        style={{ mixBlendMode: 'multiply' }}
      />
    </svg>
  )
}

const UNCATEGORIZED_LABEL = 'Uncategorized'

// v2-D：分類 chips 目前只做前端篩選這一排「已經在畫面上的書」，不是查詢資料庫，
// 所以只列出這排書裡實際出現過的類別（不是固定七大類清單）——列出一個沒有任何
// 書對應的分類會是死路，篩了也是空的。八月要接的是「資料層真的支援類別查詢」，
// 不是這裡的清單來源。
function collectCategories(books) {
  const set = new Set(books.map((book) => book.category || UNCATEGORIZED_LABEL))
  return [...set].sort((a, b) => {
    if (a === UNCATEGORIZED_LABEL) return 1
    if (b === UNCATEGORIZED_LABEL) return -1
    return a.localeCompare(b, 'zh-Hant')
  })
}

function CategoryChips({ categories, selected, onSelect }) {
  if (categories.length < 2) return null
  return (
    <div className="chip-row">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`chip ${selected === category ? 'selected' : ''}`}
          onClick={() => onSelect(selected === category ? null : category)}
        >
          {category}
        </button>
      ))}
    </div>
  )
}

function ShelfGridRow({ books }) {
  return (
    <div className="shelf-grid-row">
      <div className="shelf-grid-track">
        {books.map((book) => (
          <Link to={`/book/${book.id}`} className="shelf-grid-book" key={book.id}>
            <span className="shelf-grid-book-cover">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} loading="lazy" />
              ) : (
                <span className="shelf-grid-book-placeholder">{book.title.slice(0, 1)}</span>
              )}
            </span>
          </Link>
        ))}
        <div className="shelf-grid-plank" aria-hidden="true">
          <div className="shelf-plank-top" />
          <div className="shelf-plank-front" />
        </div>
      </div>
    </div>
  )
}

export default function ShelfDetail() {
  const { groupBy, slug } = useParams()

  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')
  const [row, setRow] = useState(null)
  const [titleWidth, setTitleWidth] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const titleRef = useRef(null)

  useEffect(() => {
    setSelectedCategory(null) // 換排（不同 groupBy/slug）要重置篩選，不然選了的分類可能在新的一排裡完全不存在
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy, slug])

  async function load() {
    setStatus('loading')
    try {
      const data = await fetchBooks()
      setBooks(data)
      setRow(resolveShelfRow(data, groupBy, slug))
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const title = row?.label ?? '找不到這一排'
  const categories = row ? collectCategories(row.books) : []
  const visibleBooks = row
    ? selectedCategory
      ? row.books.filter((book) => (book.category || UNCATEGORIZED_LABEL) === selectedCategory)
      : row.books
    : []
  const rowsOf4 = chunk(visibleBooks, 4)

  useEffect(() => {
    if (titleRef.current) {
      setTitleWidth(titleRef.current.getBoundingClientRect().width)
    }
  }, [title])

  return (
    <div className="shelf-detail-page">
      <header className="shelf-detail-header">
        <Link to="/" className="shelf-detail-back" aria-label="回首頁">
          ‹
        </Link>
        <h1 className="shelf-detail-title">
          <span className="shelf-detail-title-inner" ref={titleRef}>
            {title}
            <TitleStroke textWidth={titleWidth} />
          </span>
        </h1>
      </header>

      {status === 'ready' && row && (
        <CategoryChips categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      )}

      {status === 'loading' && <p className="shelf-detail-status">載入中…</p>}
      {status === 'error' && <p className="shelf-detail-status form-error">載入失敗：{error}</p>}

      {status === 'ready' && (!row || visibleBooks.length === 0) && (
        <p className="shelf-detail-status empty-hint">這一排還沒有書。</p>
      )}

      {status === 'ready' && row && visibleBooks.length > 0 && (
        <div className="shelf-grid-rows">
          {rowsOf4.map((group, index) => (
            <ShelfGridRow key={index} books={group} />
          ))}
        </div>
      )}
    </div>
  )
}
