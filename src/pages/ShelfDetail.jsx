import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBooks } from '../api/books.js'
import { SHELF_DEFS, resolveShelfKey, shelfDefForSlug } from '../lib/shelves.js'

export default function ShelfDetail() {
  const { status: slug } = useParams()
  const def = shelfDefForSlug(slug) || SHELF_DEFS[1] // 找不到對應排時退回 Reading，避免壞掉

  const [books, setBooks] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.key])

  async function load() {
    setStatus('loading')
    try {
      const data = await fetchBooks()
      setBooks(data.filter((book) => resolveShelfKey(book) === def.key))
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="shelf-detail-page">
      <header className="shelf-detail-header">
        <Link to="/" className="shelf-detail-back" aria-label="回首頁">
          ‹
        </Link>
        <h1 className="shelf-detail-title">{def.label}</h1>
      </header>

      {status === 'loading' && <p className="shelf-detail-status">載入中…</p>}
      {status === 'error' && <p className="shelf-detail-status form-error">載入失敗：{error}</p>}

      {status === 'ready' && books.length === 0 && (
        <p className="shelf-detail-status empty-hint">這一排還沒有書。</p>
      )}

      {status === 'ready' && books.length > 0 && (
        <div className="shelf-detail-grid">
          {books.map((book) => (
            <Link to={`/books/${book.id}`} className="shelf-detail-cover" key={book.id}>
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} loading="lazy" />
              ) : (
                <span className="shelf-detail-placeholder">{book.title.slice(0, 1)}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
