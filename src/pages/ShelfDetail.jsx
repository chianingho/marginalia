import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBooks } from '../api/books.js'
import { resolveShelfRow } from '../lib/shelves.js'

function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
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

  useEffect(() => {
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
  const rowsOf4 = row ? chunk(row.books, 4) : []

  return (
    <div className="shelf-detail-page">
      <header className="shelf-detail-header">
        <Link to="/" className="shelf-detail-back" aria-label="回首頁">
          ‹
        </Link>
        <h1 className="shelf-detail-title">{title}</h1>
      </header>

      {status === 'loading' && <p className="shelf-detail-status">載入中…</p>}
      {status === 'error' && <p className="shelf-detail-status form-error">載入失敗：{error}</p>}

      {status === 'ready' && (!row || row.books.length === 0) && (
        <p className="shelf-detail-status empty-hint">這一排還沒有書。</p>
      )}

      {status === 'ready' && row && row.books.length > 0 && (
        <div className="shelf-grid-rows">
          {rowsOf4.map((group, index) => (
            <ShelfGridRow key={index} books={group} />
          ))}
        </div>
      )}
    </div>
  )
}
